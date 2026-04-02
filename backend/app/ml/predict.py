import joblib
import pandas as pd
import shap
import numpy as np

# Load the saved model and feature list
model = joblib.load('saved_models/microloan_model.pkl')
features = joblib.load('saved_models/selected_features.pkl')
explainer = shap.TreeExplainer(model)

def make_prediction(data_dict: dict):
    # Convert input dict to DataFrame
    df = pd.DataFrame([data_dict])
    
    # Ensure columns are in the exact order the model expects
    df = df[features]
    
    # Get probability and final decision
    # We use a threshold of 0.2 as discussed in your pipeline
    prob = model.predict_proba(df)[0][1]
    decision = "Reject" if prob >= 0.2 else "Approve"
    
    # Generate SHAP values for explanation
    shap_values = explainer.shap_values(df)
    
    # Handle SHAP version differences (ensure we get class 1 values)
    if isinstance(shap_values, list):
        sv = shap_values[1][0]
    else:
        sv = shap_values[0]
        
    # Create a simple list of feature impacts for the frontend
    explanations = []
    for i, feature_name in enumerate(features):
        explanations.append({
            "feature": feature_name,
            "effect": float(sv[i])
        })
        
    return {
        "probability": round(float(prob), 4),
        "decision": decision,
        "explanations": explanations
    }