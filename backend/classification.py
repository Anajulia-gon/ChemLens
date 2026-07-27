"""
Classificação de solubilidade e geração do alerta de confiabilidade.

Portado de toolsinterface.py::classify_solubility_dataset / generate_status,
adaptado para operar por molécula (em vez de num DataFrame inteiro) e com as
mensagens localizadas em pt-BR.
"""
from __future__ import annotations

from domain import SOLUBILITY_LIMITS

# Mapeia o alerta de confiabilidade (3 categorias) para o status de 3 níveis
# usado pela tabela/UI (mesmas cores do Claude Design: verde/laranja/vermelho).
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


def generate_status(logs_pred: float, lower_bound: float, upper_bound: float) -> dict:
    pred_class = map_logs_class(logs_pred)
    lower_class = map_logs_class(lower_bound)
    upper_class = map_logs_class(upper_bound)

    if lower_class == upper_class:
        alert_name = "HIGH PREDICTIVE RELIABILITY"
        description = (
            f"A IA prevê {logs_pred:.2f}. A margem de erro permanece dentro da mesma classe de "
            f"solubilidade ({pred_class}). A molécula deve se comportar como esperado em ensaios biológicos."
        )
    elif pred_class != lower_class:
        if lower_class == "Low Solubility":
            alert_name = "INSOLUBILITY RISK"
            description = (
                f"A IA prevê {logs_pred:.2f} ({pred_class}), mas a margem de erro alcança a zona crítica "
                f"de insolubilidade. Validação experimental é recomendada."
            )
        else:
            alert_name = "FORMULATION IMPACT"
            description = (
                f"A IA prevê {logs_pred:.2f} ({pred_class}) e tem uma margem de erro que se estende até "
                f"a classe '{lower_class}'."
            )
    else:
        alert_name = "MODERATE PREDICTIVE RELIABILITY"
        description = "A margem de erro sugere cautela na interpretação inicial para ensaios biológicos."

    return {
        "pred_class": pred_class,
        "alert_name": alert_name,
        "description": description,
        "status": STATUS_BY_ALERT[alert_name],
    }
