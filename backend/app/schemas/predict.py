"""Pydantic schemas for prediction requests and responses.

These schemas validate incoming raw feature dictionaries, enforce
basic sanity checks, and structure the API response expected by the
frontend.
"""
from pydantic import BaseModel, RootModel, model_validator
from typing import Dict, Any, List, Optional


class PredictionRequest(RootModel[Dict[str, Any]]):
    @model_validator(mode='before')
    def validate_input(cls, values):
        data = values
        errors = {}

        # Basic required checks
        if not data.get('applicant_ic') or not str(data.get('applicant_ic')).strip():
            errors['applicant_ic'] = 'Applicant ID is required.'

        # Numeric sanity checks
        try:
            credit = float(data.get('AMT_CREDIT', 0))
            if credit <= 0:
                errors['AMT_CREDIT'] = 'AMT_CREDIT must be > 0.'
        except Exception:
            errors['AMT_CREDIT'] = 'AMT_CREDIT must be numeric and > 0.'

        try:
            income = float(data.get('AMT_INCOME_TOTAL', 0))
            if income < 0:
                errors['AMT_INCOME_TOTAL'] = 'AMT_INCOME_TOTAL must be >= 0.'
        except Exception:
            errors['AMT_INCOME_TOTAL'] = 'AMT_INCOME_TOTAL must be numeric.'

        try:
            members = int(data.get('CNT_FAM_MEMBERS', 1))
            if members < 1:
                errors['CNT_FAM_MEMBERS'] = 'CNT_FAM_MEMBERS must be >= 1.'
        except Exception:
            errors['CNT_FAM_MEMBERS'] = 'CNT_FAM_MEMBERS must be integer.'

        code_gender = data.get('CODE_GENDER')
        if code_gender is None:
            errors['CODE_GENDER'] = 'CODE_GENDER is required.'
        else:
            if not (str(code_gender) in ('0', '1', 'M', 'F') or code_gender in (0, 1)):
                errors['CODE_GENDER'] = 'CODE_GENDER must be 0/1 or M/F.'

        if errors:
            # Raising ValueError here will cause FastAPI to return a 422 with details
            raise ValueError(errors)

        return values

class RecommendationItem(BaseModel):
    feature_name: str
    reason: str
    action: str
    effect: float

class ShapItem(BaseModel):
    feature: str
    effect: float

class PredictionResponse(BaseModel):
    id: Optional[int]
    applicant_ic: str
    application_date: Optional[str]
    status: str
    risk_probability: float
    decision: str
    threshold_used: float
    recommendations: List[RecommendationItem]
    dynamic_explanation: str
    shap_log: List[ShapItem]
    raw_features_log: Dict[str, Any]