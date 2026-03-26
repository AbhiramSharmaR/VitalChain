from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid
import datetime
from app.services.escalation_service import escalation_service
from app.api.ws import manager

router = APIRouter(prefix="/alerts", tags=["Alerts"])

class TriggerPayload(BaseModel):
    user_id: str
    reason: str = "SOS Button"

class AcknowledgePayload(BaseModel):
    acknowledged_by: str

# In-memory mock DB for alerts as requested
ALERTS_DB = {}

@router.post("/trigger")
async def trigger_alert(payload: TriggerPayload):
    alert_id = str(uuid.uuid4())
    alert_data = {
        "id": alert_id,
        "user_id": payload.user_id,
        "reason": payload.reason,
        "status": "ESCALATING",
        "triage_level": "RED", # Automatically elevate to RED on trigger
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    ALERTS_DB[alert_id] = alert_data

    # Broadcast to WebSocket clients (e.g., Doctor/Responder Dashboard)
    await manager.broadcast({
        "event": "alert_triggered",
        "data": alert_data
    })

    # Start Escalation Service Process
    escalation_service.start_escalation(alert_id, payload.user_id, alert_data)
    
    return {"message": "Alert triggered successfully", "alert": alert_data}

@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, payload: AcknowledgePayload):
    if alert_id not in ALERTS_DB:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    ALERTS_DB[alert_id]["status"] = "ACKNOWLEDGED"
    ALERTS_DB[alert_id]["acknowledged_by"] = payload.acknowledged_by
    
    # Stop escalation immediately
    escalation_service.acknowledge_alert(alert_id, payload.acknowledged_by)
    
    # Broadcast ack to WS clients
    await manager.broadcast({
        "event": "alert_acknowledged",
        "data": ALERTS_DB[alert_id]
    })
    
    return {"message": "Alert acknowledged", "status": "success"}
