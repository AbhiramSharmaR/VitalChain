from fastapi import APIRouter
from pydantic import BaseModel
from app.services.emergency_state import state_manager
from app.ai.medical_chatbot import analyze_text_query

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])

class ChatRequest(BaseModel):
    user_id: str
    message: str

@router.post("/")
async def chat(request: ChatRequest):
    state = state_manager.get_state(request.user_id)
    vitals = {}
    status = "MONITORING"
    
    if state:
        vitals = state.get("vitals", {})
        status = state.get("status", "MONITORING")
    
    result = analyze_text_query(user_input=request.message, vitals=vitals, state=status)
    
    return {
        "response": result["response"],
        "confidence": result["confidence"],
        "predictions": result["predictions"]
    }
