from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Integer

from app.schemas.predict import PredictionRequest, PredictionResponse
from app.ml.predict import load_ml_assets, process_prediction

from app.db.database import SessionLocal, engine 
from app.db.models import ApplicationRecord, Base

import json
import os

# This ensures your tables are created in PostgreSQL automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Microloan Credit Scoring API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DATABASE DEPENDENCY ----------------
# This cleanly opens and closes a database session for each request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
# -----------------------------------------------------

@app.on_event("startup")
async def startup_event():
    load_ml_assets()

@app.get("/latest-id")
async def get_latest_id(db: Session = Depends(get_db)):
    try:
        # Query max ID using SQLAlchemy
        max_ic = db.query(func.max(cast(ApplicationRecord.applicant_ic, Integer)))\
                   .filter(ApplicationRecord.applicant_ic.op('~')('^[0-9]+$'))\
                   .scalar()
        
        latest_id = max_ic if max_ic else 100000
        return {"latest_id": latest_id + 1}
    except Exception as e:
        return {"latest_id": 100001}

@app.post("/predict", response_model=PredictionResponse)
async def predict_loan(request: PredictionRequest, db: Session = Depends(get_db)):
    try:
        result = process_prediction(request.root)
        
        # Save to Database using SQLAlchemy ORM (No more raw SQL strings!)
        # Notice we don't need json.dumps() anymore. SQLAlchemy handles JSONB automatically.
        new_record = ApplicationRecord(
            applicant_ic=result["applicant_ic"],
            probability=result["risk_probability"],
            decision=result["decision"],
            input_features=result["raw_features_log"],
            shap_explanations=result["shap_log"]
        )
        
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        
        return result
        
    except Exception as e:
        print(f"Prediction Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Load dictionary globally in main.py
DICT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'config', 'xai_feature_dictionary.json')
with open(DICT_PATH, 'r') as f:
    xai_dictionary = json.load(f)

@app.get("/history/{ic}")
async def get_applicant_history(ic: str, db: Session = Depends(get_db)):
    try:
        records = db.query(ApplicationRecord).filter(ApplicationRecord.applicant_ic == ic).order_by(ApplicationRecord.application_date.desc()).all()
        if not records: return []
            
        history = []
        dict_keys_sorted = sorted(xai_dictionary.keys(), key=len, reverse=True)
        
        for row in records:
            features = row.input_features or {}
            shap_log = row.shap_explanations or []
            
            rebuilt_recommendations = []
            for item in shap_log[:4]: 
                raw_feature = item.get("feature", "")
                
                # BULLETPROOF MAPPING FOR HISTORY
                dict_key = raw_feature
                if dict_key not in xai_dictionary:
                    for key in dict_keys_sorted:
                        if raw_feature.startswith(key):
                            dict_key = key
                            break
                            
                translation = xai_dictionary.get(dict_key, {
                    "display_name": raw_feature.replace('_', ' ').title(),
                    "reason": "This specific metric deviated from standard safety thresholds.",
                    "action": "Discuss this metric with a verified loan officer."
                })
                
                rebuilt_recommendations.append({
                    "feature_name": translation["display_name"],
                    "reason": translation["reason"],
                    "action": translation["action"],
                    "effect": item.get("effect", 0)
                })
            
            top_risk = rebuilt_recommendations[0]['feature_name'] if rebuilt_recommendations else 'AI Risk Assessment'
            
            history.append({
                "id": row.id,
                "applicant_ic": row.applicant_ic,
                "application_date": row.application_date.isoformat(),
                "risk_probability": float(row.probability),
                "decision": row.decision,
                "CODE_GENDER": features.get("CODE_GENDER", 1),
                "DAYS_EMPLOYED": features.get("DAYS_EMPLOYED", 0),
                "AMT_INCOME_TOTAL": features.get("AMT_INCOME_TOTAL", 0),
                "shap_log": shap_log,
                "recommendations": rebuilt_recommendations,
                "dynamic_explanation": f"Historical decision based primarily on {top_risk}."
            })
        return history
    except Exception as e:
        print(f"History Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))