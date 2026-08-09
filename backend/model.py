"""
model.py — Scikit-learn model loading and inference logic.
"""
import os
import joblib
import numpy as np
from typing import Tuple

MODEL_PATH = os.path.join(os.path.dirname(__file__), "binary_maternal_rf_model.pkl")
_model = None


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


def predict(age: int, systolic_bp: int, diastolic_bp: int,
            bs: float, body_temp: float, heart_rate: int) -> Tuple[str, float]:
    """
    Run inference on the trained Random Forest model.

    Returns:
        risk_level: "High Risk" or "Low Risk"
        probability: confidence score (0-1) for the predicted class
    """
    model = get_model()
    features = np.array([[age, systolic_bp, diastolic_bp, bs, body_temp, heart_rate]])
    prediction = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]

    risk_label = "High Risk" if prediction == 1 else "Low Risk"
    # probability of the predicted class
    prob_score = float(probabilities[int(prediction)])
    return risk_label, prob_score
