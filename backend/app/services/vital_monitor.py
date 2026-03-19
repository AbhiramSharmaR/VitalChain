import asyncio
from app.services.emergency_state import state_manager
from app.ai.vital_simulator import get_simulated_vitals
from app.services.emergency_flow import trigger_emergency_flow

_monitoring_tasks = {}

async def _monitor_loop(user_id: str):
    cycle = 1
    critical_count = 0
    state_manager.init_user(user_id)
    
    while True:
        try:
            # 1. Fetch vitals deterministically
            vitals = get_simulated_vitals(cycle)
            
            # 2. Update state manager
            state_manager.update_vitals(user_id, vitals)
            
            # 3. Triage logic
            state = state_manager.get_state(user_id)
            if vitals["triage"] == "RED":
                critical_count += 1
            else:
                critical_count = 0
                
            # Trigger SOS if abnormal persists (2 cycles)
            if critical_count >= 2:
                # Trigger flow async
                if state["status"] == "MONITORING":
                    asyncio.create_task(trigger_emergency_flow(user_id))
            
            cycle += 1
            # Prevent cycle from growing infinitely for demo purposes after Escalation is complete
            if cycle > 15:
                cycle = 15 # Cap it so it stays RED

            await asyncio.sleep(2.5) # 2-3 sec interval
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"Error in monitor loop: {e}")
            await asyncio.sleep(2)

def start_monitoring(user_id: str):
    if user_id not in _monitoring_tasks:
        task = asyncio.create_task(_monitor_loop(user_id))
        _monitoring_tasks[user_id] = task

def stop_monitoring(user_id: str):
    if user_id in _monitoring_tasks:
        _monitoring_tasks[user_id].cancel()
        del _monitoring_tasks[user_id]
