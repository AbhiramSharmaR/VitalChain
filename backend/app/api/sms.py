from fastapi import APIRouter, Depends
from app.core.deps import get_current_user
from app.services.sms_service import sms_service

router = APIRouter(prefix="/sms", tags=["SMS"])


@router.get("/outbox")
async def get_sms_outbox(current_user: dict = Depends(get_current_user)):
    # Protected to ensure identity is available for the testing flow.
    return {"outbox": sms_service.get_outbox()}


@router.post("/outbox/clear")
async def clear_sms_outbox(current_user: dict = Depends(get_current_user)):
    sms_service.clear_outbox()
    return {"message": "SMS outbox cleared"}

