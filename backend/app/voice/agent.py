
from pipecat.services.groq.llm import GroqLLMService
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.services.llm_service import FunctionCallParams

from app.core.config import settings
from app.voice.prompts import SYSTEM_PROMPT
from app.voice.tools import (
    check_doctor_availability as check_availability_tool,
    book_appointment as book_appointment_tool,
    cancel_appointment as cancel_appointment_tool,
)


# --------------------------------------------------
# Tool 1: Check doctor availability
# --------------------------------------------------

async def check_doctor_availability(
    params: FunctionCallParams,
    doctor_id: str = "",
    speciality: str = "",
    appointment_date: str = "",
):
    """Find doctors and available appointment slots.

    Args:
        doctor_id: Optional doctor ID, such as DOC001.
        speciality: Optional speciality, such as Cardiology.
        appointment_date: Optional date in YYYY-MM-DD format.
    """
    result = check_availability_tool(
        doctor_id=doctor_id or None,
        speciality=speciality or None,
        appointment_date=appointment_date or None,
    )

    await params.result_callback(result)


# --------------------------------------------------
# Tool 2: Book appointment
# --------------------------------------------------

async def book_appointment(
    params: FunctionCallParams,
    doctor_id: str,
    slot_id: str,
    patient_name: str,
    patient_phone: str,
    phone_confirmed: bool,
):
    """Book a doctor appointment after phone confirmation.

    Args:
        doctor_id: ID of the selected doctor.
        slot_id: ID of the selected available slot.
        patient_name: Full name of the patient.
        patient_phone: Patient's spoken phone number.
        phone_confirmed: True only after explicit patient confirmation.
    """
    result = book_appointment_tool(
        doctor_id=doctor_id,
        slot_id=slot_id,
        patient_name=patient_name,
        patient_phone=patient_phone,
        phone_confirmed=phone_confirmed,
    )

    await params.result_callback(result)


# --------------------------------------------------
# Tool 3: Cancel appointment
# --------------------------------------------------

async def cancel_appointment(
    params: FunctionCallParams,
    patient_phone: str,
    phone_confirmed: bool,
):
    """Cancel the patient's active appointment.

    Args:
        patient_phone: Patient's confirmed spoken phone number.
        phone_confirmed: True only after explicit patient confirmation.
    """
    result = cancel_appointment_tool(
        patient_phone=patient_phone,
        phone_confirmed=phone_confirmed,
    )

    await params.result_callback(result)


# --------------------------------------------------
# Groq LLM initialization
# --------------------------------------------------


def create_groq_llm() -> GroqLLMService:

    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is missing")

    if not settings.GROQ_MODEL:
        raise ValueError("GROQ_MODEL is missing")

    return GroqLLMService(
        api_key=settings.GROQ_API_KEY,
        settings=GroqLLMService.Settings(
            model=settings.GROQ_MODEL
        ),
    )

# --------------------------------------------------
# LLM conversation context
# --------------------------------------------------

def create_llm_context() -> LLMContext:

    return LLMContext(
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            }
        ],
        tools=[
            check_doctor_availability,
            book_appointment,
            cancel_appointment,
        ],
    )
