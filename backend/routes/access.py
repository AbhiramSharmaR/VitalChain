from fastapi import APIRouter, HTTPException
from database import db
from datetime import datetime

router = APIRouter()

@router.post("/request-access")
async def request_access(patient_code: str, family_email: str):

    patient = await db.patients.find_one({"unique_code": patient_code})

    if not patient:
        raise HTTPException(status_code=404, detail="Invalid patient code")

    existing = await db.access_requests.find_one({
        "patient_code": patient_code,
        "family_email": family_email
    })

    if existing:
        return {"message": "Already requested"}

    request_data = {
        "patient_code": patient_code,
        "family_email": family_email,
        "status": "Pending",
        "created_at": datetime.utcnow()
    }

    await db.access_requests.insert_one(request_data)

    return {"message": "Access request sent"}

@router.put("/approve-access")
async def approve_access(patient_code: str, family_email: str):

    result = await db.access_requests.update_one(
        {
            "patient_code": patient_code,
            "family_email": family_email
        },
        {"$set": {"status": "Approved"}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")

    return {"message": "Access approved"}

@router.get("/view-patient")
async def view_patient(patient_code: str, family_email: str):

    access = await db.access_requests.find_one({
        "patient_code": patient_code,
        "family_email": family_email,
        "status": "Approved"
    })

    if not access:
        raise HTTPException(status_code=403, detail="Access denied")

    patient = await db.patients.find_one({"unique_code": patient_code})

    return patient