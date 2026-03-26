import asyncio
import logging
from bson import ObjectId
from app.db.mongodb import get_db
from app.services.sms_service import sms_service


# Keep escalation stages fast for demo/test reliability.
# (Backend will still perform the same Stage 1 -> Stage 2 -> Stage 3 flow.)
STAGE1_SLEEP_SECONDS = 5
STAGE2_SLEEP_SECONDS = 5

class EscalationService:
    def __init__(self):
        # Dictionary to track active escalations (emergency_id -> task)
        self.active_escalations = {}
        # Track acknowledgement status (emergency_id -> user_id)
        self.acknowledgements = {}

    async def _escalation_flow(self, emergency_id: str, user_id: str, payload: dict):
        try:
            db = get_db()
            if db is None:
                logging.error("Database not initialized.")
                return

            # Resolve the authenticated trigger user.
            query = {"_id": ObjectId(user_id)} if len(user_id) == 24 else {"id": user_id}
            trigger_user = await db.users.find_one(query)
            
            if not trigger_user:
                logging.error(f"User {user_id} not found.")
                return

            # Determine "patient context" for escalation:
            # - If a patient triggers SOS, they are the patient context.
            # - If a family member triggers SOS, use `linked_patient_id` as the patient context.
            trigger_role = trigger_user.get("role")
            patient_user = trigger_user
            patient_id_str = str(trigger_user.get("_id"))

            if trigger_role == "family":
                linked_patient_id = trigger_user.get("linked_patient_id")
                if linked_patient_id:
                    patient_id_str = str(linked_patient_id)
                    # linked_patient_id is stored as a stringified ObjectId in registration.
                    patient_query = (
                        {"_id": ObjectId(linked_patient_id)}
                        if len(str(linked_patient_id)) == 24
                        else {"_id": linked_patient_id}
                    )
                    linked_patient = await db.users.find_one(patient_query)
                    if linked_patient:
                        patient_user = linked_patient
                else:
                    logging.error(f"[{emergency_id}] Family user missing linked_patient_id: {user_id}")

            patient_name = patient_user.get("full_name", "Patient")
            flat = patient_user.get("flat_number", "Unknown Flat")
            apt = patient_user.get("apartment_name", "Unknown Apartment")
            msg = f"🚨 Emergency! {patient_name} from {flat} needs help at {apt}."

            # Stage 1: Notify nearby users (same apartment; fallback to all others)
            logging.info(f"[{emergency_id}] Stage 1: Notifying nearby users for {user_id}")
            nearby_query = {"_id": {"$ne": patient_user["_id"]}}
            if apt and apt != "Unknown Apartment":
                nearby_query["apartment_name"] = apt

            nearby_users = await db.users.find(nearby_query).to_list(length=100)
            if not nearby_users:
                nearby_users = await db.users.find({"_id": {"$ne": patient_user["_id"]}}).to_list(length=100)

            phone_numbers = [u.get("phone_number") for u in nearby_users if u.get("phone_number")]
            phone_numbers = list(dict.fromkeys(phone_numbers))  # stable unique
            await sms_service.send_sms(phone_numbers, msg)

            await asyncio.sleep(STAGE1_SLEEP_SECONDS)
            if self.is_acknowledged(emergency_id):
                return

            # Stage 2: Notify family members linked to this patient
            logging.info(f"[{emergency_id}] Stage 2: Notifying linked family users for patient {patient_id_str}")
            family_users = await db.users.find(
                {"role": "family", "linked_patient_id": patient_id_str}
            ).to_list(length=100)

            # Backward compatibility: older links might be stored only in `family_links`.
            if not family_users:
                family_links = await db.family_links.find(
                    {"patient_user_id": patient_id_str}
                ).to_list(length=100)
                family_user_ids = [
                    link.get("family_user_id")
                    for link in family_links
                    if link.get("family_user_id") and len(str(link.get("family_user_id"))) == 24
                ]
                if family_user_ids:
                    family_users = await db.users.find(
                        {"role": "family", "_id": {"$in": [ObjectId(fid) for fid in family_user_ids]}}
                    ).to_list(length=100)

            family_numbers = [u.get("phone_number") for u in family_users if u.get("phone_number")]
            family_numbers = list(dict.fromkeys(family_numbers))
            if family_numbers:
                await sms_service.send_sms(family_numbers, msg)

            await asyncio.sleep(STAGE2_SLEEP_SECONDS)
            if self.is_acknowledged(emergency_id):
                return

            # Stage 3: Send SMS to emergency contacts (from patient context)
            logging.info(f"[{emergency_id}] Stage 3: Sending SMS fallback emergency contacts for patient {patient_id_str}")
            emergency_contacts = patient_user.get("emergency_contacts", [])
            if emergency_contacts:
                await sms_service.send_sms(emergency_contacts, msg)
            
        except asyncio.CancelledError:
            logging.info(f"[{emergency_id}] Escalation flow cancelled.")
        except Exception as e:
            logging.error(f"[{emergency_id}] Error in escalation flow: {e}")

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
