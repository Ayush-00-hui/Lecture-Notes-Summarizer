import json
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from backend.app.db.database import get_db
from backend.app.db.models import ComparisonRun
from backend.app.db.schemas import CompareRequest, CompareResponse, UserVoteRequest
from backend.app.services.comparator import ComparatorService

router = APIRouter(prefix="/compare", tags=["Prompt Comparison Lab"])

@router.post("", response_model=CompareResponse)
async def run_comparison(
    request: CompareRequest,
    x_gemini_api_key: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Executes Prompt Design A (Direct) and Prompt Design B (Structured) in parallel on the same input.
    Computes objective NLP metrics, word-level diffs, summary verdict, and optional LLM-as-judge scores.
    """
    service = ComparatorService(db)
    try:
        response = await service.compare(request, api_key=x_gemini_api_key)
        return response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")

@router.post("/vote")
async def record_user_vote(
    vote: UserVoteRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Persists user's human rating / preference vote between Prompt A and Prompt B.
    """
    run = await db.get(ComparisonRun, vote.comparison_id)
    if not run:
        raise HTTPException(status_code=404, detail="Comparison run not found.")

    votes_dict = {
        "better_coverage": vote.better_coverage,
        "better_conciseness": vote.better_conciseness,
        "better_clarity": vote.better_clarity,
        "overall_winner": vote.overall_winner,
        "feedback_notes": vote.feedback_notes
    }
    run.user_votes = json.dumps(votes_dict)
    await db.commit()
    await db.refresh(run)

    return {"status": "success", "message": "Vote recorded successfully", "votes": votes_dict}
