"""
Treina os artefatos do pipeline de predição de solubilidade aquosa.

Por que este script existe: pipeline.py (o pipeline de referência) carrega
modelos e um scaler já treinados (`model_external_run_1.joblib`,
`modelo_rf_159rdkit.joblib` etc.) e uma lista de 159 descritores RDKit
refinados (`descritores_finais_159.json`) — nenhum desses arquivos está
neste repositório (o treino original foi feito em outro ambiente, provavelmente
com o dataset CASR-1/DrugBank mencionado no Briefing.md, que também não está
aqui). Para termos uma predição REAL (não uma simulação com números
inventados), este script treina, do zero, artefatos equivalentes usando o
dataset público ESOL/Delaney (1128 moléculas com solubilidade medida
experimentalmente) — o benchmark padrão da literatura para esta tarefa.

A arquitetura é a mesma de pipeline.py: descritores RDKit -> seleção de
atributos -> scaler -> modelo de regressão (stacking, com Lasso no
meta-estimador) -> modelo de erro (RandomForest sobre os descritores brutos,
prevendo o erro absoluto do modelo primário) -> calibração conformal (ESD)
sobre um conjunto de calibração nunca visto pelo modelo.

Rodar novamente (`python train_models.py`) sempre que quisermos re-treinar.
"""
from __future__ import annotations

import json
import os

import joblib
import numpy as np
import pandas as pd
from joblib import Parallel, delayed
from rdkit import Chem
from rdkit.Chem import Descriptors
from rdkit.ML.Descriptors import MoleculeDescriptors
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor, StackingRegressor
from sklearn.linear_model import Lasso, Ridge
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import cross_val_predict, train_test_split
from sklearn.preprocessing import RobustScaler

from conformal import ConformalPredictorESD
from domain import CONFORMAL_CONFIDENCE

HERE = os.path.dirname(__file__)
DATA_PATH = os.path.join(HERE, "data", "delaney-processed.csv")
MODELS_DIR = os.path.join(HERE, "models")
RANDOM_STATE = 42
MAX_FINAL_DESCRIPTORS = 150
CORRELATION_THRESHOLD = 0.95

# "Ipc" (índice de complexidade de informação) é um descritor RDKit conhecido
# por explodir para valores astronômicos em moléculas maiores, causando
# overflow numérico nos modelos lineares — excluído por estabilidade, prática
# comum em pipelines de QSAR.
_UNSTABLE_DESCRIPTORS = {"Ipc"}
RAW_DESCRIPTOR_NAMES = [name for name, _ in Descriptors._descList if name not in _UNSTABLE_DESCRIPTORS]


def _calc_row(smiles: str, names: list[str]) -> list[float]:
    calculator = MoleculeDescriptors.MolecularDescriptorCalculator(names)
    mol = Chem.MolFromSmiles(str(smiles))
    if mol is None:
        return [np.nan] * len(names)
    try:
        return list(calculator.CalcDescriptors(mol))
    except Exception:
        return [np.nan] * len(names)


def compute_raw_descriptors(smiles_list: list[str]) -> pd.DataFrame:
    print(f"Calculando {len(RAW_DESCRIPTOR_NAMES)} descritores RDKit para {len(smiles_list)} moléculas...")
    rows = Parallel(n_jobs=-1)(delayed(_calc_row)(smi, RAW_DESCRIPTOR_NAMES) for smi in smiles_list)
    return pd.DataFrame(rows, columns=RAW_DESCRIPTOR_NAMES)


def select_features(df: pd.DataFrame) -> list[str]:
    """Elimina redundâncias (NaN/constantes/correlação alta) — mesma ideia
    descrita no Briefing.md para chegar aos '159 descritores refinados'."""
    clean = df.replace([np.inf, -np.inf], np.nan)
    valid_cols = [c for c in clean.columns if clean[c].notna().all() and clean[c].std() > 1e-9]
    clean = clean[valid_cols]

    corr = clean.corr().abs()
    to_drop: set[str] = set()
    for i, col_i in enumerate(corr.columns):
        if col_i in to_drop:
            continue
        for col_j in corr.columns[i + 1 :]:
            if col_j in to_drop:
                continue
            if corr.loc[col_i, col_j] > CORRELATION_THRESHOLD:
                to_drop.add(col_j)
    survivors = [c for c in valid_cols if c not in to_drop]
    print(f"Descritores brutos: {len(df.columns)} -> após limpeza/correlação: {len(survivors)}")
    return survivors


def reduce_by_importance(X: pd.DataFrame, y: np.ndarray, max_features: int) -> list[str]:
    if len(X.columns) <= max_features:
        return list(X.columns)
    probe = RandomForestRegressor(n_estimators=300, random_state=RANDOM_STATE, n_jobs=-1)
    probe.fit(X, y)
    ranked = sorted(zip(X.columns, probe.feature_importances_), key=lambda t: t[1], reverse=True)
    selected = [name for name, _ in ranked[:max_features]]
    print(f"Seleção por importância: {len(X.columns)} -> {len(selected)} descritores finais")
    return selected


