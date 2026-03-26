import time
import uuid

import requests


def _rand_email(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:6]}@example.com"


def test_sms_flow():
    base_url = "http://localhost:8000"

    # Unique apartment name to avoid interference from existing demo data.
    apt_name = f"SOS_TEST_APT_{uuid.uuid4().hex[:6]}"

    # 1. Register patient (SOS trigger user)
    patient = {
        "email": _rand_email("alice"),
        "full_name": "Alice Tester",
        "password": "password123",
        "role": "patient",
        "phone_number": "111-111-1111",
        "flat_number": "A-101",
        "apartment_name": apt_name,
        "address": "123 Test St",
    }
    r1 = requests.post(f"{base_url}/auth/register", json=patient)
    assert r1.status_code == 200, f"Patient register failed: {r1.status_code} {r1.text}"

    # 2. Register a nearby user in the same apartment (for Stage 1 verification)
    nearby = {
        "email": _rand_email("neighbor"),
        "full_name": "Bob Neighbor",
        "password": "password123",
        "role": "patient",
        "phone_number": "333-333-3333",
        "flat_number": "A-102",
        "apartment_name": apt_name,
        "address": "123 Test St",
    }
    r2 = requests.post(f"{base_url}/auth/register", json=nearby)
    assert r2.status_code == 200, f"Nearby register failed: {r2.status_code} {r2.text}"

    # 3. Register family member linked to the patient (for Stage 2 verification)
    family = {
        "email": _rand_email("family"),
        "full_name": "Carol Family",
        "password": "password123",
        "role": "family",
        "phone_number": "222-222-2222",
        "flat_number": "F-201",
        # Different apartment on purpose so Stage 1 (nearby) won't pick them up.
        "apartment_name": "SOS_TEST_OTHER_APT",
        "address": "456 Other St",
        "patient_email": patient["email"],
    }
    r3 = requests.post(f"{base_url}/auth/register", json=family)
    assert r3.status_code == 200, f"Family register failed: {r3.status_code} {r3.text}"

    # 4. Login as patient
    login = {"email": patient["email"], "password": patient["password"]}
    r_login = requests.post(f"{base_url}/auth/login", json=login)
    assert r_login.status_code == 200, f"Patient login failed: {r_login.status_code} {r_login.text}"
    token = r_login.json()["access_token"]

    # Sanity check: backend extracts correct user from JWT.
    r_me = requests.get(f"{base_url}/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r_me.status_code == 200, f"/auth/me failed: {r_me.status_code} {r_me.text}"
    assert r_me.json()["role"] == "patient", "JWT role mismatch"

    # Clear outbox before triggering SOS
    r_clear = requests.post(
        f"{base_url}/sms/outbox/clear",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r_clear.status_code == 200, f"Clear outbox failed: {r_clear.status_code} {r_clear.text}"

    # 5. Trigger SOS (NO user_id in payload)
    r_sos = requests.post(
        f"{base_url}/alerts/trigger",
        headers={"Authorization": f"Bearer {token}"},
        json={"reason": "Test SMS SOS"},
    )
    assert r_sos.status_code == 200, f"SOS trigger failed: {r_sos.status_code} {r_sos.text}"

    # Wait for Stage 1 (immediate) + Stage 2 (after stage1 wait in escalation service).
    time.sleep(10)

    # Verify SMS outbox content
    r_outbox = requests.get(
        f"{base_url}/sms/outbox",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r_outbox.status_code == 200, f"Outbox fetch failed: {r_outbox.status_code} {r_outbox.text}"
    outbox = r_outbox.json().get("outbox", [])
    sent_to = [entry.get("to") for entry in outbox]

    neighbor_phone = nearby["phone_number"]
    family_phone = family["phone_number"]

    # Stage 1: nearby users
    assert neighbor_phone in sent_to, f"Stage 1 SMS missing nearby user {neighbor_phone}. Sent: {sent_to}"

    # Stage 2: linked family members via linked_patient_id
    assert family_phone in sent_to, f"Stage 2 SMS missing family user {family_phone}. Sent: {sent_to}"

    # Ensure message uses the correct patient identity from JWT extraction.
    messages = [entry.get("message", "") for entry in outbox]
    assert any(patient["full_name"] in m for m in messages), "SOS message missing patient name from correct context"

    print("SMS flow test PASSED.")
    print("Outbox entries:", outbox)


if __name__ == "__main__":
    test_sms_flow()
