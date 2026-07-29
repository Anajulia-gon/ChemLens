"""
Cálculo de descritores moleculares via RDKit.

Portado de toolsinterface.py, com os bugs de import corrigidos: o original
usava `MoleculeDescriptors`, `AllChem` e `np` sem importá-los, e não existe
`descritores_finais_159.json` neste repositório (o modelo treinado original
não está disponível). Aqui a lista final de descritores é a produzida por
`backend/train_models.py` via seleção de atributos (ver ali), salva em
`models/descriptors.json`, cumprindo o mesmo papel arquitetural.
"""
from __future__ import annotations

import json
import os

import numpy as np
from rdkit import Chem
from rdkit.Chem import AllChem, Lipinski, rdMolDescriptors
from rdkit.ML.Descriptors import MoleculeDescriptors

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


def load_descriptor_names(path: str | None = None) -> list[str]:
    path = path or os.path.join(MODELS_DIR, "descriptors.json")
    with open(path, "r") as f:
        return json.load(f)


def make_calculator(descriptor_names: list[str]) -> MoleculeDescriptors.MolecularDescriptorCalculator:
    return MoleculeDescriptors.MolecularDescriptorCalculator(descriptor_names)


def calculate_descriptors(smiles: str, calculator, n_descriptors: int) -> list[float]:
    mol = Chem.MolFromSmiles(str(smiles))
    if mol is None:
        return [np.nan] * n_descriptors

    try:
        Chem.SanitizeMol(mol)
        AllChem.ComputeGasteigerCharges(mol)
    except Exception:
        pass

    try:
        return list(calculator.CalcDescriptors(mol))
    except Exception:
        return [np.nan] * n_descriptors


def calculate_missing_descriptors(smi: str) -> dict:
    """Calcula nHA, fChar, MaxRing e nRig — os 4 descritores "amigáveis" que
    não vêm prontos do calculador padrão do RDKit."""
    try:
        mol = Chem.MolFromSmiles(smi)
        if mol is None:
            return {"nHA": None, "fChar": None, "MaxRing": None, "nRig": None}

        nHA = Lipinski.NumHAcceptors(mol)
        fChar = Chem.GetFormalCharge(mol)

        ring_info = mol.GetRingInfo().AtomRings()
        max_ring = max((len(r) for r in ring_info), default=0)

        total_bonds = mol.GetNumBonds()
        rotatable_bonds = rdMolDescriptors.CalcNumRotatableBonds(mol)
        n_rig = total_bonds - rotatable_bonds

        return {"nHA": nHA, "fChar": fChar, "MaxRing": max_ring, "nRig": n_rig}
    except Exception:
        return {"nHA": None, "fChar": None, "MaxRing": None, "nRig": None}
