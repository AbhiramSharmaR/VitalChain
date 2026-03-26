from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from app.ai.medical_chatbot import analyze_symptom_list
from app.services.emergency_flow import trigger_emergency_flow
from app.services.emergency_state import state_manager
import asyncio

router = APIRouter(
    prefix="/symptomchecker",
    tags=["Symptom Checker"]
)

# -----------------------------
# Request Schema
# -----------------------------
class SymptomCheckRequest(BaseModel):
    user_id: Optional[str] = None
    symptoms: List[str]
    description: Optional[str] = None
    other: Optional[str] = None

# -----------------------------
# Response Schema
# -----------------------------
class ConditionResult(BaseModel):
    name: str
    confidence: float

class SymptomCheckResponse(BaseModel):
    top_condition: str
    confidence: float
    alternatives: List[ConditionResult]
    severity: str
    advice: str
    sos_triggered: bool
    emergency_status: str

def _has_red_flags(tokens: List[str]) -> bool:
    red_flags = {
        "chest pain",
        "shortness of breath",
        "difficulty breathing",
        "severe chest pain",
        "fainting",
        "bluish skin",
    }
    joined = " ".join(tokens).lower()
    if any(flag in joined for flag in red_flags):
        return True
    if "spo2" in joined and ("<" in joined or "low" in joined):
        return True
    return False

def _advice_for(severity: str, top_condition: str) -> str:
    s = (severity or "").upper()
    if s == "HIGH":
        return (
            "Your symptoms may indicate a serious issue. If you have severe or worsening symptoms "
            "(trouble breathing, chest pain, confusion, fainting, or bluish lips/face), seek urgent medical care now. "
            "If this is an emergency, call your local emergency number."
        )
    if s == "MEDIUM":
        return (
            "Consider resting, staying hydrated, and monitoring symptoms. If symptoms persist beyond 24–48 hours, "
            "worsen, or you develop red-flag symptoms (chest pain, difficulty breathing, fainting), seek medical evaluation."
        )
    return (
        "This looks lower risk based on the selected symptoms, but monitor how you feel. Rest, hydrate, and consider "
        "seeking medical advice if symptoms persist or worsen."
    )

# -----------------------------
# API Endpoint
# -----------------------------
@router.post("/", response_model=SymptomCheckResponse)
async def check_symptoms(payload: SymptomCheckRequest):
    # Merge symptoms and "other"/"description" text
    merged_symptoms = list(payload.symptoms)
    
    if payload.description:
        # Simple extraction by splitting spaces/commas could be done, or just pass as a single chunk
        # Since analyze_symptom_list does token overlap, appending works fine.
        merged_symptoms.extend([s.strip() for s in payload.description.replace(',', ' ').split() if s.strip()])
    
    if payload.other:
        merged_symptoms.extend([s.strip() for s in payload.other.replace(',', ' ').split() if s.strip()])

    if not merged_symptoms:
        raise HTTPException(status_code=400, detail="No symptoms provided")

    result = analyze_symptom_list(merged_symptoms)

    # Red-flag override (forces HIGH, can trigger SOS)
    normalized = [s.lower().strip() for s in merged_symptoms if s and s.strip()]
    red_flag = _has_red_flags(normalized)
    severity = (result.get("severity") or "LOW").upper()
    if red_flag:
        severity = "HIGH"

    sos_triggered = False
    emergency_status = "MONITORING"
    if payload.user_id:
        state = state_manager.get_state(payload.user_id)
        emergency_status = (state or {}).get("status", "MONITORING")
        if severity == "HIGH" and emergency_status not in ["ALERT", "ESCALATED"]:
            sos_triggered = True
            # Fire-and-forget; don't block the HTTP request.
            asyncio.create_task(trigger_emergency_flow(payload.user_id))

    advice = _advice_for(severity, result.get("top_condition", "Unknown"))

    return {
        "top_condition": result.get("top_condition", "Unknown"),
        "confidence": result.get("confidence", 0.0),
        "alternatives": result.get("alternatives", []),
        "severity": severity,
        "advice": advice,
        "sos_triggered": sos_triggered,
        "emergency_status": emergency_status,
    }
