from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Integer
from pydantic import BaseModel
from app.api.deps import get_current_user
from app.db.models import User

from app.schemas.predict import PredictionRequest, PredictionResponse
from app.ml.predict import load_ml_assets, process_prediction

from app.db.database import SessionLocal, engine 
from app.db.models import ApplicationRecord, Base

from app.api.deps import get_db
from app.api import auth

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

# Schema for the Officer's manual override
class OverrideRequest(BaseModel):
    manual_decision: str
    officer_justification: str

# --- ROUTES ---
app.include_router(auth.router, prefix="/auth", tags=["Authentication"]) 

@app.on_event("startup")
async def startup_event():
    load_ml_assets()

@app.get("/latest-id")
async def get_latest_id(db: Session = Depends(get_db)):
    try:
        # Query max ID using SQLAlchemy
        max_ic = db.query(func.max(cast(ApplicationRecord.application_id, Integer)))\
                   .filter(ApplicationRecord.application_id.op('~')('^[0-9]+$'))\
                   .scalar()
        
        latest_id = max_ic if max_ic else 100000
        return {"latest_id": latest_id + 1}
    except Exception as e:
        return {"latest_id": 100001}

@app.post("/predict", response_model=PredictionResponse)
async def predict_loan(request: PredictionRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        result = process_prediction(request.root)
        
        # Save to Database using the NEW column names from models.py
        new_record = ApplicationRecord(
            applicant_user_id=current_user.user_id,       # <-- FIXED
            application_id=result["applicant_ic"],        # <-- FIXED
            model_probability=result["risk_probability"], # <-- FIXED
            model_decision=result["decision"],            # <-- FIXED
            input_features=result["raw_features_log"],
            shap_explanations=result["shap_log"]
        )
        
        db.add(new_record)
        db.commit()
        db.refresh(new_record)

        # Attach DB-generated metadata to response for the frontend
        result_to_return = dict(result) if isinstance(result, dict) else {}
        result_to_return.update({
            'id': new_record.application_record_id,       # <-- FIXED
            'application_date': new_record.application_created_at.isoformat(),
            'applicant_ic': new_record.application_id,    # <-- FIXED
            'risk_probability': float(result.get('risk_probability', new_record.model_probability)),
            'decision': new_record.model_decision,        # <-- FIXED
        })

        return result_to_return
        
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
        records = db.query(ApplicationRecord).filter(ApplicationRecord.application_id == ic).order_by(ApplicationRecord.application_created_at.desc()).all()
        if not records: return []
            
        history = []
        dict_keys_sorted = sorted(xai_dictionary.keys(), key=len, reverse=True)
        
        for row in records:

            features = row.input_features or {}
            shap_log = row.shap_explanations or []
            
            rebuilt_recommendations = []

            try:
                parsed_reviews = json.loads(row.officer_justification) if row.officer_justification and row.officer_justification.startswith("[") else []
            except:
                parsed_reviews = []


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
                "id": row.application_record_id,
                "applicant_ic": row.application_id,
                "application_date": row.application_created_at.isoformat(),
                "risk_probability": float(row.model_probability),
                "decision": row.model_decision,
                "manual_decision": row.manual_decision,
                "officer_justification": row.officer_justification,
                "officer_name": row.officer.username if row.officer else None,
                "officer_avatar": row.officer.user_avatar_url if row.officer else None,
                "reviews": parsed_reviews,
                "CODE_GENDER": features.get("CODE_GENDER", 1),
                "DAYS_EMPLOYED": features.get("DAYS_EMPLOYED", 0),
                "AMT_INCOME_TOTAL": features.get("AMT_INCOME_TOTAL", 0),
                "raw_features_log": features,
                "shap_log": shap_log,
                "recommendations": rebuilt_recommendations,
                "dynamic_explanation": f"Historical decision based primarily on {top_risk}."
            })
        return history
    except Exception as e:
        print(f"History Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history/latest")
def get_latest_history(db: Session = Depends(get_db)):
    """Fetches the 5 most recent global applications across all devices."""
    records = db.query(ApplicationRecord).order_by(ApplicationRecord.application_created_at.desc()).limit(5).all()
    
    history = []
    for row in records:
        features = row.input_features or {}
        shap_log = row.shap_explanations or []
        
        # Simple recommendation rebuild for history view
        rebuilt_recommendations = []
        top_risk = "Unknown Risk"
        if shap_log:
            risk_factors = sorted([s for s in shap_log if s['effect'] > 0], key=lambda x: x['effect'], reverse=True)
            if risk_factors:
                top_risk = risk_factors[0]['feature'].replace('_', ' ').title()
                
        history.append({
            "id": row.application_record_id,
            "applicant_ic": row.application_id,
            "application_date": row.application_created_at.isoformat(),
            "risk_probability": float(row.model_probability),
            "decision": row.model_decision,
            "raw_features_log": features,
            "shap_log": shap_log,
            "recommendations": rebuilt_recommendations,
            "dynamic_explanation": f"Historical decision based primarily on {top_risk}."
        })
        
    return history

@app.get("/ml/all-applications")
def get_all_applications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Block Applicants from accessing this route
    if current_user.user_role != "loan_officer":
        raise HTTPException(status_code=403, detail="Only Loan Officers can access this data.")
        
    records = db.query(ApplicationRecord).order_by(ApplicationRecord.application_created_at.desc()).all()
    
    results = []
    for r in records:
        try:
            parsed_reviews = json.loads(r.officer_justification) if r.officer_justification and r.officer_justification.startswith("[") else []
        except:
            parsed_reviews = []

        results.append({
            "id": r.application_record_id,
            "application_date": r.application_created_at.isoformat(),
            "applicant_name": r.applicant.username if r.applicant else "Unknown",
            "applicant_ic": r.application_id,
            "risk_probability": r.model_probability,
            "ai_decision": r.model_decision,
            "manual_decision": r.manual_decision,
            "officer_justification": r.officer_justification,
            "officer_name": r.officer.username if r.officer else None,
            "officer_avatar": r.officer.user_avatar_url if r.officer else None,            
            "reviews": parsed_reviews
        })
    return results

@app.put("/ml/override/{application_id}")
def override_decision(
    application_id: int, 
    req: OverrideRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.user_role != "loan_officer":
        raise HTTPException(status_code=403, detail="Only Loan Officers can perform overrides.")
        
    record = db.query(ApplicationRecord).filter(ApplicationRecord.application_record_id == application_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    # Safely load existing multi-reviews (if they exist)
    try:
        reviews = json.loads(record.officer_justification) if record.officer_justification and record.officer_justification.startswith("[") else []
    except:
        reviews = []
        
    # Remove previous review by this specific officer if they are updating it
    reviews = [r for r in reviews if r.get("officer_name") != current_user.username]
    
    # Append the new review
    reviews.append({
        "officer_name": current_user.username,
        "officer_avatar": current_user.user_avatar_url,
        "decision": req.manual_decision,
        "justification": req.officer_justification
    })

    record.manual_decision = req.manual_decision
    record.officer_justification = json.dumps(reviews) # Store as stringified JSON!
    record.reviewing_officer_id = current_user.user_id
    
    db.commit()
    return {"status": "success"}