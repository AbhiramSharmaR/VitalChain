import random

def generate_realistic_vitals():
    """Generates realistic random vitals. Ready for IoT integration."""
    return {
        "heart_rate": random.randint(60, 140),
        "spo2": random.randint(85, 100),
        "blood_pressure": f"{random.randint(110, 140)}/{random.randint(70, 90)}",
        "temperature": round(random.uniform(97.0, 100.5), 1),
        "respiratory_rate": random.randint(12, 24)
    }

class VitalsService:
    def __init__(self):
        # Cache the generated vitals per user if needed
        self.cached_vitals = {}

    def get_vitals(self, user_id: str):
        # Generate new vitals on each request to simulate live streaming
        vitals = generate_realistic_vitals()
        self.cached_vitals[user_id] = vitals
        return vitals

vitals_service = VitalsService()
