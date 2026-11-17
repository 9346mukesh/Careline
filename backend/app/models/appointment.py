from pydantic import BaseModel, Field
from typing import Optional


class AppointmentCreate(BaseModel):
    doctor_id: str
    slot_id: str
    patient_name: str = Field(min_length=2, max_length=100)
    patient_phone: str = Field(pattern=r"^\+?[0-9]{10,15}$")
    phone_confirmed: bool


class AppointmentCancel(BaseModel):
    patient_phone: str = Field(pattern=r"^\+?[0-9]{10,15}$")
    phone_confirmed: bool