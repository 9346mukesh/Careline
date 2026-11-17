
from datetime import date
from fastapi import HTTPException

from app.models.appointment import (
    AppointmentCreate,
    AppointmentCancel,
)

from app.services import appointment_service
from app.services.json_storage import get_appointments


def check_doctor_availability(
    doctor_id: str | None = None,
    speciality: str | None = None,
    appointment_date: str | None = None,
):
    """
    Check available doctors and appointment slots.

    Search can be performed using doctor ID, speciality,
    and appointment date.
    """

    if appointment_date:
        try:
            date.fromisoformat(appointment_date)
        except ValueError:
            return {
                "success": False,
                "message": "Invalid date format. Use YYYY-MM-DD."
            }

    try:
        results = appointment_service.check_availability(
            doctor_id=doctor_id,
            speciality=speciality,
            date=appointment_date,
        )

        if not results:
            return {
                "success": True,
                "message": "No available appointments found.",
                "doctors": [],
            }

        return {
            "success": True,
            "message": "Available appointments retrieved.",
            "doctors": results,
        }

    except HTTPException as exc:
        return {
            "success": False,
            "message": exc.detail,
        }


def book_appointment(
    doctor_id: str,
    slot_id: str,
    patient_name: str,
    patient_phone: str,
    phone_confirmed: bool,
):
    """
    Book an appointment after confirming the patient's
    spoken phone number.
    """

    if not phone_confirmed:
        return {
            "success": False,
            "message": "Phone number confirmation is required."
        }

    try:
        request = AppointmentCreate(
            doctor_id=doctor_id,
            slot_id=slot_id,
            patient_name=patient_name,
            patient_phone=patient_phone,
            phone_confirmed=phone_confirmed,
        )

        appointment = appointment_service.book_appointment(request)

        return {
            "success": True,
            "message": "Appointment successfully booked.",
            "appointment": appointment,
        }

    except HTTPException as exc:
        return {
            "success": False,
            "message": exc.detail,
        }

    except Exception as exc:
        return {
            "success": False,
            "message": str(exc),
        }


def cancel_appointment(
    patient_phone: str,
    phone_confirmed: bool,
):
    """
    Find the patient's active appointment using their
    confirmed phone number and cancel it.
    """

    if not phone_confirmed:
        return {
            "success": False,
            "message": "Phone number confirmation is required."
        }

    appointments = get_appointments()["appointments"]

    matching_appointments = [
        appointment
        for appointment in appointments
        if (
            appointment["patient_phone"] == patient_phone
            and appointment["status"] == "booked"
        )
    ]

    if not matching_appointments:
        return {
            "success": False,
            "message": "No active appointment found for this phone number."
        }

    if len(matching_appointments) > 1:
        return {
            "success": False,
            "message": (
                "Multiple active appointments found. "
                "Ask the patient which appointment they want to cancel."
            ),
            "appointments": matching_appointments,
        }

    appointment = matching_appointments[0]

    try:
        request = AppointmentCancel(
            patient_phone=patient_phone,
            phone_confirmed=phone_confirmed,
        )

        cancelled = appointment_service.cancel_appointment(
            appointment["appointment_id"],
            request,
        )

        return {
            "success": True,
            "message": "Appointment successfully cancelled.",
            "appointment": cancelled,
        }

    except HTTPException as exc:
        return {
            "success": False,
            "message": exc.detail,
        }
