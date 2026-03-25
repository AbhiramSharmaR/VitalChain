from fastapi import APIRouter
from app.services.emergency_state import state_manager

router = APIRouter(prefix="/vitals", tags=["Vitals"])

@router.get("/{user_id}")
async def get_vitals(user_id: str):
    state = state_manager.get_state(user_id)
    if not state:
        return {"error": "User state not initialized"}
    v = state["vitals"]
    return {
        "heart_rate": v.get("heart_rate"),
        "spo2": v.get("spo2"),
        "triage": v.get("triage"),
        "state": state["status"],
        "emergency_id": state["emergency_id"]
    }

@router.post("/stream")
async def stream_vitals(user_id: str, vitals: dict):
    state_manager.update_vitals(user_id, vitals)
    return {"status": "success"}

@router.get("/{user_id}/latency")
async def get_latency(user_id: str):
    from app.services.latency_tracker import LatencyTracker
    return LatencyTracker.get_metrics(user_id)