def build_primary_model() -> StackingRegressor:
    estimators = [
        ("rf", RandomForestRegressor(n_estimators=300, random_state=RANDOM_STATE, n_jobs=-1)),
        ("gbr", GradientBoostingRegressor(random_state=RANDOM_STATE)),
        ("ridge", Ridge(alpha=1.0)),
    ]
    return StackingRegressor(estimators=estimators, final_estimator=Lasso(alpha=0.01, max_iter=20000), n_jobs=-1)


def main() -> None:
    os.makedirs(MODELS_DIR, exist_ok=True)

    df = pd.read_csv(DATA_PATH)
    df = df.rename(columns={"measured log solubility in mols per litre": "logS", "smiles": "smiles"})
    df = df[["smiles", "logS"]].dropna()

    raw = compute_raw_descriptors(df["smiles"].tolist())
    raw["logS"] = df["logS"].values
    raw = raw.dropna(subset=["logS"])

    cleaned_cols = select_features(raw.drop(columns=["logS"]))
    data = raw[cleaned_cols + ["logS"]].dropna()

    train_df, temp_df = train_test_split(data, test_size=0.30, random_state=RANDOM_STATE)
    cal_df, test_df = train_test_split(temp_df, test_size=0.50, random_state=RANDOM_STATE)
    print(f"Split -> treino: {len(train_df)}, calibração: {len(cal_df)}, teste: {len(test_df)}")

    X_train_full = train_df[cleaned_cols]
    y_train = train_df["logS"].values

    final_descriptors = reduce_by_importance(X_train_full, y_train, MAX_FINAL_DESCRIPTORS)

    X_train = train_df[final_descriptors]
    X_cal = cal_df[final_descriptors]
    X_test = test_df[final_descriptors]
    y_cal = cal_df["logS"].values
    y_test = test_df["logS"].values

    scaler = RobustScaler().fit(X_train)
    X_train_scaled = scaler.transform(X_train)

    print("Treinando modelo primário (stacking, meta-estimador Lasso)...")
    model_primary = build_primary_model()
    model_primary.fit(X_train_scaled, y_train)

    print("Calculando predições fora-da-amostra (cross_val_predict) para treinar o modelo de erro...")
    cv_pred_train = cross_val_predict(build_primary_model(), X_train_scaled, y_train, cv=5, n_jobs=-1)
    abs_error_train = np.abs(y_train - cv_pred_train)

    print("Treinando modelo de erro (RandomForest sobre descritores brutos)...")
    model_error = RandomForestRegressor(n_estimators=300, random_state=RANDOM_STATE, n_jobs=-1)
    model_error.fit(X_train, abs_error_train)

    # Calibração conformal (ESD) — conjunto nunca visto pelo modelo primário nem pelo modelo de erro.
    y_cal_pred = model_primary.predict(scaler.transform(X_cal))
    q_e_cal = model_error.predict(X_cal)
    cp = ConformalPredictorESD(confidence=CONFORMAL_CONFIDENCE)
    cp.calibrate(y_cal, y_cal_pred, q_e_cal)
    print(f"Calibração conformal concluída. q={cp.q:.4f} (confiança={CONFORMAL_CONFIDENCE:.0%})")

    # Avaliação honesta em teste (nunca visto por nenhum dos modelos acima).
    y_test_pred = model_primary.predict(scaler.transform(X_test))
    q_e_test = model_error.predict(X_test)
    lower, upper = cp.predict_interval(y_test_pred, q_e_test)
    coverage = float(np.mean((y_test >= lower) & (y_test <= upper)))
    mae = float(mean_absolute_error(y_test, y_test_pred))
    r2 = float(r2_score(y_test, y_test_pred))
    print(f"Teste -> MAE={mae:.3f}  R2={r2:.3f}  cobertura do intervalo={coverage:.1%}")

    joblib.dump(model_primary, os.path.join(MODELS_DIR, "model_primary.joblib"))
    joblib.dump(scaler, os.path.join(MODELS_DIR, "scaler_primary.joblib"))
    joblib.dump(model_error, os.path.join(MODELS_DIR, "model_error.joblib"))
    joblib.dump(cp, os.path.join(MODELS_DIR, "conformal_calibrator.joblib"))
    with open(os.path.join(MODELS_DIR, "descriptors.json"), "w") as f:
        json.dump(final_descriptors, f)
    with open(os.path.join(MODELS_DIR, "training_report.json"), "w") as f:
        json.dump(
            {
                "dataset": "ESOL/Delaney (deepchem/deepchem, 1128 moléculas, solubilidade medida)",
                "n_train": len(train_df),
                "n_calibration": len(cal_df),
                "n_test": len(test_df),
                "n_raw_descriptors": len(RAW_DESCRIPTOR_NAMES),
                "n_final_descriptors": len(final_descriptors),
                "conformal_confidence": CONFORMAL_CONFIDENCE,
                "conformal_q": cp.q,
                "test_mae": mae,
                "test_r2": r2,
                "test_interval_coverage": coverage,
            },
            f,
            indent=2,
        )
    print(f"Artefatos salvos em {MODELS_DIR}")


if __name__ == "__main__":
    main()
