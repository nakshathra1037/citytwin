from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class FeatureImportance(BaseModel):
    feature_name: str
    importance: float
    description: str

class ModelEvaluationMetrics(BaseModel):
    model_name: str
    algorithm: str
    training_samples: int
    test_samples: int
    last_trained: datetime
    # Classification metrics
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    # Regression metrics
    mae: Optional[float] = None
    rmse: Optional[float] = None
    r2_score: Optional[float] = None

class PredictionRequest(BaseModel):
    city_id: str
    prediction_type: str = "flood" # "flood" or "traffic"
    horizon_hours: int = 3

class PredictionResponse(BaseModel):
    status: str # "success", "insufficient_training_data"
    city_id: str
    prediction_type: str # "flood" or "traffic"
    prediction_horizon: str # e.g. "Next 3 Hours"
    
    # Machine Learning Core Outputs
    current_condition: Dict[str, Any]
    predicted_value: Any # Score or category
    predicted_label: str # "Low", "Moderate", "High"
    confidence_score: Optional[float] = None # Direct from scikit-learn predict_proba if classification
    feature_importances: List[FeatureImportance] = []
    model_metrics: Optional[ModelEvaluationMetrics] = None
    
    # Google Gemini Decision Support Explanation
    gemini_explanation: Optional[str] = None
    potential_impact: Optional[str] = None
    recommended_considerations: Optional[List[str]] = None
    
    timestamp: datetime = datetime.utcnow()
