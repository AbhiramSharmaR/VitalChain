import logging
from datetime import datetime, timezone
from typing import ClassVar, Dict, List

logger = logging.getLogger(__name__)

class SMSService:
    # Simple in-memory outbox for demo/testing visibility.
    # Structure: [{"to": "...", "message": "...", "timestamp": "..."}]
    outbox: ClassVar[List[Dict]] = []

    @staticmethod
    async def send_sms(to_numbers: List[str], message: str):
        """
        Simulates sending an SMS to a list of phone numbers.
        Structure is ready to plug in a real provider (e.g. Twilio) later.
        """
        if not to_numbers:
            logger.warning("No phone numbers provided for SMS dispatch.")
            return

        for number in to_numbers:
            logger.info(f"SMS SENT → To: {number} | Message: {message}")
            SMSService.outbox.append(
                {
                    "to": number,
                    "message": message,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            )

    @classmethod
    def get_outbox(cls) -> List[Dict]:
        return list(cls.outbox)

    @classmethod
    def clear_outbox(cls) -> None:
        cls.outbox.clear()

sms_service = SMSService()
