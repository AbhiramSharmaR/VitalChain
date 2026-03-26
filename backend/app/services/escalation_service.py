import asyncio
import logging

class EscalationService:
    def __init__(self):
        # Dictionary to track active escalations (emergency_id -> task)
        self.active_escalations = {}
        # Track acknowledgement status (emergency_id -> user_id)
        self.acknowledgements = {}

    async def _escalation_flow(self, emergency_id: str, user_id: str, payload: dict):
        try:
            # Stage 1 (0-30s): Notify nearby users
            logging.info(f"[{emergency_id}] Stage 1: Notifying nearby users for {user_id}")
            # Simulate DB query for flat/group here if needed.
            
            await asyncio.sleep(30)
            if self.is_acknowledged(emergency_id): return

            # Stage 2 (30-60s): Notify family members
            logging.info(f"[{emergency_id}] Stage 2: Notifying family members for {user_id}")
            
            await asyncio.sleep(30)
            if self.is_acknowledged(emergency_id): return

            # Stage 3 (60-120s): Send SMS
            logging.info(f"[{emergency_id}] Stage 3: Sending SMS fallback to emergency contacts for {user_id}")
            
        except asyncio.CancelledError:
            logging.info(f"[{emergency_id}] Escalation flow cancelled.")

    def start_escalation(self, emergency_id: str, user_id: str, payload: dict = None):
        """Starts the 3-stage escalation process in the background."""
        if emergency_id in self.active_escalations:
            return  # Already handling it

        task = asyncio.create_task(self._escalation_flow(emergency_id, user_id, payload or {}))
        self.active_escalations[emergency_id] = task

    def acknowledge_alert(self, emergency_id: str, acknowledged_by_user_id: str):
        """Stops the escalation immediately."""
        self.acknowledgements[emergency_id] = acknowledged_by_user_id
        if emergency_id in self.active_escalations:
            self.active_escalations[emergency_id].cancel()
            del self.active_escalations[emergency_id]

    def is_acknowledged(self, emergency_id: str) -> bool:
        return emergency_id in self.acknowledgements

escalation_service = EscalationService()
