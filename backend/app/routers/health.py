import time
from fastapi import APIRouter
from backend.app.core.config import settings

router = APIRouter(prefix="/health", tags=["Health & Status"])

START_TIME = time.time()

@router.get("")
async def health_check():
    """System health check and readiness probe."""
    uptime_sec = round(time.time() - START_TIME, 1)
    has_api_key = bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 5)
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "uptime_seconds": uptime_sec,
        "llm_mode": "gemini-api" if has_api_key else "offline-extractive"
    }
