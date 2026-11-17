
from app.voice.tools import (
    check_doctor_availability,
    book_appointment,
    cancel_appointment,
)


print("\n--- TEST 1: CHECK AVAILABILITY ---")

availability = check_doctor_availability(
    doctor_id="DOC001",
    appointment_date="2026-11-18",
)

print(availability)


print("\n--- TEST 2: BOOK APPOINTMENT ---")

booking = book_appointment(
    doctor_id="DOC001",
    slot_id="SLOT001",
    patient_name="Mukesh",
    patient_phone="9876543210",
    phone_confirmed=True,
)

print(booking)


print("\n--- TEST 3: CANCEL APPOINTMENT ---")

cancellation = cancel_appointment(
    patient_phone="9876543210",
    phone_confirmed=True,
)

print(cancellation)


print("\n--- TEST 4: CHECK AVAILABILITY AGAIN ---")

availability_after = check_doctor_availability(
    doctor_id="DOC001",
    appointment_date="2026-11-18",
)

print(availability_after)
