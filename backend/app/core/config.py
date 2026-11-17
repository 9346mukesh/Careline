import os
from pathlib import Path

import certifi
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]

load_dotenv(BASE_DIR / ".env")

# python.org macOS builds do not configure a default CA bundle, so websocket
# clients (ElevenLabs STT/TTS) fail TLS verification. certifi ships with the
# app; use it unless the deployment already sets its own bundle.
os.environ.setdefault("SSL_CERT_FILE", certifi.where())


def _csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings:
    APP_NAME = os.getenv("APP_NAME", "Voice Doctor Assistant")
    APP_ENV = os.getenv("APP_ENV", "development")

    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GROQ_MODEL = os.getenv(
        "GROQ_MODEL",
        "llama-3.3-70b-versatile"
    )

    ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
    ELEVENLABS_TTS_MODEL = os.getenv(
        "ELEVENLABS_TTS_MODEL",
        "eleven_flash_v2_5"
    )
    ELEVENLABS_STT_MODEL = os.getenv(
        "ELEVENLABS_STT_MODEL",
        "scribe_v2_realtime"
    )
    ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")

    CORS_ORIGINS = _csv(
        os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        )
    )

    @classmethod
    def voice_readiness(cls) -> dict:
        """Report whether the voice pipeline has the credentials it needs."""

        return {
            "llm": bool(cls.GROQ_API_KEY and cls.GROQ_MODEL),
            "speech": bool(
                cls.ELEVENLABS_API_KEY
                and cls.ELEVENLABS_VOICE_ID
                and cls.ELEVENLABS_STT_MODEL
                and cls.ELEVENLABS_TTS_MODEL
            ),
        }


settings = Settings()
