
import asyncio
import logging

import numpy as np

from pipecat.frames.frames import OutputAudioRawFrame, TTSSpeakFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.task import PipelineTask
from pipecat.pipeline.runner import PipelineRunner
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

from pipecat.audio.vad.silero import SileroVADAnalyzer

from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.processors.frameworks.rtvi import (
    RTVIFunctionCallReportLevel,
    RTVIObserverParams,
)

from pipecat.services.elevenlabs.stt import ElevenLabsRealtimeSTTService
from pipecat.services.elevenlabs.tts import ElevenLabsTTSService

from pipecat.transports.smallwebrtc.transport import SmallWebRTCTransport
from pipecat.transports.base_transport import TransportParams

from app.core.config import settings
from app.voice.agent import create_groq_llm, create_llm_context

logger = logging.getLogger(__name__)

# Keep references to active voice sessions.
active_sessions = {}

GREETING = (
    "Thanks for calling Careline. I can help you find a doctor, "
    "check available times, book an appointment, or cancel one. "
    "How can I help you today?"
)


class AudioTap(FrameProcessor):
    """Temporary diagnostic: log output audio energy."""

    def __init__(self):
        super().__init__()
        self._count = 0
        self._loud = 0

    async def process_frame(self, frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        if isinstance(frame, OutputAudioRawFrame):
            samples = np.frombuffer(frame.audio, dtype=np.int16)
            rms = float(np.sqrt(np.mean(samples.astype(np.float64) ** 2))) if samples.size else 0.0
            self._count += 1
            if rms > 1:
                self._loud += 1

            if self._count <= 5 or self._count % 50 == 0:
                logger.info(
                    "AUDIOTAP frame=%d bytes=%d rms=%.1f total=%d loud=%d rate=%s",
                    self._count,
                    len(frame.audio),
                    rms,
                    self._count,
                    self._loud,
                    getattr(frame, "sample_rate", None),
                )

        await self.push_frame(frame, direction)


async def run_voice_pipeline(webrtc_connection):
    """Create and run one AI voice session."""

    if not settings.ELEVENLABS_API_KEY:
        raise ValueError("ELEVENLABS_API_KEY is missing")

    if not settings.ELEVENLABS_VOICE_ID:
        raise ValueError("ELEVENLABS_VOICE_ID is missing")

    transport = SmallWebRTCTransport(
        webrtc_connection=webrtc_connection,
        params=TransportParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            # Wait for the RTVI client-ready handshake before accepting
            # microphone audio. This avoids the agent hearing setup noise.
            audio_in_stream_on_start=False,
        ),
    )

    stt = ElevenLabsRealtimeSTTService(
        api_key=settings.ELEVENLABS_API_KEY,
        model=settings.ELEVENLABS_STT_MODEL,
    )

    llm = create_groq_llm()

    tts = ElevenLabsTTSService(
        api_key=settings.ELEVENLABS_API_KEY,
        voice_id=settings.ELEVENLABS_VOICE_ID,
        model=settings.ELEVENLABS_TTS_MODEL,
    )

    context = create_llm_context()
    # VAD drives speech start/stop. ElevenLabs realtime STT commits its final
    # transcript on VADUserStoppedSpeakingFrame, so without an analyzer the
    # agent receives audio but never a committed transcript to answer.
    context_aggregator = LLMContextAggregatorPair(
        context,
        user_params=LLMUserAggregatorParams(
            vad_analyzer=SileroVADAnalyzer(),
        ),
    )

    pipeline = Pipeline([
        transport.input(),
        stt,
        context_aggregator.user(),
        llm,
        tts,
        AudioTap(),
        transport.output(),
        context_aggregator.assistant(),
    ])

    task = PipelineTask(
        pipeline,
        rtvi_observer_params=RTVIObserverParams(
            # Share tool names with the dashboard, never tool arguments or results.
            function_call_report_level={
                "*": RTVIFunctionCallReportLevel.NAME,
            },
        ),
    )

    runner = PipelineRunner()

    pc_id = webrtc_connection.pc_id
    greeted = False

    @task.rtvi.event_handler("on_client_ready")
    async def on_client_ready(rtvi):
        """Speak the opening line once the browser is ready to play audio."""
        nonlocal greeted

        logger.info("Voice client ready: %s", pc_id)

        if greeted:
            return

        greeted = True
        await task.queue_frame(TTSSpeakFrame(GREETING))

    active_sessions[pc_id] = {
        "task": task,
        "runner": runner,
    }

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info("Voice client disconnected: %s", pc_id)
        await task.cancel()

    try:
        logger.info("Starting voice pipeline: %s", pc_id)
        await runner.run(task)
    except Exception:
        logger.exception("Voice pipeline failed: %s", pc_id)
        raise
    finally:
        active_sessions.pop(pc_id, None)
        logger.info("Voice pipeline stopped: %s", pc_id)
