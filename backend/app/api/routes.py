from fastapi import APIRouter, HTTPException, Query

import asyncio

from pipecat.transports.smallwebrtc.request_handler import (
    SmallWebRTCRequest,
    SmallWebRTCPatchRequest,
    SmallWebRTCRequestHandler,
)

from app.core.config import settings
from app.voice.pipeline import run_voice_pipeline
from app.models.appointment import (
    AppointmentCreate,
    AppointmentCancel,
)

from app.services import appointment_service as service
from app.services.json_storage import get_appointments



router = APIRouter(prefix="/api", tags=["Doctor Appointments"])


@router.get("/doctors")
def doctors():
    return service.list_doctors()


@router.get("/doctors/{doctor_id}")
def doctor_details(doctor_id: str):
    return service.get_doctor(doctor_id)


@router.get("/availability")
def availability(
    doctor_id: str | None = None,
    date: str | None = None,
    speciality: str | None = None,
):
    return service.check_availability(
        doctor_id=doctor_id,
        date=date,
        speciality=speciality,
    )


@router.post("/appointments", status_code=201)
def create_appointment(data: AppointmentCreate):
    return service.book_appointment(data)


@router.get("/appointments")
def appointments(
    phone: str | None = Query(default=None),
    status: str | None = Query(default=None),
):
    records = get_appointments()["appointments"]

    if phone:
        records = [
            a for a in records
            if a["patient_phone"] == phone
        ]

    if status:
        records = [
            a for a in records
            if a["status"] == status
        ]

    return records


@router.post("/appointments/{appointment_id}/cancel")
def cancel_appointment(
    appointment_id: str,
    data: AppointmentCancel,
):
    return service.cancel_appointment(appointment_id, data)

webrtc_handler = SmallWebRTCRequestHandler()

voice_background_tasks = set()



# --------------------------------------------------
# WebRTC Voice Assistant
# --------------------------------------------------

@router.get("/voice/status")
def voice_status():
    """Report voice feature readiness without exposing credentials."""

    readiness = settings.voice_readiness()
    ready = all(readiness.values())

    return {
        "ready": ready,
        "providers": readiness,
        "transport": "small-webrtc",
    }


@router.post("/voice/offer")
async def voice_offer(request: SmallWebRTCRequest):
    """Accept browser SDP offer and create a voice session."""

    readiness = settings.voice_readiness()

    if not all(readiness.values()):
        raise HTTPException(
            status_code=503,
            detail=(
                "The voice assistant is not configured. "
                "Add the LLM and speech provider credentials on the server."
            ),
        )

    async def on_connection_created(connection):
        task = asyncio.create_task(
            run_voice_pipeline(connection)
        )

        voice_background_tasks.add(task)
        task.add_done_callback(voice_background_tasks.discard)

    answer = await webrtc_handler.handle_web_request(
        request,
        on_connection_created,
    )

    return answer


@router.patch("/voice/offer")
async def voice_ice_candidates(request: SmallWebRTCPatchRequest):
    """Receive ICE candidates from the browser."""

    await webrtc_handler.handle_patch_request(request)

    return {"status": "ICE candidates received"}