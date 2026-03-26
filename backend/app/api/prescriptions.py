from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from datetime import datetime
from app.db.mongodb import get_db
from app.core.deps import get_current_user
from typing import Optional, List

from app.ai.medical_chatbot import analyze_prescription

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])


class PrescriptionCreate(BaseModel):
    patient_user_id: str
    diagnosis: str
    medicines: list[str]
    notes: str | None = None


class PrescriptionUpdate(BaseModel):
    diagnosis: str | None = None
    medicines: list[str] | None = None
    notes: str | None = None


class SnoreBotPrediction(BaseModel):
    label: str
    nli_score: float
    minilm_sim: float
    clin_sim: float
    combined_score: float


class AnalyzePrescriptionResponse(BaseModel):
    ocr_text: str
    symptom_text: str
    predictions: List[SnoreBotPrediction]
    top_label: Optional[str]
    confidence: float
    generated_advice: str


@router.post("/ai/prescription/analyze", response_model=AnalyzePrescriptionResponse)
async def analyze_prescription_image(file: UploadFile = File(...)):
    """
    Option B endpoint, implemented inside this existing module without changing app wiring.
    Upload a printed prescription/report image to OCR + categorize + generate safe advice.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")
    try:
        data = await file.read()
        return analyze_prescription(data)
    except Exception as e:
        # Keep error message user-friendly; dependency errors are raised by analyze_prescription.
        raise HTTPException(status_code=503, detail=str(e))


# -----------------------------------------------------------
# 1) Doctor creates prescription
# -----------------------------------------------------------
@router.post("/")
async def create_prescription(
    payload: PrescriptionCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()

    # Only doctors can write prescriptions
    doctor = await db.users.find_one({"email": current_user["email"]})
    if doctor.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can create prescriptions")

    # Check that patient exists
    patient = await db.users.find_one({"_id": payload.patient_user_id})
    if not patient or patient.get("role") != "patient":
        raise HTTPException(status_code=404, detail="Patient not found")

    doc = {
        "doctor_user_id": current_user["user_id"],
        "patient_user_id": payload.patient_user_id,
        "diagnosis": payload.diagnosis,
        "medicines": payload.medicines,
        "notes": payload.notes,
        "date": datetime.utcnow(),
    }

    await db.prescriptions.insert_one(doc)
    return {"message": "Prescription created successfully"}


# -----------------------------------------------------------
# 2) Patient OR Family can view prescriptions
# -----------------------------------------------------------
@router.get("/patient/{patient_user_id}")
async def get_prescriptions_for_patient(
    patient_user_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()

    # Patient trying to access MUST match patient_user_id
    if current_user["user_id"] == patient_user_id:
        pass  # allowed

    else:
        # Check if family is linked
        link = await db.family_links.find_one({
            "family_user_id": current_user["user_id"],
            "patient_user_id": patient_user_id
        })

        if not link:
            raise HTTPException(status_code=403, detail="Not authorized to view this patient's prescriptions")

    cursor = db.prescriptions.find({"patient_user_id": patient_user_id})
    data = await cursor.to_list(length=200)

    return {"prescriptions": data}


# -----------------------------------------------------------
# 3) Doctor updates prescription they created
# -----------------------------------------------------------
@router.put("/{prescription_id}")
async def update_prescription(
    prescription_id: str,
    payload: PrescriptionUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()

    prescription = await db.prescriptions.find_one({"_id": prescription_id})
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    # Doctor can only modify their own prescriptions
    if prescription["doctor_user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Cannot modify another doctor's prescription")

    update_data = {k: v for k, v in payload.dict().items() if v is not None}

    await db.prescriptions.update_one(
        {"_id": prescription_id},
        {"$set": update_data}
    )

    return {"message": "Prescription updated"}


# -----------------------------------------------------------
# 4) Doctor deletes prescription they created
# -----------------------------------------------------------
@router.delete("/{prescription_id}")
async def delete_prescription(
    prescription_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()

    prescription = await db.prescriptions.find_one({"_id": prescription_id})
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    if prescription["doctor_user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Cannot delete another doctor's prescription")

    await db.prescriptions.delete_one({"_id": prescription_id})
    return {"message": "Prescription deleted"}
