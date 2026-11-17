from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from backend.app.db.database import get_db
from backend.app.db.schemas import SummarizeRequest, SummarizeResponse
from backend.app.services.summarizer import SummarizerService

router = APIRouter(prefix="/summarize", tags=["Summarization"])

@router.post("", response_model=SummarizeResponse)
async def generate_summary(
    request: SummarizeRequest,
    x_gemini_api_key: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Summarizes lecture notes into concise summary, key concepts, revision points, and flashcards.
    Supports Short vs Detailed mode, custom word count, audience level, and output toggles.
    """
    service = SummarizerService(db)
    try:
        response = await service.summarize(request, api_key=x_gemini_api_key)
        return response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@router.post("/stream")
async def stream_summary_endpoint(
    request: SummarizeRequest,
    x_gemini_api_key: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Streams summary tokens via Server-Sent Events (SSE).
    """
    service = SummarizerService(db)
    return StreamingResponse(
        service.stream_summary(request, api_key=x_gemini_api_key),
        media_type="text/event-stream"
    )
