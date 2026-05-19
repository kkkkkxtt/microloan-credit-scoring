import os
import json
import joblib
import pandas as pd
import numpy as np
import shap

"""ML prediction helpers.

This module is responsible for:

- loading the trained model and configuration artifacts,
- running predictions on incoming feature dictionaries, and
- producing explainability artifacts (SHAP logs and human-friendly
  recommendations) used by the frontend.

The functions are written to lazily load model artifacts on first use
so the FastAPI process can start quickly in development.
"""

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.abspath(os.path.join(current_dir, '..', '..'))

MODEL_PATH = os.path.join(backend_root, 'saved_models', 'final_microloan_model.pkl')
CONFIG_PATH = os.path.join(backend_root, 'saved_models', 'deployment_config.json')
DICT_PATH = os.path.join(backend_root, 'config', 'xai_feature_dictionary.json')

model = None
explainer = None
expected_features = []
xai_dictionary = {}


def load_ml_assets():
    """Load persisted model, explainer, expected features and config.

    This function updates module-level variables (`model`, `explainer`,
    `expected_features`, `optimal_threshold`, and `xai_dictionary`) so
    subsequent calls to `process_prediction` can run quickly.
    """
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
    """Run the ML model on ``raw_input`` and return structured results.

    Returns a dictionary with:
    - `risk_probability`: model probability (float)
    - `decision`: human-friendly decision string ('Approve'|'Reject')
    - `recommendations`: a list of top feature explanations and actions
    - `shap_log`: full SHAP-based feature effects for visualization

    The function ensures all expected features are present, computes the
    model probability, uses SHAP for local explanations, and builds a
    set of actionable recommendations for the frontend.
    """
    if model is None:
        load_ml_assets()

    applicant_ic = raw_input.get("applicant_ic", "UNKNOWN")

    # Prepare data frame with the expected feature ordering
    input_df = pd.DataFrame([raw_input])

    # Ensure all expected features are present (fallback safety)
    for col in expected_features:
        if col not in input_df.columns:
            input_df[col] = 0

    input_df = input_df[expected_features]

    # Predict probability (assumes binary classifier with predict_proba)
    probability = model.predict_proba(input_df)[0][1]
    decision = "Approve" if probability < optimal_threshold else "Reject"

    # SHAP explanation
    shap_values = explainer(input_df)

    # Map feature effects into a DataFrame for sorting and selection
    feature_importance = pd.DataFrame({
        'feature': expected_features,
        'effect': shap_values.values[0]
    })

    # Enrich shap log items with human-friendly dictionary text
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

    # Sort by absolute importance and pick top 4 for recommendations
    feature_importance['abs_effect'] = feature_importance['effect'].abs()
    top_features = feature_importance.sort_values(by='abs_effect', ascending=False).head(4)[['feature', 'effect']].values

    recommendations = []
    for raw_feature, effect in top_features:
        dict_key = raw_feature
        for prefix in ['NAME_INCOME_TYPE_', 'NAME_EDUCATION_TYPE_', 'NAME_FAMILY_STATUS_', 'NAME_HOUSING_TYPE_', 'OCCUPATION_TYPE_', 'ORGANIZATION_TYPE_']:
            if raw_feature.startswith(prefix):
                dict_key = prefix[:-1]
                break

        dict_entry = xai_dictionary.get(dict_key, {})
        display_name = dict_entry.get("display_name", raw_feature.replace('_', ' ').title())

        # Build dual-sided explanation (risk vs protective)
        if float(effect) > 0:
            reason = dict_entry.get("risk_reason", "This specific metric deviated from standard safety thresholds and increased risk.")
            action = dict_entry.get("risk_action", "Review this financial metric or discuss with a loan officer.")
        else:
            reason = dict_entry.get("protective_reason", "This metric showed strong alignment with historically successful repayments.")
            action = dict_entry.get("protective_action", "Maintain this standard to keep a strong financial profile.")

        recommendations.append({
            "feature_name": display_name,
            "reason": reason,
            "action": action,
            "effect": float(effect)
        })

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