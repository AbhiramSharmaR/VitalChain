from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from app.ai.medical_chatbot import analyze_symptom_list

router = APIRouter(
    prefix="/symptomchecker",
    tags=["Symptom Checker"]
)

# -----------------------------
# Request Schema
# -----------------------------
class SymptomCheckRequest(BaseModel):
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

# -----------------------------
# API Endpoint
# -----------------------------
@router.post("/", response_model=SymptomCheckResponse)
def check_symptoms(payload: SymptomCheckRequest):
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

    # Assuming we don't have vitals here since it's a generic endpoint, or ideally we fetch it if we had user_id.
    # The prompt doesn't strictly say fetch vitals here, just "pass if available".
    result = analyze_symptom_list(merged_symptoms)
    
    return result
