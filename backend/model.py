"""
model.py — Scikit-learn model loading, inference logic, SHAP Explainable AI (XAI),
and clinical override rules.
"""
import os
import joblib
import numpy as np
import shap
from typing import Tuple, Dict

MODEL_PATH = os.path.join(os.path.dirname(__file__), "binary_maternal_rf_model.pkl")
_model = None
_explainer = None

FEATURE_NAMES = ["Age", "SystolicBP", "DiastolicBP", "BS", "BodyTemp", "HeartRate"]


def get_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model file not found at '{MODEL_PATH}'. "
                "Run 'python train.py' from the project root first."
            )
        _model = joblib.load(MODEL_PATH)
    return _model


def get_explainer():
    global _explainer
    if _explainer is None:
        model = get_model()
        _explainer = shap.TreeExplainer(model)
    return _explainer


def predict(
    age: int,
    systolic_bp: int,
    diastolic_bp: int,
    bs: float,
    body_temp: float,
    heart_rate: int,
    vaginal_bleeding: bool = False,
    severe_headache: bool = False,
    facial_swelling: bool = False,
) -> Tuple[str, float, Dict[str, float]]:
    """
    Run inference on the trained Random Forest model with SHAP feature attribution
    and clinical red-flag overrides.

    Returns:
        risk_level: "High Risk" or "Low Risk"
        probability: confidence score (0-1)
        feature_contributions: dict mapping vital name -> contribution percentage (0-100%)
    """
    model = get_model()
    features = np.array([[age, systolic_bp, diastolic_bp, bs, body_temp, heart_rate]])
    prediction = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]

    risk_label = "High Risk" if prediction == 1 else "Low Risk"
    prob_score = float(probabilities[int(prediction)])

    # ─────────────────────────────────────────────────────────
    # SHAP Feature Attribution (Explainable AI)
    # ─────────────────────────────────────────────────────────
    try:
        explainer = get_explainer()
        shap_vals = explainer.shap_values(features)

        # Handle binary classification SHAP array formatting across sklearn/shap versions
        if isinstance(shap_vals, list):
            vals = shap_vals[1][0] if len(shap_vals) > 1 else shap_vals[0][0]
        elif len(shap_vals.shape) == 3:
            vals = shap_vals[0, :, 1]
        else:
            vals = shap_vals[0]

        abs_vals = np.abs(vals)
        total_abs = np.sum(abs_vals)
        if total_abs > 0:
            contributions = (abs_vals / total_abs) * 100.0
        else:
            contributions = np.full(6, 16.6)

        feature_contributions = {
            name: round(float(pct), 1)
            for name, pct in zip(FEATURE_NAMES, contributions)
        }
    except Exception as e:
        print(f"[SHAP Warning] Feature attribution failed: {e}")
        feature_contributions = {name: 16.6 for name in FEATURE_NAMES}

    # ─────────────────────────────────────────────────────────
    # Clinical Red-Flag Override Rules
    # ─────────────────────────────────────────────────────────
    has_red_flags = vaginal_bleeding or severe_headache or facial_swelling
    if has_red_flags:
        risk_label = "High Risk"
        prob_score = max(prob_score, 0.95)

    return risk_label, prob_score, feature_contributions