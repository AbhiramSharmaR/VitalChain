from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class Patient(BaseModel):
    name: str
    email: EmailStr
    unique_code: str


class FamilyMember(BaseModel):
    name: str
    email: EmailStr


class AccessRequest(BaseModel):
    patient_code: str
    family_email: EmailStr
    status: str = "Pending"
    created_at: datetime = datetime.utcnow()