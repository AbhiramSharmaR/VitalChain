import uuid
import asyncio
from app.services.emergency_state import state_manager
from app.services.latency_tracker import LatencyTracker
from app.services.responder_simulator import simulate_responder_movement

async def trigger_emergency_flow(user_id: str):
    state = state_manager.get_state(user_id)
    
    # 3. Single Emergency Trigger GUARANTEE
    if state["status"] in ["ALERT", "ESCALATED"]:
        return # Emergency already active, skip trigger
        
    emergency_id = str(uuid.uuid4())
    state_manager.set_emergency_id(user_id, emergency_id)
    state_manager.update_status(user_id, "ALERT")
    
    LatencyTracker.record_alert(user_id)
    
    print(f"DEBUG: Emergency triggered for {user_id}. Waiting for ACK...")
    
    # Wait for acknowledgment (simulate 10 seconds timeout for escalation)
    await asyncio.sleep(10)
    
    state = state_manager.get_state(user_id)
    # If not acknowledged, escalate!
    if state["status"] == "ALERT":
        print(f"DEBUG: No ACK received. Escalating emergency {emergency_id}!")
        state_manager.update_status(user_id, "ESCALATED")
        LatencyTracker.record_escalation(user_id)
        
        # Start responder simulation
        patient_lat = state["location"]["lat"]
        patient_lng = state["location"]["lng"]
        asyncio.create_task(simulate_responder_movement(emergency_id, patient_lat, patient_lng))
