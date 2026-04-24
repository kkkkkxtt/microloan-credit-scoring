from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import psycopg2
import json

from app.schemas.predict import PredictionRequest, PredictionResponse
from app.ml.predict import load_ml_assets, process_prediction

app = FastAPI(title="Microloan Credit Scoring API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DATABASE CONFIGURATION ----------------
DB_CONFIG = {
    "dbname": "microloan_db",
    "user": "postgres",
    "password": "123456", 
    "host": "localhost",
    "port": "5432"
}

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)
# --------------------------------------------------------

@app.on_event("startup")
async def startup_event():
    load_ml_assets()

@app.post("/predict", response_model=PredictionResponse)
async def predict_loan(request: PredictionRequest):
    try:
        # 1. Process via ML script (UPDATED to request.root for Pydantic V2)
        result = process_prediction(request.root)
        
        # 2. Save to Database for Audit Logging
        conn = get_db_connection()
        cursor = conn.cursor()
        
        insert_query = """
            INSERT INTO applications_audit_log 
            (applicant_ic, application_date, probability, decision, input_features, shap_explanations)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        
        cursor.execute(insert_query, (
            result["applicant_ic"],
            datetime.now(),
            result["risk_probability"],
            result["decision"],
            json.dumps(result["raw_features_log"]),
            json.dumps(result["shap_log"])
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return result
        
    except Exception as e:
        print(f"Prediction Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/latest-id")
async def get_latest_id():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Find the highest ID number
        cursor.execute("SELECT MAX(CAST(applicant_ic AS INTEGER)) FROM applications_audit_log WHERE applicant_ic ~ '^[0-9]+$'")
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        latest_id = row[0] if row and row[0] else 100000
        return {"latest_id": latest_id + 1}
    except Exception as e:
        return {"latest_id": 100001} # Fallback if DB is empty

@app.get("/history/{ic}")
async def get_applicant_history(ic: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # We now pull shap_explanations so the frontend can render the dashboard again
        query = """
            SELECT id, applicant_ic, application_date, probability, decision, input_features, shap_explanations 
            FROM applications_audit_log WHERE applicant_ic = %s ORDER BY application_date DESC
        """
        cursor.execute(query, (ic,))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        
        if not rows: return []
            
        history = []
        for row in rows:
            features = row[5] if isinstance(row[5], dict) else json.loads(row[5])
            shap_log = row[6] if isinstance(row[6], list) else json.loads(row[6]) if row[6] else []
            history.append({
                "id": row[0],
                "applicant_ic": row[1],
                "application_date": row[2].isoformat(),
                "risk_probability": float(row[3]),
                "decision": row[4],
                "CODE_GENDER": features.get("CODE_GENDER", 1),
                "DAYS_EMPLOYED": features.get("DAYS_EMPLOYED", 0),
                "AMT_INCOME_TOTAL": features.get("AMT_INCOME_TOTAL", 0),
                "shap_log": shap_log,
                "recommendations": [] # Historical fallback since old DB didn't save recommendations
            })
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))