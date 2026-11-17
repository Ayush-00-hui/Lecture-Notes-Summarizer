import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel

from backend.app.db.database import get_db
from backend.app.db.models import Document, SummaryResult, ComparisonRun
from backend.app.db.schemas import DocumentListItem

router = APIRouter(prefix="/history", tags=["History & Library"])

class RenameRequest(BaseModel):
    title: str

@router.get("", response_model=List[DocumentListItem])
async def list_documents(
    search: Optional[str] = Query(None, description="Search query by title or filename"),
    db: AsyncSession = Depends(get_db)
):
    """Lists saved documents sorted by pinned status and last updated."""
    query = select(Document).order_by(desc(Document.is_pinned), desc(Document.updated_at))
    result = await db.execute(query)
    docs = result.scalars().all()

    if search:
        s_lower = search.lower()
        docs = [d for d in docs if s_lower in d.title.lower() or s_lower in d.filename.lower()]

    return [
        DocumentListItem(
            id=d.id,
            title=d.title,
            filename=d.filename,
            file_type=d.file_type,
            file_size=d.file_size,
            page_count=d.page_count,
            word_count=d.word_count,
            is_pinned=d.is_pinned,
            created_at=d.created_at,
            updated_at=d.updated_at
        )
        for d in docs
    ]

@router.get("/{doc_id}")
async def get_document_details(
    doc_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Retrieves full document, its extracted pages, and its history of summaries and comparisons."""
    doc = await db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Fetch associated summaries
    sum_query = select(SummaryResult).where(SummaryResult.document_id == doc_id).order_by(desc(SummaryResult.created_at))
    sum_res = await db.execute(sum_query)
    summaries = sum_res.scalars().all()

    # Fetch associated comparisons
    comp_query = select(ComparisonRun).where(ComparisonRun.document_id == doc_id).order_by(desc(ComparisonRun.created_at))
    comp_res = await db.execute(comp_query)
    comparisons = comp_res.scalars().all()

    pages = []
    try:
        pages = json.loads(doc.pages_data)
    except Exception:
        pass

    return {
        "id": doc.id,
        "title": doc.title,
        "filename": doc.filename,
        "file_type": doc.file_type,
        "file_size": doc.file_size,
        "page_count": doc.page_count,
        "word_count": doc.word_count,
        "est_reading_time_minutes": doc.est_reading_time_minutes,
        "is_pinned": doc.is_pinned,
        "pages": pages,
        "full_text": doc.full_text,
        "created_at": doc.created_at,
        "updated_at": doc.updated_at,
        "summaries_count": len(summaries),
        "comparisons_count": len(comparisons),
        "latest_summary": summaries[0] if summaries else None,
        "latest_comparison": comparisons[0] if comparisons else None
    }

@router.post("/{doc_id}/pin")
async def toggle_pin(
    doc_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Toggles the pinned status of a document."""
    doc = await db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    doc.is_pinned = not doc.is_pinned
    await db.commit()
    await db.refresh(doc)
    return {"status": "success", "is_pinned": doc.is_pinned}

@router.patch("/{doc_id}/rename")
async def rename_document(
    doc_id: str,
    payload: RenameRequest,
    db: AsyncSession = Depends(get_db)
):
    """Renames a document title."""
    clean_title = payload.title.strip()
    if not clean_title:
        raise HTTPException(status_code=400, detail="Title cannot be empty.")

    doc = await db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    doc.title = clean_title
    await db.commit()
    await db.refresh(doc)
    return {"status": "success", "title": doc.title}

@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Permanently deletes a document and all related summaries and comparisons."""
    doc = await db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    await db.delete(doc)
    await db.commit()
    return {"status": "success", "message": f"Document '{doc.title}' deleted."}
