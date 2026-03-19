from fastapi import APIRouter
from app.services.emergency_state import state_manager

router = APIRouter(prefix="/location", tags=["Location"])

@router.post("/update")
async def update_location(user_id: str, lat: float, lng: float):
    state_manager.init_user(user_id)
    state_manager._state[user_id]["location"] = {"lat": lat, "lng": lng}
    return {"status": "updated"}

@router.get("/{user_id}")
async def get_location(user_id: str):
    state = state_manager.get_state(user_id)
    return state["location"] if state else None
