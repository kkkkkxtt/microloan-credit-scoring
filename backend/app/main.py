from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import time

from ml.predict import make_prediction
from db.database import engine, Base, get_db
from db.models import ApplicationRecord

# Create the tables in the database automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Microloan Credit Scoring API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Your existing Pydantic Schema
class LoanApplication(BaseModel):
    applicant_ic: str
    CODE_GENDER: int
    DAYS_BIRTH: int
    DAYS_EMPLOYED: int
    DAYS_REGISTRATION: int
    DAYS_ID_PUBLISH: int
    DAYS_LAST_PHONE_CHANGE: int
    AMT_INCOME_TOTAL: float
    AMT_CREDIT: float
    AMT_ANNUITY: float
    AMT_GOODS_PRICE: float
    EXT_SOURCE_1: float
    EXT_SOURCE_2: float
    EXT_SOURCE_3: float
    REGION_POPULATION_RELATIVE: float
    ORGANIZATION_TYPE: int

@app.post("/predict")
def predict_loan(application: LoanApplication, db: Session = Depends(get_db)):
    result = make_prediction(application.dict())
    
    db_record = ApplicationRecord(
        **application.dict(),
        probability=result["probability"],
        decision=result["decision"],
        shap_explanations=result["explanations"]
    )
    
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    
    # Return the database ID so frontend can save it to LocalStorage
    result["db_id"] = db_record.id
    return result

# UPDATED: Search history by IC Number
@app.get("/history/{ic_number}")
def get_history_by_ic(ic_number: str, db: Session = Depends(get_db)):
    records = db.query(ApplicationRecord).filter(
        ApplicationRecord.applicant_ic == ic_number
    ).order_by(ApplicationRecord.application_date.desc()).all()
    return records