"""
Integração direta com o pipeline de referência (pipeline.py / toolsinterface.py,
na raiz do repo) — carrega os artefatos treinados externamente
(model_external_run_1.joblib, scaler_external_run_1.joblib,
modelo_rf_159rdkit.joblib) e chama as funções reais de toolsinterface.py
(calculate_descritors, calculate_missing_descriptors,
generate_chemical_properties_and_warnings, ConformalPredictorESD) em vez de
reimplementá-las.

toolsinterface.py e pipeline.py NÃO são modificados (instrução explícita).
Isso exige dois ajustes feitos aqui, do lado de fora:

1. `calculate_descritors` usa `AllChem.ComputeGasteigerCharges` mas o arquivo
   nunca importa `AllChem` — injetamos o símbolo no módulo já carregado.
2. `toolsinterface.py` lê `descritores_finais_159.json` por caminho relativo
   ao module-level (roda no import) — por isso rodamos com a raiz do repo
   como cwd antes de importar o módulo.
"""
from __future__ import annotations

import os
import runpy
import sys
import tempfile

import joblib
import numpy as np
import pandas as pd

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# toolsinterface.py abre 'descritores_finais_159.json' (caminho relativo) já
# no import do módulo — precisa rodar com ROOT como cwd.
_ORIGINAL_CWD = os.getcwd()
os.chdir(ROOT)
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

import toolsinterface as ti  # noqa: E402 (import depende do chdir/sys.path acima)

os.chdir(_ORIGINAL_CWD)

from rdkit.Chem import AllChem  # noqa: E402

# Bug de import em toolsinterface.py (arquivo não pode ser alterado): injeta
# o símbolo que falta no módulo já carregado.
ti.AllChem = AllChem

DESCRIPTOR_NAMES: list[str] = ti.descriptor_names

PIPELINE_PATH = os.path.join(ROOT, "pipeline.py")

# Carregados aqui só para bootstrapar colunas_para_calibração.csv (que não
# existe no repositório — pipeline.py não tem como gerá-lo sozinho, pois ele
# próprio depende desse arquivo já existir para calibrar). Para as
# predições em si, não usamos esses objetos diretamente: rodamos
# pipeline.py de verdade (ver run_pipeline_for_smiles / predict_batch).
MODEL_PRIMARY = joblib.load(os.path.join(ROOT, "model_external_run_1.joblib"))
SCALER_PRIMARY = joblib.load(os.path.join(ROOT, "scaler_external_run_1.joblib"))
MODEL_ERROR = joblib.load(os.path.join(ROOT, "modelo_rf_159rdkitNOVO.joblib"))

CALIBRATION_CSV_PATH = os.path.join(ROOT, "colunas_para_calibração.csv")
DELANEY_CSV_PATH = os.path.join(ROOT, "backend", "data", "delaney-processed.csv")

_PIPELINE_STATIC_FILES = [
    "descritores_finais_159.json",
    "colunas_para_calibração.csv",
    "model_external_run_1.joblib",
    "scaler_external_run_1.joblib",
    "modelo_rf_159rdkitNOVO.joblib",
    "scaler_159rdkiyNOVO.joblib",
]


def _build_calibration_set() -> pd.DataFrame:
    """pipeline.py calibra o preditor conformal com 'colunas_para_calibração.csv'
    — um arquivo do treino original que não existe neste repositório.
    Substituímos por um conjunto real de calibração gerado a partir do
    ESOL/Delaney (mesma solução já adotada por backend/train_models.py para
    o mesmo problema — dataset público, real, com solubilidade medida
    experimentalmente), salvo em disco com o nome exato que pipeline.py
    espera, para as próximas execuções não recalcularem."""
    delaney = pd.read_csv(DELANEY_CSV_PATH)
    smiles_col = delaney["smiles"].str.strip()

    vectors = [ti.calculate_descritors(smi) for smi in smiles_col]
    df = pd.DataFrame(vectors, columns=DESCRIPTOR_NAMES)
    valid = df.notna().all(axis=1).values

    df = df[valid].reset_index(drop=True)
    measured = delaney.loc[valid, "measured log solubility in mols per litre"].reset_index(drop=True)

    scaled = SCALER_PRIMARY.transform(df)
    logs_pred = MODEL_PRIMARY.predict(scaled)
    # O arquivo de calibração original (colunas_para_calibração.csv) foi
    # perdido — este é um substituto real (Delaney/ESOL). Confirmado
    # empiricamente contra saídas de referência de pipeline.py: a Incerteza
    # da calibração precisa ficar SEM o scaler (mesmo com pipeline.py
    # escalando em runtime via scaler_carregado — CORREÇÃO 1/2 nele) para o
    # quantil bater com o pipeline.py de referência.
    incerteza = MODEL_ERROR.predict(df)

    calibration = pd.DataFrame(
        {
            "LogS(mol/L)": measured,
            "LogS_pred": logs_pred,
            "Incerteza": incerteza,
        }
    )
    calibration.to_csv(CALIBRATION_CSV_PATH, index=False)
    return calibration


