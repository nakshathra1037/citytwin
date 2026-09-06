import os
import logging
from datetime import datetime
from typing import Dict, Any, Tuple, Optional
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_absolute_error, mean_squared_error, r2_score

from app.ml.dataset import build_training_dataset
from app.schemas.ml import ModelEvaluationMetrics, FeatureImportance

logger = logging.getLogger("livingcity.ml")

MODEL_DIR = os.path.join(os.path.dirname(__file__), "saved_models")
os.makedirs(MODEL_DIR, exist_ok=True)

FLOOD_MODEL_PATH = os.path.join(MODEL_DIR, "flood_rf_classifier.joblib")
FLOOD_METRICS_PATH = os.path.join(MODEL_DIR, "flood_metrics.joblib")

TRAFFIC_MODEL_PATH = os.path.join(MODEL_DIR, "traffic_rf_regressor.joblib")
TRAFFIC_METRICS_PATH = os.path.join(MODEL_DIR, "traffic_metrics.joblib")

# Global caches
_FLOOD_MODEL = None
_FLOOD_METRICS = None
_TRAFFIC_MODEL = None
_TRAFFIC_METRICS = None


def train_and_persist_models() -> Dict[str, Any]:
    """
    Executes real scikit-learn training pipeline, computes genuine evaluation
    metrics on holdout test set, and saves models.
    """
    logger.info("Initializing scikit-learn training pipeline...")
    df_flood, df_traffic = build_training_dataset(samples=1500)
    
    # 1. Train Flood Risk Classifier
    flood_features = ["rainfall_1h", "forecast_3h", "humidity", "cloudiness", "rainfall_24h", "temperature"]
    X_f = df_flood[flood_features]
    y_f = df_flood["target_risk_class"]
    
    X_train_f, X_test_f, y_train_f, y_test_f = train_test_split(X_f, y_f, test_size=0.2, random_state=42, stratify=y_f)
    
    rf_flood = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    rf_flood.fit(X_train_f, y_train_f)
    
    y_pred_f = rf_flood.predict(X_test_f)
    acc = float(accuracy_score(y_test_f, y_pred_f))
    prec = float(precision_score(y_test_f, y_pred_f, average="weighted", zero_division=0))
    rec = float(recall_score(y_test_f, y_pred_f, average="weighted", zero_division=0))
    f1 = float(f1_score(y_test_f, y_pred_f, average="weighted", zero_division=0))
    
    flood_metrics = ModelEvaluationMetrics(
        model_name="Urban Flood Risk Classifier",
        algorithm="RandomForestClassifier (scikit-learn)",
        training_samples=len(X_train_f),
        test_samples=len(X_test_f),
        last_trained=datetime.utcnow(),
        accuracy=round(acc, 4),
        precision=round(prec, 4),
        recall=round(rec, 4),
        f1_score=round(f1, 4)
    )
    
    joblib.dump(rf_flood, FLOOD_MODEL_PATH)
    joblib.dump(flood_metrics, FLOOD_METRICS_PATH)
    
    # 2. Train Traffic Regressor
    traffic_features = ["hour_of_day", "is_weekend", "rainfall_1h", "free_flow_speed", "current_speed"]
    X_t = df_traffic[traffic_features]
    y_t = df_traffic["target_congestion"]
    
    X_train_t, X_test_t, y_train_t, y_test_t = train_test_split(X_t, y_t, test_size=0.2, random_state=42)
    
    rf_traffic = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)
    rf_traffic.fit(X_train_t, y_train_t)
    
    y_pred_t = rf_traffic.predict(X_test_t)
    mae = float(mean_absolute_error(y_test_t, y_pred_t))
    rmse = float(np.sqrt(mean_squared_error(y_test_t, y_pred_t)))
    r2 = float(r2_score(y_test_t, y_pred_t))
    
    traffic_metrics = ModelEvaluationMetrics(
        model_name="Urban Traffic Congestion Predictor",
        algorithm="RandomForestRegressor (scikit-learn)",
        training_samples=len(X_train_t),
        test_samples=len(X_test_t),
        last_trained=datetime.utcnow(),
        mae=round(mae, 4),
        rmse=round(rmse, 4),
        r2_score=round(r2, 4)
    )
    
    joblib.dump(rf_traffic, TRAFFIC_MODEL_PATH)
    joblib.dump(traffic_metrics, TRAFFIC_METRICS_PATH)
    
    logger.info("Models successfully trained and persisted with evaluation metrics.")
    return {
        "flood": flood_metrics.model_dump(),
        "traffic": traffic_metrics.model_dump()
    }


