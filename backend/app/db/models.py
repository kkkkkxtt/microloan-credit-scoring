from sqlalchemy import Column, Integer, Float, String, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from db.database import Base

class ApplicationRecord(Base):
    __tablename__ = "applications_audit_log"

    id = Column(Integer, primary_key=True, index=True)
    # NEW: The Unique ID for history retrieval
    applicant_ic = Column(String, index=True) 
    application_date = Column(DateTime, default=datetime.utcnow)
    
    # 15 Features
    CODE_GENDER = Column(Integer)
    DAYS_BIRTH = Column(Integer)
    DAYS_EMPLOYED = Column(Integer)
    DAYS_REGISTRATION = Column(Integer)
    DAYS_ID_PUBLISH = Column(Integer)
    DAYS_LAST_PHONE_CHANGE = Column(Integer)
    AMT_INCOME_TOTAL = Column(Float)
    AMT_CREDIT = Column(Float)
    AMT_ANNUITY = Column(Float)
    AMT_GOODS_PRICE = Column(Float)
    EXT_SOURCE_1 = Column(Float)
    EXT_SOURCE_2 = Column(Float)
    EXT_SOURCE_3 = Column(Float)
    REGION_POPULATION_RELATIVE = Column(Float)
    ORGANIZATION_TYPE = Column(Integer)

    probability = Column(Float)
    decision = Column(String)
    shap_explanations = Column(JSONB)