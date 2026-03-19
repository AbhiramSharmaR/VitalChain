# Rule-based + template-based reasoning chatbot
def get_chatbot_response(symptoms: str, vitals: dict, status: str, latency: dict) -> dict:
    triage = vitals.get("triage", "GREEN")
    
    clinical_explanation = "Your vitals appear normal."
    action_explanation = "The system is continuously monitoring your health."
    
    if triage == "YELLOW":
        clinical_explanation = "Your heart rate is elevated and SpO2 is slightly low."
        action_explanation = "We are closely monitoring for any further deterioration."
    elif triage == "RED":
        clinical_explanation = "Critical vitals detected! Extremely high heart rate and low oxygen levels indicate a medical emergency."
        if status == "ALERT":
            action_explanation = "An automatic emergency alert has been triggered. Please wait for acknowledgment."
        elif status == "ESCALATED":
            action_explanation = "Help is on the way! Emergency responders have been dispatched."
            
    if symptoms and "pain" in symptoms.lower():
        clinical_explanation += " Experiencing pain can further elevate your heart rate."
        
    return {
        "clinical_explanation": clinical_explanation,
        "system_action_explanation": action_explanation
    }
