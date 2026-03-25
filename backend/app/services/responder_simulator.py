import asyncio
from typing import Dict

# Simulates responder moving towards patient
responder_locations: Dict[str, dict] = {} # emergency_id -> location

async def simulate_responder_movement(emergency_id: str, dest_lat: float, dest_lng: float):
    # Starting slightly offset from patient
    current_lat = dest_lat + 0.005
    current_lng = dest_lng + 0.005
    
    responder_locations[emergency_id] = {"lat": current_lat, "lng": current_lng}
    
    steps = 15
    lat_step = (dest_lat - current_lat) / steps
    lng_step = (dest_lng - current_lng) / steps
    
    for _ in range(steps):
        await asyncio.sleep(2) # move every 2 seconds
        current_lat += lat_step
        current_lng += lng_step
        responder_locations[emergency_id] = {"lat": current_lat, "lng": current_lng}

def get_responder_location(emergency_id: str) -> dict:
    return responder_locations.get(emergency_id)
