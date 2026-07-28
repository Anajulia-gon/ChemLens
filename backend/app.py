"""
Aqueous solubility prediction API + uncertainty quantification (UQ).

Implements the same flow as pipeline.py: RDKit descriptors -> primary model
(stacking) -> error model -> conformal interval (ESD) -> classification and
alerts. Trained artifacts come from `train_models.py` (see there for why).
"""
from __future__ import annotations

import os
import re
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rdkit import Chem

import storage
from chemistry import generate_chemical_properties_and_warnings
from classification import generate_status
from descriptors import calculate_descriptors, calculate_missing_descriptors, load_descriptor_names, make_calculator
from domain import RADAR_AXES, RADAR_REFERENCE_RANGES, SOLUBILITY_LABELS_EN
from novelty import canonical_smiles, load_known_smiles

HERE = os.path.dirname(__file__)
MODELS_DIR = os.path.join(HERE, "models")
INVISIBLE_CHARS = re.compile("[​-‏⁠﻿ ]")

DESCRIPTOR_NAMES = load_descriptor_names()
CALCULATOR = make_calculator(DESCRIPTOR_NAMES)
SCALER = joblib.load(os.path.join(MODELS_DIR, "scaler_primary.joblib"))
MODEL_PRIMARY = joblib.load(os.path.join(MODELS_DIR, "model_primary.joblib"))
MODEL_ERROR = joblib.load(os.path.join(MODELS_DIR, "model_error.joblib"))
CONFORMAL = joblib.load(os.path.join(MODELS_DIR, "conformal_calibrator.joblib"))
KNOWN_SMILES = load_known_smiles()

app = FastAPI(title="SolvUQ - Solubility Prediction")
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


class DeleteMoleculesRequest(BaseModel):
    ids: list[int]


def normalize_smiles(raw: str) -> str:
    return INVISIBLE_CHARS.sub("", raw).strip()


def compute_display_descriptors(mol) -> dict:
    """The 11 'friendly' descriptors pipeline.py explicitly renames, used in
    the table/radar of physico-chemical properties — computed directly
    (independent of which 150 descriptors the ML model actually uses)."""
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


def build_alerts(chem: dict, reliability: dict, is_novel: bool) -> list[dict]:
    alerts: list[dict] = []

    if is_novel and reliability["status"] != "High Confidence":
        alerts.append(
            {
                "key": "Novel molecule",
                "val": "This structure is not present in the dataset used to train the model. "
                "Synthesis and experimental validation are recommended before prioritizing this compound.",
            }
        )

    if chem["pains_alert"]:
        alerts.append(
            {
                "key": "PAINS alert",
                "val": "The structure contains substructure(s) flagged by the PAINS filter — risk of "
                "assay interference (false positive).",
            }
        )
    if chem["brenk_alert"]:
        alerts.append(
            {
                "key": "Brenk alert",
                "val": "The structure contains problematic functional group(s) flagged by the Brenk filter.",
            }
        )
    if chem["toxic_atoms"]:
        alerts.append(
            {
                "key": "Toxic atoms",
                "val": f"Contains potentially toxic atom(s): {chem['toxic_atoms']}.",
            }
        )
    if chem["lead_violations"]:
        alerts.append(
            {
                "key": "Leadlikeness rules",
                "val": "Violations: " + "; ".join(chem["lead_violations"]) + ".",
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

    # Each molecule goes through two independent filters: (1) the SMILES must
    # be parseable by RDKit, (2) the computed descriptors must all be finite
    # numbers — some unusual structures make certain RDKit descriptors blow
    # up to infinity, and that must NOT crash the prediction for the other
    # molecules in the same batch (SCALER.transform/predict run in batch — a
    # single bad row used to crash the whole request).
    valid_items = []
    for item in payload.molecules:
        smi = normalize_smiles(item.smiles)
        mol = Chem.MolFromSmiles(smi)
        if mol is None:
            invalid.append({"id": item.id, "smiles": item.smiles, "name": item.name, "reason": "Invalid SMILES"})
            continue

        descriptor_vector = calculate_descriptors(smi, CALCULATOR, len(DESCRIPTOR_NAMES))
        if not np.all(np.isfinite(descriptor_vector)):
            invalid.append(
                {
                    "id": item.id,
                    "smiles": item.smiles,
                    "name": item.name,
                    "reason": "Failed to compute descriptors for this structure",
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
            is_novel = canonical_smiles(smi) not in KNOWN_SMILES

            results.append(
                {
                    "id": item.id,
                    "smiles": smi,
                    "name": item.name or "Molecule",
                    "logS": round(logs, 2),
                    "margin": round(margin, 2),
                    "lowerBound": round(lower, 2),
                    "upperBound": round(upper, 2),
                    "status": reliability["status"],
                    "predictedClass": reliability["pred_class"],
                    "predictedClassLabel": SOLUBILITY_LABELS_EN[reliability["pred_class"]],
                    "classTag": reliability["class_tag"],
                    "alertName": reliability["alert_name"],
                    "alertDescription": reliability["description"],
                    "descriptors": display_desc,
                    "isNovel": is_novel,
                    "alerts": build_alerts(chem, reliability, is_novel),
                }
            )

    radar_ranges = {k: {"min": v[0], "max": v[1]} for k, v in RADAR_REFERENCE_RANGES.items()}
    return storage.save_study(results, invalid, RADAR_AXES, radar_ranges, len(results))


@app.get("/studies")
def get_studies():
    return storage.list_studies()


@app.get("/studies/{study_id}")
def get_study(study_id: int):
    study = storage.load_study(study_id)
    if study is None:
        raise HTTPException(status_code=404, detail="Study not found")
    return study


@app.delete("/studies/{study_id}")
def delete_study(study_id: int):
    if not storage.delete_study(study_id):
        raise HTTPException(status_code=404, detail="Study not found")
    return {"deleted": True}


@app.post("/studies/{study_id}/delete-molecules")
def delete_molecules(study_id: int, payload: DeleteMoleculesRequest):
    study = storage.load_study(study_id)
    if study is None:
        raise HTTPException(status_code=404, detail="Study not found")

    ids_to_remove = set(payload.ids)
    study["results"] = [r for r in study["results"] if r["id"] not in ids_to_remove]
    study["molCount"] = len(study["results"])
    storage.overwrite_study(study)
    return study
