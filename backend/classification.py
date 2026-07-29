"""
Solubility classification and reliability-alert generation.

Ported from toolsinterface.py::classify_solubility_dataset / generate_status,
adapted to operate per-molecule (instead of over a whole DataFrame).
"""
from __future__ import annotations

from domain import SOLUBILITY_LIMITS

# Maps the reliability alert (3 categories) to the 3-level status used by the
# table/UI (same colors as the Claude Design: green/orange/red).
STATUS_BY_ALERT = {
    "HIGH PREDICTIVE RELIABILITY": "High Confidence",
    "MODERATE PREDICTIVE RELIABILITY": "Review Suggested",
    "FORMULATION IMPACT": "Review Suggested",
    "INSOLUBILITY RISK": "Risk Alert",
}


def map_logs_class(logs_value: float) -> str:
    for limit in sorted(SOLUBILITY_LIMITS.keys(), reverse=True):
        if logs_value >= limit:
            return SOLUBILITY_LIMITS[limit]
    return SOLUBILITY_LIMITS[float("-inf")]


def build_class_tag(pred_class: str, lower_class: str, upper_class: str) -> str:
    """Rótulo 'de X a Y' descrevendo as classes de solubilidade cobertas pelo
    intervalo de confiança — mesma lógica de `class_tag` em
    toolsinterface.py::classify_solubility_dataset/generate_status."""
    if lower_class == upper_class:
        return pred_class
    if pred_class != lower_class:
        if lower_class == "Low Solubility":
            return f"{pred_class} to Insoluble"
        return f"{pred_class} to {lower_class}"
    return pred_class


def generate_status(logs_pred: float, lower_bound: float, upper_bound: float) -> dict:
    pred_class = map_logs_class(logs_pred)
    lower_class = map_logs_class(lower_bound)
    upper_class = map_logs_class(upper_bound)

    if lower_class == upper_class:
        alert_name = "HIGH PREDICTIVE RELIABILITY"
        description = (
            f"The AI predicts {logs_pred:.2f}. The error margin stays within the same solubility "
            f"class ({pred_class}). This molecule should behave as expected in biological assays."
        )
    elif pred_class != lower_class:
        if lower_class == "Low Solubility":
            alert_name = "INSOLUBILITY RISK"
            description = (
                f"The AI predicts {logs_pred:.2f} ({pred_class}), but the error margin reaches the "
                f"critical insolubility zone. Experimental validation is recommended."
            )
        else:
            alert_name = "FORMULATION IMPACT"
            description = (
                f"The AI predicts {logs_pred:.2f} ({pred_class}) with an error margin that extends "
                f"into the '{lower_class}' class."
            )
    else:
        alert_name = "MODERATE PREDICTIVE RELIABILITY"
        description = "The error margin suggests caution when interpreting this prediction for biological assays."

    return {
        "pred_class": pred_class,
        "alert_name": alert_name,
        "description": description,
        "status": STATUS_BY_ALERT[alert_name],
        "class_tag": build_class_tag(pred_class, lower_class, upper_class),
    }
