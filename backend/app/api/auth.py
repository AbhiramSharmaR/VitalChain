from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt, JWTError

from app.db.mongodb import get_db
from app.core.deps import get_current_user
from app.config import settings
from typing import Optional
from bson import ObjectId

router = APIRouter(prefix="/auth", tags=["Auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ----------- MODELS -----------

class RegisterUser(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str
    phone_number: str
    flat_number: str
    apartment_name: str
    address: str
    # Required for family users so we can link them to a patient during registration.
    patient_email: Optional[EmailStr] = None
    patient_phone: Optional[str] = None


class LoginUser(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str


# ----------- REGISTER -----------

@router.post("/register")
async def register_user(payload: RegisterUser):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    existing = await db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_pw = pwd_context.hash(payload.password[:72])

    linked_patient_id = None
    if payload.role == "family":
        if not payload.patient_email and not payload.patient_phone:
            raise HTTPException(status_code=400, detail="Family member must provide patient email or phone")
            
        query = {}
        if payload.patient_email:
            query["email"] = payload.patient_email
        if payload.patient_phone:
            query["phone_number"] = payload.patient_phone
            
        patient = await db.users.find_one(query)
        if not patient or patient.get("role") != "patient":
            raise HTTPException(status_code=404, detail="Linked patient not found")
            
        linked_patient_id = str(patient["_id"])

    new_user = {
        "email": payload.email,
        "full_name": payload.full_name,
        "password": hashed_pw,
        "role": payload.role,
        "phone_number": payload.phone_number,
        "flat_number": payload.flat_number,
        "apartment_name": payload.apartment_name,
        "address": payload.address,
        "linked_patient_id": linked_patient_id,
        "family_members": [],
        "emergency_contacts": []
    }

    result = await db.users.insert_one(new_user)
    new_user["_id"] = str(result.inserted_id)
    new_user = {**new_user, "id": new_user["_id"]}
    del new_user["password"]
    
    if linked_patient_id:
        await db.users.update_one(
            {"_id": ObjectId(linked_patient_id)},
            {"$addToSet": {"family_members": payload.phone_number}}
        )

    # Create JWT token
    token_data = {
        # Canonical identity fields
        "user_id": new_user["id"],
        "role": new_user["role"],
        # Keep `sub` for backward compatibility with existing middleware.
        "sub": new_user["id"],
        "email": new_user["email"],
        "exp": datetime.utcnow() + timedelta(hours=24)
    }

    access_token = jwt.encode(token_data, settings.SECRET_KEY, algorithm="HS256")

    return {"access_token": access_token, "token_type": "bearer"}


# ----------- LOGIN -----------

@router.post("/login")
async def login_user(payload: LoginUser):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    user = await db.users.find_one({"email": payload.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not pwd_context.verify(payload.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid password")

    token_data = {
        "user_id": str(user["_id"]),
        "role": user.get("role"),
        "sub": str(user["_id"]),
        "email": user["email"],
        "exp": datetime.utcnow() + timedelta(hours=24)
    }

    access_token = jwt.encode(token_data, settings.SECRET_KEY, algorithm="HS256")

    return {"access_token": access_token, "token_type": "bearer"}


# ----------- GET CURRENT USER (auth/me) -----------

@router.get("/me", response_model=UserResponse)
async def get_current_user_route(current_user: dict = Depends(get_current_user)):
    """
    Returns currently authenticated user's data.
    """
    return current_user
