from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    description="Doctor appointment booking backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Accept", "Content-Type"],
    max_age=600,
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    """Add conservative browser hardening headers to every response."""

    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    response.headers.setdefault(
        "Permissions-Policy",
        "camera=(), geolocation=(), microphone=(self)",
    )
    return response


app.include_router(router)


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "storage": "JSON",
        "environment": settings.APP_ENV,
    }


@app.get("/")
def root():
    return {
        "message": "Welcome to the Voice Doctor Appointment Assistant",
    }
