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
    applicant_ic = raw_input.get('applicant_ic', 'UNKNOWN')
    
    # 1. Create a blank DataFrame with all 161 expected features set to 0.0
    df_input = pd.DataFrame(0.0, index=[0], columns=expected_features)
    
    # 2. Map Numerical Features
    for key, value in raw_input.items():
        if key in expected_features and isinstance(value, (int, float)):
            df_input.at[0, key] = float(value)
            
    # 3. Dynamic One-Hot Encoding for Categorical Features
    # If frontend sends NAME_INCOME_TYPE = 'Working', we set 'NAME_INCOME_TYPE_Working' to 1.0
    categorical_columns = ['CODE_GENDER', 'NAME_EDUCATION_TYPE', 'NAME_FAMILY_STATUS', 'NAME_HOUSING_TYPE', 
                           'NAME_INCOME_TYPE', 'OCCUPATION_TYPE', 'ORGANIZATION_TYPE', 'NAME_CONTRACT_TYPE',
                           'HOUSETYPE_MODE', 'WALLSMATERIAL_MODE', 'FONDKAPREMONT_MODE', 'EMERGENCYSTATE_MODE']
    
    # 3. Dynamic One-Hot Encoding for Categorical Features
    for cat_col in categorical_columns:
        if cat_col in raw_input:
            val = raw_input[cat_col]
            # NEW: If the user selected multiple checkboxes (List)
            if isinstance(val, list):
                for v in val:
                    encoded_col_name = f"{cat_col}_{v}"
                    if encoded_col_name in expected_features:
                        df_input.at[0, encoded_col_name] = 1.0
            # Standard single dropdown mapping
            else:
                encoded_col_name = f"{cat_col}_{val}"
                if encoded_col_name in expected_features:
                    df_input.at[0, encoded_col_name] = 1.0
                
    # 4. DOMAIN-SPECIFIC FEATURE ENGINEERING (As per your notebook)
    # Calculate Base Age & Employed Years
    days_birth = abs(float(raw_input.get('DAYS_BIRTH', 10000)))
    days_employed = abs(float(raw_input.get('DAYS_EMPLOYED', 1000)))
    age_years = days_birth / 365.25
    years_employed = days_employed / 365.25
    
    if 'AGE_YEARS' in expected_features: df_input.at[0, 'AGE_YEARS'] = age_years
    if 'YEARS_EMPLOYED' in expected_features: df_input.at[0, 'YEARS_EMPLOYED'] = years_employed

    # Calculate Financial Ratios safely (avoiding division by zero)
    amt_income = float(raw_input.get('AMT_INCOME_TOTAL', 1)) or 1.0
    amt_credit = float(raw_input.get('AMT_CREDIT', 1)) or 1.0
    amt_annuity = float(raw_input.get('AMT_ANNUITY', 1)) or 1.0
    amt_goods = float(raw_input.get('AMT_GOODS_PRICE', 0))

    if 'ANNUITY_INCOME_PERCENT' in expected_features: 
        df_input.at[0, 'ANNUITY_INCOME_PERCENT'] = amt_annuity / amt_income
    if 'CREDIT_INCOME_PERCENT' in expected_features: 
        df_input.at[0, 'CREDIT_INCOME_PERCENT'] = amt_credit / amt_income
    if 'CREDIT_TERM' in expected_features: 
        df_input.at[0, 'CREDIT_TERM'] = amt_credit / amt_annuity
    if 'EMPLOYED_AGE_PERCENT' in expected_features: 
        df_input.at[0, 'EMPLOYED_AGE_PERCENT'] = years_employed / age_years if age_years > 0 else 0
    if 'GOODS_CREDIT_PERCENT' in expected_features: 
        df_input.at[0, 'GOODS_CREDIT_PERCENT'] = amt_goods / amt_credit

    # 5. Make Prediction
    probability = model.predict_proba(df_input)[0, 1]
    is_rejected = bool(probability >= optimal_threshold)
    decision = "Reject" if is_rejected else "Approve"
    
    # 6. Generate XAI (SHAP)
    shap_values = explainer.shap_values(df_input)
    shap_values_single = shap_values[1][0] if isinstance(shap_values, list) else shap_values[0]
        
    shap_df = pd.DataFrame({'Feature': expected_features, 'SHAP_Impact': shap_values_single})
    top_risk_factors = shap_df.sort_values(by='SHAP_Impact', ascending=False).head(4)
    
    recommendations = []
    explanations_log = []
    
    for _, row in top_risk_factors.iterrows():
        raw_feature = row['Feature']
        effect = row['SHAP_Impact']
        
        # Strip the One-Hot suffix for dictionary matching (e.g., NAME_INCOME_TYPE_Working -> NAME_INCOME_TYPE)
        dict_key = raw_feature.split('_')[0] + '_' + raw_feature.split('_')[1] if raw_feature.count('_') > 1 and raw_feature not in xai_dictionary else raw_feature
        
        translation = xai_dictionary.get(dict_key, xai_dictionary.get(raw_feature, {
            "display_name": raw_feature.replace('_', ' ').title(),
            "reason": "This metric flagged our automated risk parameters.",
            "action": "Discuss this metric with a verified loan officer."
        }))
        
        recommendations.append({
            "feature_name": translation["display_name"],
            "reason": translation["reason"],
            "action": translation["action"],
            "effect": float(effect) # Pass effect to frontend for the chart
        })
        
        explanations_log.append({"feature": translation["display_name"], "effect": float(effect)})
        
    return {
        "applicant_ic": applicant_ic,
        "status": "success",
        "risk_probability": float(probability),
        "decision": decision,
        "threshold_used": optimal_threshold,
        "recommendations": recommendations,
        "raw_features_log": raw_input, # Passed back so main.py can save it to DB
        "shap_log": explanations_log
    }