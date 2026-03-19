from fastapi import APIRouter
from app.services.emergency_state import state_manager
from app.services.responder_simulator import get_responder_location

router = APIRouter(prefix="/map", tags=["Map"])

@router.get("/{emergency_id}")
async def get_map_data(emergency_id: str):
    patient_loc = None
    status = None
    
    # Simple search
    for uid, state in state_manager._state.items():
        if state.get("emergency_id") == emergency_id:
            patient_loc = state.get("location")
            status = state.get("status")
            break
            
    responder_loc = get_responder_location(emergency_id)
    
    return {
        "patient_location": patient_loc,
        "responder_location": responder_loc,
        "eta": "5 mins" if responder_loc else None,
        "status": status
    }
