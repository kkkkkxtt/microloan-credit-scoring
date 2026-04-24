from pydantic import BaseModel, RootModel
from typing import Dict, Any, List

class PredictionRequest(RootModel[Dict[str, Any]]):
    pass

class RecommendationItem(BaseModel):
    feature_name: str
    reason: str
    action: str
    effect: float

class ShapItem(BaseModel):
    feature: str
    effect: float

class PredictionResponse(BaseModel):
    applicant_ic: str
    status: str
    risk_probability: float
    decision: str
    threshold_used: float
    recommendations: List[RecommendationItem]
    # We explicitly tell FastAPI to allow these fields through
    shap_log: List[ShapItem]
    raw_features_log: Dict[str, Any]