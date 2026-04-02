from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.ml.predict import make_prediction

app = FastAPI(title="Microloan Credit Scoring API")

# Enable CORS so your React frontend can talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the input schema based on your 15 features
class LoanApplication(BaseModel):
    EXT_SOURCE_1: float
    EXT_SOURCE_2: float
    EXT_SOURCE_3: float
    DAYS_BIRTH: int
    AMT_CREDIT: float
    AMT_ANNUITY: float
    DAYS_ID_PUBLISH: int
    AMT_GOODS_PRICE: float
    DAYS_EMPLOYED: int
    DAYS_REGISTRATION: int
    DAYS_LAST_PHONE_CHANGE: int
    AMT_INCOME_TOTAL: float
    REGION_POPULATION_RELATIVE: float
    ORGANIZATION_TYPE: int
    CODE_GENDER: int

@app.get("/")
def home():
    return {"status": "Microloan API is running"}

@app.post("/predict")
def predict_loan(application: LoanApplication):
    # application.dict() converts the Pydantic model to a Python dictionary
    result = make_prediction(application.dict())
    return result