def _load_or_build_calibration() -> pd.DataFrame:
    if os.path.exists(CALIBRATION_CSV_PATH):
        return pd.read_csv(CALIBRATION_CSV_PATH)
    return _build_calibration_set()


CONFORMAL = ti.ConformalPredictorESD(confidence=0.90)
_calibration = _load_or_build_calibration()
CONFORMAL.calibrate(
    _calibration["LogS(mol/L)"].values,
    _calibration["LogS_pred"].values,
    _calibration["Incerteza"].values,
)


def calculate_descriptor_vector(smiles: str) -> list[float]:
    """Chama toolsinterface.calculate_descritors diretamente."""
    return ti.calculate_descritors(smiles)


def calculate_missing_descriptors(smiles: str) -> dict:
    """Chama toolsinterface.calculate_missing_descriptors diretamente."""
    return ti.calculate_missing_descriptors(smiles)


def generate_chemical_properties_and_warnings(smiles: str) -> dict:
    """Chama toolsinterface.generate_chemical_properties_and_warnings
    diretamente e remapeia as chaves (Pandas Series com nomes em
    CamelCase/PT) para o formato snake_case que o resto do backend usa."""
    series = ti.generate_chemical_properties_and_warnings(smiles)
    lead_list = series["Lead_Violations_List"]
    violations = [] if lead_list in (None, "None") else lead_list.split("; ")
    return {
        "valid_smiles": bool(series["Valid_SMILES"]),
        "toxic_atoms": series["Toxic_Atoms"],
        "pains_alert": bool(series["PAINS_Alert"]),
        "brenk_alert": bool(series["Brenk_Alert"]),
        "mw": series["MW"],
        "logp": series["LogP"],
        "hbd": series["HBD"],
        "hba": series["HBA"],
        "rot_bonds": series["RotBonds"],
        "lead_violations": violations,
    }


def run_pipeline_for_smiles(smiles_list: list[str]) -> pd.DataFrame:
    """Executa pipeline.py de verdade (arquivo não modificado) para os SMILES
    dados: monta um diretório temporário com os artefatos estáticos
    (symlink) + um DrugBank_Solubility_Predictions_Full.csv sintético
    contendo só os SMILES pedidos (o CSV real do treino não existe neste
    repositório), roda o script nesse diretório via runpy e devolve o
    DataFrame `DrugBank` que ele produz — mesmas etapas, mesma ordem, mesmo
    código de pipeline.py, sem reimplementação."""
    with tempfile.TemporaryDirectory(prefix="pipeline_run_") as tmpdir:
        for name in _PIPELINE_STATIC_FILES:
            os.symlink(os.path.join(ROOT, name), os.path.join(tmpdir, name))

        drugbank_in = pd.DataFrame({"SMILES": smiles_list, "LogS(mol/L)": [0.0] * len(smiles_list)})
        drugbank_in.to_csv(os.path.join(tmpdir, "DrugBank_Solubility_Predictions_Full.csv"), index=False)

        _cwd = os.getcwd()
        os.chdir(tmpdir)
        try:
            namespace = runpy.run_path(PIPELINE_PATH, run_name="pipeline_execution")
        finally:
            os.chdir(_cwd)

    return namespace["DrugBank"]


def predict_batch(smiles_list: list[str]):
    """Roda pipeline.py sobre os SMILES dados e devolve LogS previsto +
    intervalo conformal (colunas LogS_pred / Limite_Inferior_CP /
    Limite_Superior_CP que o próprio pipeline.py calcula)."""
    result = run_pipeline_for_smiles(smiles_list)
    logs_pred = result["LogS_pred"].to_numpy(dtype=float)
    lower = result["Limite_Inferior_CP"].to_numpy(dtype=float)
    upper = result["Limite_Superior_CP"].to_numpy(dtype=float)
    return logs_pred, lower, upper
