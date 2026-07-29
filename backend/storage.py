"""
Persistência dos estudos em disco, um arquivo JSON por estudo.

Cada estudo (o resultado de um "Enviar para predição") vira um arquivo
`studies/<id>.json` com os dados completos (moléculas, predições, alertas,
faixas do radar). `/predict` salva automaticamente ao terminar; o frontend só
lê/lista/apaga — não recalcula nada ao reabrir.
"""
from __future__ import annotations

import glob
import json
import os
from datetime import datetime
from typing import Any

STUDIES_DIR = os.path.join(os.path.dirname(__file__), "studies")


def _study_path(study_id: int) -> str:
    return os.path.join(STUDIES_DIR, f"{study_id}.json")


def _ensure_dir() -> None:
    os.makedirs(STUDIES_DIR, exist_ok=True)


def list_studies() -> list[dict]:
    """Metadados de todos os estudos salvos (sem os resultados completos),
    ordenados pelo número sequencial do estudo."""
    _ensure_dir()
    studies = []
    for path in glob.glob(os.path.join(STUDIES_DIR, "*.json")):
        try:
            with open(path, "r") as f:
                data = json.load(f)
            studies.append(
                {
                    "id": data["id"],
                    "num": data["num"],
                    "date": data["date"],
                    "molCount": data["molCount"],
                }
            )
        except (OSError, json.JSONDecodeError, KeyError):
            continue  # arquivo corrompido/incompleto — ignora em vez de quebrar a listagem
    studies.sort(key=lambda s: s["num"])
    return studies


def _next_num() -> int:
    existing = list_studies()
    return (max((s["num"] for s in existing), default=0)) + 1


def save_study(
    results: list[dict],
    invalid: list[dict],
    radar_axes: list[str],
    radar_ranges: dict[str, Any],
    mol_count: int,
) -> dict:
    _ensure_dir()
    study_id = int(datetime.now().timestamp() * 1000)
    study = {
        "id": study_id,
        "num": _next_num(),
        "date": datetime.now().strftime("%d/%m/%Y"),
        "molCount": mol_count,
        "results": results,
        "invalid": invalid,
        "radarAxes": radar_axes,
        "radarRanges": radar_ranges,
    }
    with open(_study_path(study_id), "w") as f:
        json.dump(study, f, ensure_ascii=False, indent=2)
    return study


def load_study(study_id: int) -> dict | None:
    path = _study_path(study_id)
    if not os.path.exists(path):
        return None
    with open(path, "r") as f:
        return json.load(f)


def delete_study(study_id: int) -> bool:
    path = _study_path(study_id)
    if not os.path.exists(path):
        return False
    os.remove(path)
    return True


def overwrite_study(study: dict) -> None:
    """Regrava um estudo já existente (ex.: depois de remover moléculas)."""
    _ensure_dir()
    with open(_study_path(study["id"]), "w") as f:
        json.dump(study, f, ensure_ascii=False, indent=2)
