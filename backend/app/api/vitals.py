from fastapi import APIRouter
from app.services.emergency_state import state_manager
from app.services.vitals_service import vitals_service
from app.services.triage_service import determine_triage_level

router = APIRouter(prefix="/vitals", tags=["Vitals"])

@router.get("/{user_id}")
async def get_vitals(user_id: str):
    vitals = vitals_service.get_vitals(user_id)
    triage = determine_triage_level(vitals)
    vitals["triage"] = triage
    
    state = state_manager.get_state(user_id)
    return {
        **vitals,
        "state": state["status"] if state else "MONITORING",
        "emergency_id": state["emergency_id"] if state else None
    }

@router.post("/stream")
async def stream_vitals(user_id: str, vitals: dict):
    state_manager.update_vitals(user_id, vitals)
    return {"status": "success"}

@router.get("/{user_id}/latency")
async def get_latency(user_id: str):
    from app.services.latency_tracker import LatencyTracker
    return LatencyTracker.get_metrics(user_id)
