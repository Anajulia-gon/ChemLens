"""
Detecção de moléculas "inéditas" — fora do conjunto de dados que o modelo já
viu (treino/calibração/teste, todos vindos do mesmo dataset ESOL/Delaney).

Isso é um sinal honesto e barato de calcular: não substitui o intervalo
conformal (que já mede incerteza estatística), mas avisa explicitamente
quando a molécula é estruturalmente nova pro nosso conjunto de referência —
uma situação em que validação experimental é ainda mais recomendada.
"""
from __future__ import annotations

import json
import os

from rdkit import Chem

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


def canonical_smiles(smiles: str) -> str | None:
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return None
    return Chem.MolToSmiles(mol)


def load_known_smiles(path: str | None = None) -> set[str]:
    path = path or os.path.join(MODELS_DIR, "known_smiles.json")
    if not os.path.exists(path):
        return set()
    with open(path, "r") as f:
        return set(json.load(f))
