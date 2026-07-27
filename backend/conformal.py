"""
Preditor conformal ESD (Error-Scaled Distance), portado de
toolsinterface.py::ConformalPredictorESD. Lógica idêntica ao original.
"""
from __future__ import annotations

import numpy as np


class ConformalPredictorESD:
    def __init__(self, confidence: float = 0.90):
        self.confidence = confidence
        self.q: float | None = None
        self.is_calibrated = False

    def calibrate(self, y_cal_true, y_cal_pred, q_e_cal) -> None:
        y_cal_true = np.asarray(y_cal_true, dtype=float)
        y_cal_pred = np.asarray(y_cal_pred, dtype=float)
        q_e_cal = np.asarray(q_e_cal, dtype=float)

        alpha_cal = np.abs(y_cal_true - y_cal_pred) / np.exp(np.sqrt(q_e_cal))

        n = len(alpha_cal)
        q_level = min((n + 1.0) / n * self.confidence, 1.0)
        self.q = float(np.quantile(alpha_cal, q_level))
        self.is_calibrated = True

    def predict_interval(self, y_pred, q_e):
        if not self.is_calibrated:
            raise ValueError("Calibre o modelo (chame .calibrate()) antes de prever intervalos.")

        y_pred = np.asarray(y_pred, dtype=float)
        q_e = np.asarray(q_e, dtype=float)

        margin = self.q * np.exp(np.sqrt(q_e))
        return y_pred - margin, y_pred + margin
