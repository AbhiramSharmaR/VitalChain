def determine_triage_level(vitals: dict) -> str:
    """
    Determines triage level based on incoming vitals.
    RED: heart_rate > 130 OR spo2 < 90
    YELLOW: heart_rate > 100 OR spo2 < 95
    GREEN: normal
    """
    hr = vitals.get("heart_rate", 75)
    spo2 = vitals.get("spo2", 98)

    if hr > 130 or spo2 < 90:
        return "RED"
    elif hr > 100 or spo2 < 95:
        return "YELLOW"
    return "GREEN"
