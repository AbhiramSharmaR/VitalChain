from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from bson import ObjectId
from app.db.mongodb import get_db
from app.core.deps import get_current_user

router = APIRouter(prefix="/family", tags=["Family"])


class FamilyLinkCreate(BaseModel):
    patient_email: EmailStr
    relation: str  # e.g. "father", "mother", "spouse", "son", "daughter"


@router.post("/link")
async def create_family_link(
    payload: FamilyLinkCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Link a logged-in family member to a patient by patient email.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    # Current user must have role = "family"
    family_user = await db.users.find_one({"email": current_user["email"]})
    if not family_user or family_user.get("role") != "family":
        raise HTTPException(status_code=403, detail="Only family members can create links")

    # Find the patient user
    patient_user = await db.users.find_one({"email": payload.patient_email})
    if not patient_user or patient_user.get("role") != "patient":
        raise HTTPException(status_code=404, detail="Patient user not found")

    family_id = current_user["user_id"]
    patient_id = str(patient_user["_id"])

    # Check if link already exists
    existing = await db.family_links.find_one(
        {"family_user_id": family_id, "patient_user_id": patient_id}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Link already exists")

    doc = {
        "family_user_id": family_id,
        "patient_user_id": patient_id,
        "relation": payload.relation,
    }

    await db.family_links.insert_one(doc)

    # Keep the denormalized field in sync for SOS escalation lookups.
    # linked_patient_id is a stringified ObjectId.
    await db.users.update_one(
        {"_id": ObjectId(family_id)},
        {"$set": {"linked_patient_id": patient_id}},
    )
    return {"message": "Family link created successfully"}


@router.get("/my-patients")
async def get_my_linked_patients(
    current_user: dict = Depends(get_current_user)
):
    """
    List all patients linked to the logged-in family member.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    family_user = await db.users.find_one({"email": current_user["email"]})
    if not family_user or family_user.get("role") != "family":
        raise HTTPException(status_code=403, detail="Only family members can view this")

    family_id = current_user["user_id"]

    links_cursor = db.family_links.find({"family_user_id": family_id})
    links = await links_cursor.to_list(length=100)

    patients = []
    for link in links:
        # family_links stores `patient_user_id` as a stringified ObjectId.
        patient_user_id = link["patient_user_id"]
        patient_user = await db.users.find_one(
            {"_id": ObjectId(patient_user_id)} if len(str(patient_user_id)) == 24 else {"_id": patient_user_id}
        )
        if not patient_user:
            continue

        patients.append(
            {
                "patient_user_id": link["patient_user_id"],
                "email": patient_user["email"],
                "full_name": patient_user.get("full_name"),
                "relation": link["relation"],
            }
        )

    return {"linked_patients": patients}


@router.delete("/link/{patient_user_id}")
async def delete_family_link(
    patient_user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Remove a family ↔ patient link.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    family_user = await db.users.find_one({"email": current_user["email"]})
    if not family_user or family_user.get("role") != "family":
        raise HTTPException(status_code=403, detail="Only family members can delete links")

    family_id = current_user["user_id"]

    result = await db.family_links.delete_one(
        {"family_user_id": family_id, "patient_user_id": patient_user_id}
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Link not found")

    return {"message": "Family link deleted successfully"}
