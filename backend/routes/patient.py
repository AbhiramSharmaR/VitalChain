from fastapi import APIRouter
from database import db
import uuid

router = APIRouter()

@router.post("/create-patient")
async def create_patient(name: str, email: str):
    
    # Permanent unique 8 char code
    unique_code = uuid.uuid4().hex[:8].upper()

    patient = {
        "name": name,
        "email": email,
        "unique_code": unique_code
    }

    await db.patients.insert_one(patient)

    return {
        "message": "Patient created successfully",
        "unique_code": unique_code
    }