def load_flood_model() -> Tuple[Any, Optional[ModelEvaluationMetrics]]:
    global _FLOOD_MODEL, _FLOOD_METRICS
    if _FLOOD_MODEL is None or _FLOOD_METRICS is None:
        if not os.path.exists(FLOOD_MODEL_PATH):
            train_and_persist_models()
        _FLOOD_MODEL = joblib.load(FLOOD_MODEL_PATH)
        _FLOOD_METRICS = joblib.load(FLOOD_METRICS_PATH)
    return _FLOOD_MODEL, _FLOOD_METRICS


def load_traffic_model() -> Tuple[Any, Optional[ModelEvaluationMetrics]]:
    global _TRAFFIC_MODEL, _TRAFFIC_METRICS
    if _TRAFFIC_MODEL is None or _TRAFFIC_METRICS is None:
        if not os.path.exists(TRAFFIC_MODEL_PATH):
            train_and_persist_models()
        _TRAFFIC_MODEL = joblib.load(TRAFFIC_MODEL_PATH)
        _TRAFFIC_METRICS = joblib.load(TRAFFIC_METRICS_PATH)
    return _TRAFFIC_MODEL, _TRAFFIC_METRICS


def predict_flood(
    rainfall_1h: float,
    forecast_3h: float,
    humidity: float,
    cloudiness: float,
    rainfall_24h: float,
    temperature: float
) -> Dict[str, Any]:
    model, metrics = load_flood_model()
    
    features = ["rainfall_1h", "forecast_3h", "humidity", "cloudiness", "rainfall_24h", "temperature"]
    input_df = pd.DataFrame([{
        "rainfall_1h": rainfall_1h,
        "forecast_3h": forecast_3h,
        "humidity": humidity,
        "cloudiness": cloudiness,
        "rainfall_24h": rainfall_24h,
        "temperature": temperature
    }])
    
    pred_class = int(model.predict(input_df)[0])
    class_labels = {0: "Low", 1: "Moderate", 2: "High"}
    label = class_labels.get(pred_class, "Moderate")
    
    # Confidence from predict_proba
    probs = model.predict_proba(input_df)[0]
    confidence = float(np.max(probs))
    
    # Feature importances
    feature_importances = []
    descriptions = {
        "rainfall_1h": "Immediate surface runoff rate",
        "forecast_3h": "Short-term convective precipitation load",
        "humidity": "Atmospheric saturation baseline",
        "cloudiness": "Ongoing precipitation potential",
        "rainfall_24h": "Pre-existing soil saturation level",
        "temperature": "Evaporative drainage capacity"
    }
    for name, imp in zip(features, model.feature_importances_):
        feature_importances.append(FeatureImportance(
            feature_name=name,
            importance=round(float(imp), 4),
            description=descriptions.get(name, "Meteorological factor")
        ))
    
    feature_importances.sort(key=lambda x: x.importance, reverse=True)
    
    return {
        "predicted_class": pred_class,
        "predicted_label": label,
        "confidence_score": round(confidence, 4),
        "class_probabilities": {
            "Low": round(float(probs[0]), 3) if len(probs) > 0 else 0.0,
            "Moderate": round(float(probs[1]), 3) if len(probs) > 1 else 0.0,
            "High": round(float(probs[2]), 3) if len(probs) > 2 else 0.0
        },
        "feature_importances": feature_importances,
        "metrics": metrics
    }


def predict_traffic(
    hour_of_day: int,
    is_weekend: int,
    rainfall_1h: float,
    free_flow_speed: float,
    current_speed: float
) -> Dict[str, Any]:
    model, metrics = load_traffic_model()
    
    features = ["hour_of_day", "is_weekend", "rainfall_1h", "free_flow_speed", "current_speed"]
    input_df = pd.DataFrame([{
        "hour_of_day": hour_of_day,
        "is_weekend": is_weekend,
        "rainfall_1h": rainfall_1h,
        "free_flow_speed": free_flow_speed,
        "current_speed": current_speed
    }])
    
    predicted_congestion = float(np.clip(model.predict(input_df)[0], 0.0, 1.0))
    label = "Low" if predicted_congestion < 0.25 else ("Moderate" if predicted_congestion < 0.55 else "High")
    
    feature_importances = []
    descriptions = {
        "hour_of_day": "Diurnal traffic peak cycle",
        "is_weekend": "Commuter flow vs weekend pattern",
        "rainfall_1h": "Weather-induced vehicle deceleration",
        "free_flow_speed": "Corridor speed capacity",
        "current_speed": "Current upstream sensor velocity"
    }
    for name, imp in zip(features, model.feature_importances_):
        feature_importances.append(FeatureImportance(
            feature_name=name,
            importance=round(float(imp), 4),
            description=descriptions.get(name, "Traffic predictor factor")
        ))
    feature_importances.sort(key=lambda x: x.importance, reverse=True)
    
    return {
        "predicted_congestion_ratio": round(predicted_congestion, 3),
        "predicted_congestion_pct": round(predicted_congestion * 100, 1),
        "predicted_label": label,
        "feature_importances": feature_importances,
        "metrics": metrics
    }
