"""
API de predição de solubilidade aquosa + quantificação de incerteza (UQ).

Implementa o mesmo fluxo de pipeline.py: descritores RDKit -> modelo primário
(stacking) -> modelo de erro -> intervalo conformal (ESD) -> classificação e
alertas. Os artefatos treinados vêm de `train_models.py` (ver ali o porquê).
"""
from __future__ import annotations

import os
import re
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rdkit import Chem

from chemistry import generate_chemical_properties_and_warnings
from classification import generate_status
from descriptors import calculate_descriptors, calculate_missing_descriptors, load_descriptor_names, make_calculator
from domain import RADAR_AXES, RADAR_REFERENCE_RANGES, SOLUBILITY_LABELS_PT

HERE = os.path.dirname(__file__)
MODELS_DIR = os.path.join(HERE, "models")
INVISIBLE_CHARS = re.compile("[​-‏⁠﻿ ]")

DESCRIPTOR_NAMES = load_descriptor_names()
CALCULATOR = make_calculator(DESCRIPTOR_NAMES)
SCALER = joblib.load(os.path.join(MODELS_DIR, "scaler_primary.joblib"))
MODEL_PRIMARY = joblib.load(os.path.join(MODELS_DIR, "model_primary.joblib"))
MODEL_ERROR = joblib.load(os.path.join(MODELS_DIR, "model_error.joblib"))
CONFORMAL = joblib.load(os.path.join(MODELS_DIR, "conformal_calibrator.joblib"))

app = FastAPI(title="SolvUQ - Predição de Solubilidade")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class MoleculeIn(BaseModel):
    id: int
    smiles: str
    name: Optional[str] = None


class PredictRequest(BaseModel):
    molecules: list[MoleculeIn]


def normalize_smiles(raw: str) -> str:
    return INVISIBLE_CHARS.sub("", raw).strip()


def compute_display_descriptors(mol) -> dict:
    """Os 11 descritores 'amigáveis' que pipeline.py renomeia explicitamente,
    usados na tabela/])radar de propriedades físico-químicas — calculados
    diretamente (independem de quais 150 descritores o modelo de ML usa)."""
    from rdkit.Chem import Descriptors

    missing = calculate_missing_descriptors(Chem.MolToSmiles(mol))
    return {
        "MolWt": round(Descriptors.MolWt(mol), 2),
        "nRig": missing["nRig"],
        "fChar": missing["fChar"],
        "NumHeteroatoms": Descriptors.NumHeteroatoms(mol),
        "MaxRing": missing["MaxRing"],
        "RingCount": Descriptors.RingCount(mol),
        "NumRotatableBonds": Descriptors.NumRotatableBonds(mol),
        "TPSA": round(Descriptors.TPSA(mol), 2),
        "NHOHCount": Descriptors.NHOHCount(mol),
        "nHA": missing["nHA"],
        "MolLogP": round(Descriptors.MolLogP(mol), 2),
    }


def build_alerts(chem: dict, reliability: dict) -> list[dict]:
    alerts: list[dict] = []

    if reliability["status"] != "High Confidence":
        alerts.append({"key": reliability["alert_name"], "val": reliability["description"]})

    if chem["pains_alert"]:
        alerts.append(
            {
                "key": "Alerta PAINS",
                "val": "A estrutura contém subestrutura(s) sinalizada(s) pelo filtro PAINS — risco de "
                "interferência em ensaios (falso-positivo).",
            }
        )
    if chem["brenk_alert"]:
        alerts.append(
            {
                "key": "Alerta Brenk",
                "val": "A estrutura contém grupo(s) funcional(is) problemático(s) sinalizado(s) pelo filtro Brenk.",
            }
        )
    if chem["toxic_atoms"]:
        alerts.append(
            {
                "key": "Átomos tóxicos",
                "val": f"Contém átomo(s) potencialmente tóxico(s): {chem['toxic_atoms']}.",
            }
        )
    if chem["lead_violations"]:
        alerts.append(
            {
                "key": "Regras de leadlikeness",
                "val": "Violações: " + "; ".join(chem["lead_violations"]) + ".",
            }
        )

    return alerts


@app.get("/health")
def health():
    return {"status": "ok", "n_descriptors": len(DESCRIPTOR_NAMES)}


@app.post("/predict")
def predict(payload: PredictRequest):
    results = []
    invalid = []

    # Cada molécula passa por dois filtros independentes: (1) o SMILES precisa
    # ser parseável pelo RDKit, (2) os descritores calculados precisam ser
    # todos números finitos — algumas estruturas incomuns fazem certos
    # descritores RDKit estourarem para infinito, e isso NÃO pode derrubar a
    # predição das outras moléculas do mesmo lote (SCALER.transform/predict
    # rodam em lote — uma linha ruim quebrava a requisição inteira antes).
    valid_items = []
    for item in payload.molecules:
        smi = normalize_smiles(item.smiles)
        mol = Chem.MolFromSmiles(smi)
        if mol is None:
            invalid.append({"id": item.id, "smiles": item.smiles, "name": item.name, "reason": "SMILES inválido"})
            continue

        descriptor_vector = calculate_descriptors(smi, CALCULATOR, len(DESCRIPTOR_NAMES))
        if not np.all(np.isfinite(descriptor_vector)):
            invalid.append(
                {
                    "id": item.id,
                    "smiles": item.smiles,
                    "name": item.name,
                    "reason": "Falha ao calcular descritores para esta estrutura",
                }
            )
            continue

        valid_items.append((item, smi, mol, descriptor_vector))

    if valid_items:
        raw_vectors = pd.DataFrame(
            [vector for _, _, _, vector in valid_items],
            columns=DESCRIPTOR_NAMES,
        )
        scaled_vectors = SCALER.transform(raw_vectors)
        logs_pred = MODEL_PRIMARY.predict(scaled_vectors)
        uncertainty_pred = MODEL_ERROR.predict(raw_vectors)
        lower_bounds, upper_bounds = CONFORMAL.predict_interval(logs_pred, uncertainty_pred)

        for (item, smi, mol, _), logs, lower, upper in zip(valid_items, logs_pred, lower_bounds, upper_bounds):
            logs = float(logs)
            lower = float(lower)
            upper = float(upper)
            margin = (upper - lower) / 2

            reliability = generate_status(logs, lower, upper)
            chem = generate_chemical_properties_and_warnings(smi)
            display_desc = compute_display_descriptors(mol)
            display_desc["logS"] = round(logs, 2)

            results.append(
                {
                    "id": item.id,
                    "smiles": smi,
                    "name": item.name or "Molécula",
                    "logS": round(logs, 2),
                    "margin": round(margin, 2),
                    "lowerBound": round(lower, 2),
                    "upperBound": round(upper, 2),
                    "status": reliability["status"],
                    "predictedClass": reliability["pred_class"],
                    "predictedClassLabel": SOLUBILITY_LABELS_PT[reliability["pred_class"]],
                    "descriptors": display_desc,
                    "alerts": build_alerts(chem, reliability),
                }
            )

    return {
        "results": results,
        "invalid": invalid,
        "radarAxes": RADAR_AXES,
        "radarRanges": {k: {"min": v[0], "max": v[1]} for k, v in RADAR_REFERENCE_RANGES.items()},
    }
