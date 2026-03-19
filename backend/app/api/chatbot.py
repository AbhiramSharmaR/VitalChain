from fastapi import APIRouter
from pydantic import BaseModel
from app.services.emergency_state import state_manager
from app.ai.medical_chatbot import get_chatbot_response

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])

class ChatRequest(BaseModel):
    user_id: str
    message: str

@router.post("/")
async def chat(request: ChatRequest):
    state = state_manager.get_state(request.user_id)
    if not state:
        return {"error": "User state not initialized"}
        
    vitals = state.get("vitals", {})
    status = state.get("status", "MONITORING")
    latency = state.get("latency", {})
    
    response = get_chatbot_response(request.message, vitals, status, latency)
    
    return {
        "reply": response["clinical_explanation"] + " " + response["system_action_explanation"]
    }
