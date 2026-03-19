# Deterministic vitals simulator
# cycles 1-3 -> normal
# cycles 4-6 -> warning
# cycles 7+ -> critical

def get_simulated_vitals(cycle: int) -> dict:
    if cycle <= 3:
        # Normal
        return {"heart_rate": 75, "spo2": 98, "triage": "GREEN", "cycle": cycle}
    elif cycle <= 6:
        # Warning
        return {"heart_rate": 110, "spo2": 93, "triage": "YELLOW", "cycle": cycle}
    else:
        # Critical
        return {"heart_rate": 150, "spo2": 85, "triage": "RED", "cycle": cycle}
