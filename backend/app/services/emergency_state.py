from typing import Dict, Optional, Any

# Shared in-memory state manager
# Structure: user_id -> { status, vitals, latency, location, emergency_id }

class EmergencyStateManager:
    def __init__(self):
        self._state: Dict[str, Dict[str, Any]] = {}

    def init_user(self, user_id: str):
        if user_id not in self._state:
            self._state[user_id] = {
                "status": "MONITORING", # MONITORING, ALERT, ESCALATED
                "vitals": {"heart_rate": 75, "spo2": 98, "triage": "GREEN", "cycle": 0},
                "latency": {
                    "alert_time": None,
                    "acknowledgment_time": None,
                    "escalation_time": None
                },
                "location": {"lat": 40.7128, "lng": -74.0060}, # Default mock location
                "emergency_id": None
            }

    def get_state(self, user_id: str) -> Optional[Dict[str, Any]]:
        self.init_user(user_id)
        return self._state.get(user_id)

    def update_vitals(self, user_id: str, vitals: dict):
        self.init_user(user_id)
        self._state[user_id]["vitals"].update(vitals)

    def update_status(self, user_id: str, status: str):
        self.init_user(user_id)
        self._state[user_id]["status"] = status

    def set_emergency_id(self, user_id: str, emergency_id: str):
        self.init_user(user_id)
        self._state[user_id]["emergency_id"] = emergency_id

    def update_latency(self, user_id: str, field: str, timestamp: float):
        self.init_user(user_id)
        self._state[user_id]["latency"][field] = timestamp

# Singleton instance
state_manager = EmergencyStateManager()
