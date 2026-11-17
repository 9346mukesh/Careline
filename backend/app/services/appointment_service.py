from uuid import uuid4

from fastapi import HTTPException

from app.services.json_storage import (
    get_doctors,
    get_appointments,
    save_appointments,
)


def list_doctors():
    return get_doctors()["doctors"]


def get_doctor(doctor_id: str):
    doctors = get_doctors()["doctors"]

    for doctor in doctors:
        if doctor["doctor_id"] == doctor_id:
            return doctor

    raise HTTPException(status_code=404, detail="Doctor not found")


def check_availability(
    doctor_id: str | None = None,
    date: str | None = None,
    speciality: str | None = None,
):
    doctors = get_doctors()["doctors"]
    appointments = get_appointments()["appointments"]

    active_bookings = {
        (a["doctor_id"], a["slot_id"])
        for a in appointments
        if a["status"] == "booked"
    }

    results = []

    for doctor in doctors:

        if doctor_id and doctor["doctor_id"] != doctor_id:
            continue

        if speciality and speciality.lower() not in doctor["speciality"].lower():
            continue

        available_slots = []

        for slot in doctor["available_slots"]:

            if date and slot["date"] != date:
                continue

            key = (doctor["doctor_id"], slot["slot_id"])

            if key not in active_bookings:
                available_slots.append(slot)

        if available_slots:
            results.append({
                "doctor_id": doctor["doctor_id"],
                "doctor_name": doctor["name"],
                "speciality": doctor["speciality"],
                "available_slots": available_slots,
            })

    return results


def book_appointment(data):
    if not data.phone_confirmed:
        raise HTTPException(
            status_code=400,
            detail="Phone number confirmation is required"
        )

    doctor = get_doctor(data.doctor_id)

    slot = next(
        (
            s for s in doctor["available_slots"]
            if s["slot_id"] == data.slot_id
        ),
        None
    )

    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    appointments_data = get_appointments()
    appointments = appointments_data["appointments"]

    for appointment in appointments:
        if (
            appointment["doctor_id"] == data.doctor_id
            and appointment["slot_id"] == data.slot_id
            and appointment["status"] == "booked"
        ):
            raise HTTPException(
                status_code=409,
                detail="This slot is already booked"
            )

    new_appointment = {
        "appointment_id": f"APT-{uuid4().hex[:8].upper()}",
        "doctor_id": data.doctor_id,
        "slot_id": data.slot_id,
        "patient_name": data.patient_name,
        "patient_phone": data.patient_phone,
        "appointment_date": slot["date"],
        "appointment_time": slot["time"],
        "status": "booked",
    }

    appointments.append(new_appointment)

    save_appointments(appointments_data)

    return new_appointment


def cancel_appointment(appointment_id: str, data):
    if not data.phone_confirmed:
        raise HTTPException(
            status_code=400,
            detail="Phone number confirmation is required"
        )

    appointments_data = get_appointments()
    appointments = appointments_data["appointments"]

    for appointment in appointments:

        if appointment["appointment_id"] == appointment_id:

            if appointment["patient_phone"] != data.patient_phone:
                raise HTTPException(
                    status_code=403,
                    detail="Phone number does not match"
                )

            if appointment["status"] != "booked":
                raise HTTPException(
                    status_code=409,
                    detail="Appointment is not active"
                )

            appointment["status"] = "cancelled"

            save_appointments(appointments_data)

            return appointment

    raise HTTPException(
        status_code=404,
        detail="Appointment not found"
    )