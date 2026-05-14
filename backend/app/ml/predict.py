import os
import json
import joblib
import pandas as pd
import numpy as np
import shap

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.abspath(os.path.join(current_dir, '..', '..'))

MODEL_PATH = os.path.join(backend_root, 'saved_models', 'final_microloan_model.pkl')
CONFIG_PATH = os.path.join(backend_root, 'saved_models', 'deployment_config.json')
DICT_PATH = os.path.join(backend_root, 'config', 'xai_feature_dictionary.json')

model = None
explainer = None
expected_features = []
optimal_threshold = 0.58
xai_dictionary = {}

def load_ml_assets():
    global model, explainer, expected_features, optimal_threshold, xai_dictionary
    model = joblib.load(MODEL_PATH)
    
    with open(CONFIG_PATH, 'r') as f:
        config = json.load(f)
        expected_features = config['expected_features']
        optimal_threshold = config.get('optimal_threshold', 0.58)
        
    with open(DICT_PATH, 'r') as f:
        xai_dictionary = json.load(f)
        
    explainer = shap.TreeExplainer(model)

def process_prediction(raw_input: dict) -> dict:
    if model is None:
        load_ml_assets()

    applicant_ic = raw_input.get("applicant_ic", "UNKNOWN")
    
    # Prepare data
    input_df = pd.DataFrame([raw_input])
    
    # Ensure all expected features are present (Fallback safety)
    for col in expected_features:
        if col not in input_df.columns:
            input_df[col] = 0
            
    input_df = input_df[expected_features]
    
    # Predict
    probability = model.predict_proba(input_df)[0][1]
    decision = "Approve" if probability < optimal_threshold else "Reject"
    
    # SHAP Explanation
    shap_values = explainer(input_df)
    
    # Extract feature importance
    feature_importance = pd.DataFrame({
        'feature': expected_features,
        'effect': shap_values.values[0]
    })
    
    # --- ENRICH SHAP LOG WITH DICTIONARY TEXT ---
    explanations_log = []
    
    for _, row in feature_importance.iterrows():
        raw_feature = row['feature']
        effect = float(row['effect'])
        
        dict_key = raw_feature
        for prefix in ['NAME_INCOME_TYPE_', 'NAME_EDUCATION_TYPE_', 'NAME_FAMILY_STATUS_', 'NAME_HOUSING_TYPE_', 'OCCUPATION_TYPE_', 'ORGANIZATION_TYPE_']:
            if raw_feature.startswith(prefix):
                dict_key = prefix[:-1]
                break
                
        dict_entry = xai_dictionary.get(dict_key, {})
        
        explanations_log.append({
            "feature": raw_feature,
            "effect": effect,
            "display_name": dict_entry.get("display_name", raw_feature.replace('_', ' ').title()),
            "risk_reason": dict_entry.get("risk_reason", "This metric deviated from standard safety thresholds and increased risk."),
            "protective_reason": dict_entry.get("protective_reason", "This factor contributed positively to your application.")
        })

# --- FIX: UNIFIED ABSOLUTE SORTING ---
    # Sort by absolute magnitude to find the true top influential factors overall
    feature_importance['abs_effect'] = feature_importance['effect'].abs()
    
    # Grab the top 4 most impactful features regardless of direction
    top_features = feature_importance.sort_values(by='abs_effect', ascending=False).head(4)[['feature', 'effect']].values
        
    recommendations = []
    
    for raw_feature, effect in top_features:
        dict_key = raw_feature
        # Handle One-Hot Encoded prefixes
        for prefix in ['NAME_INCOME_TYPE_', 'NAME_EDUCATION_TYPE_', 'NAME_FAMILY_STATUS_', 'NAME_HOUSING_TYPE_', 'OCCUPATION_TYPE_', 'ORGANIZATION_TYPE_']:
            if raw_feature.startswith(prefix):
                dict_key = prefix[:-1]
                break
        
        # Fetch the feature dictionary entry (or an empty dict if not found)
        dict_entry = xai_dictionary.get(dict_key, {})
        display_name = dict_entry.get("display_name", raw_feature.replace('_', ' ').title())
        
        # --- DUAL-SIDED LOGIC ---
        if float(effect) > 0:
            # RISK FACTOR (Pushes model towards rejection)
            reason = dict_entry.get("risk_reason", "This specific metric deviated from standard safety thresholds and increased risk.")
            action = dict_entry.get("risk_action", "Review this financial metric or discuss with a loan officer.")
        else:
            # PROTECTIVE FACTOR (Pushes model towards approval)
            reason = dict_entry.get("protective_reason", "This metric showed strong alignment with historically successful repayments.")
            action = dict_entry.get("protective_action", "Maintain this standard to keep a strong financial profile.")
        
        recommendations.append({
            "feature_name": display_name,
            "reason": reason,
            "action": action,
            "effect": float(effect)
        })
        
        # (Removed the explanations_log.append() from here since we built it above)
        
    if decision == "Approve":
        dynamic_explanation = "Your risk profile is acceptable. Your data strongly aligns with historical successful repayments."
    else:
        top_risk_name = recommendations[0]["feature_name"] if recommendations else "financial metrics"
        dynamic_explanation = f"The application was flagged primarily due to your {top_risk_name}. Review the actionable insights below to improve your standing."

    return {
        "applicant_ic": applicant_ic,
        "status": "success",
        "risk_probability": float(probability),
        "decision": decision,
        "threshold_used": optimal_threshold,
        "recommendations": recommendations,
        "dynamic_explanation": dynamic_explanation, 
        "raw_features_log": raw_input,
        "shap_log": explanations_log
    }