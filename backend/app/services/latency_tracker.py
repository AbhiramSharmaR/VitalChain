import time
from app.services.emergency_state import state_manager

class LatencyTracker:
    @staticmethod
    def record_alert(user_id: str):
        state_manager.update_latency(user_id, "alert_time", time.time())

    @staticmethod
    def record_acknowledgment(user_id: str):
        state_manager.update_latency(user_id, "acknowledgment_time", time.time())

    @staticmethod
    def record_escalation(user_id: str):
        state_manager.update_latency(user_id, "escalation_time", time.time())

    @staticmethod
    def get_metrics(user_id: str) -> dict:
        state = state_manager.get_state(user_id)
        latency = state["latency"]
        
        alert_t = latency.get("alert_time")
        ack_t = latency.get("acknowledgment_time")
        esc_t = latency.get("escalation_time")
        
        total_response_time = None
        if alert_t and ack_t:
            total_response_time = round(ack_t - alert_t, 2)
            
        time_to_escalation = None
        if alert_t and esc_t:
            time_to_escalation = round(esc_t - alert_t, 2)
            
        return {
            "total_response_time_sec": total_response_time,
            "time_to_escalation_sec": time_to_escalation,
            "alert_time": alert_t,
            "acknowledgment_time": ack_t,
            "escalation_time": esc_t
        }
