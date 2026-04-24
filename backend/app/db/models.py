from sqlalchemy import Column, Integer, Float, String, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from app.db.database import Base 

class ApplicationRecord(Base):
    __tablename__ = "applications_audit_log"

    id = Column(Integer, primary_key=True, index=True)
    applicant_ic = Column(String, index=True) 
    application_date = Column(DateTime, default=datetime.utcnow)
    
    probability = Column(Float)
    decision = Column(String)
    
    # NEW: Replaced the 15 hardcoded features with scalable JSONB
    input_features = Column(JSONB)
    shap_explanations = Column(JSONB)