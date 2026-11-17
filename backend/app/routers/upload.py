import json
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from backend.app.db.database import get_db
from backend.app.db.models import Document
from backend.app.db.schemas import DocumentPreview, PageChunk, DocumentUpdateText
from backend.app.parsers.factory import ParserFactory
from backend.app.parsers.text_parser import TextParser

router = APIRouter(prefix="/upload", tags=["Upload & Ingestion"])

@router.post("", response_model=DocumentPreview)
async def upload_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload and parse lecture document (PDF, PPTX, DOCX, TXT, MD).
    Validates file size (max 20 MB) and extracts per-page/slide text chunks.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file has no filename.")

    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    try:
        parsed = ParserFactory.parse_file(content, file.filename)
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected parsing error: {str(e)}")

    # Store document record in SQLite
    doc_record = Document(
        title=parsed.title,
        filename=parsed.filename,
        file_type=parsed.file_type,
        file_size=parsed.file_size,
        page_count=parsed.page_count,
        word_count=parsed.word_count,
        est_reading_time_minutes=parsed.est_reading_time_minutes,
        full_text=parsed.full_text,
        pages_data=json.dumps([p.model_dump() for p in parsed.pages])
    )
    db.add(doc_record)
    await db.commit()
    await db.refresh(doc_record)

    return DocumentPreview(
        id=doc_record.id,
        title=doc_record.title,
        filename=doc_record.filename,
        file_type=doc_record.file_type,
        file_size=doc_record.file_size,
        page_count=doc_record.page_count,
        word_count=doc_record.word_count,
        est_reading_time_minutes=doc_record.est_reading_time_minutes,
        pages=parsed.pages,
        warnings=parsed.warnings
    )

class PasteRequest(BaseModel):
    title: Optional[str] = "Pasted Lecture Notes"
    text: str

@router.post("/paste", response_model=DocumentPreview)
async def paste_text(
    payload: PasteRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Ingest raw pasted lecture notes with live statistics calculation and chunking.
    """
    clean_text = payload.text.strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="Pasted text cannot be empty.")

    try:
        parser = TextParser()
        parsed = parser.parse_text_string(clean_text, f"{payload.title}.txt")
        if payload.title and payload.title != "Pasted Lecture Notes":
            parsed.title = payload.title
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))

    doc_record = Document(
        title=parsed.title,
        filename=parsed.filename,
        file_type="text/plain",
        file_size=parsed.file_size,
        page_count=parsed.page_count,
        word_count=parsed.word_count,
        est_reading_time_minutes=parsed.est_reading_time_minutes,
        full_text=parsed.full_text,
        pages_data=json.dumps([p.model_dump() for p in parsed.pages])
    )
    db.add(doc_record)
    await db.commit()
    await db.refresh(doc_record)

    return DocumentPreview(
        id=doc_record.id,
        title=doc_record.title,
        filename=doc_record.filename,
        file_type=doc_record.file_type,
        file_size=doc_record.file_size,
        page_count=doc_record.page_count,
        word_count=doc_record.word_count,
        est_reading_time_minutes=doc_record.est_reading_time_minutes,
        pages=parsed.pages,
        warnings=parsed.warnings
    )

@router.put("/{doc_id}/text", response_model=DocumentPreview)
async def update_document_text(
    doc_id: str,
    update: DocumentUpdateText,
    db: AsyncSession = Depends(get_db)
):
    """
    Allows user to edit extracted document text in the Document Preview panel before summarizing.
    """
    db_doc = await db.get(Document, doc_id)
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    words = update.full_text.split()
    word_count = len(words)
    est_reading_time = round(word_count / 200.0, 1) if word_count > 0 else 0.0

    db_doc.full_text = update.full_text
    db_doc.word_count = word_count
    db_doc.est_reading_time_minutes = est_reading_time

    if update.pages:
        db_doc.pages_data = json.dumps([p.model_dump() for p in update.pages])
        db_doc.page_count = len(update.pages)
    else:
        # Reparse or update single chunk
        parser = TextParser()
        reparsed = parser.parse_text_string(update.full_text, db_doc.filename)
        db_doc.pages_data = json.dumps([p.model_dump() for p in reparsed.pages])
        db_doc.page_count = reparsed.page_count

    await db.commit()
    await db.refresh(db_doc)

    pages_out = []
    try:
        pages_out = [PageChunk.model_validate(p) for p in json.loads(db_doc.pages_data)]
    except Exception:
        pages_out = [PageChunk(page_number=1, title="Edited Notes", text=db_doc.full_text)]

    return DocumentPreview(
        id=db_doc.id,
        title=db_doc.title,
        filename=db_doc.filename,
        file_type=db_doc.file_type,
        file_size=db_doc.file_size,
        page_count=db_doc.page_count,
        word_count=db_doc.word_count,
        est_reading_time_minutes=db_doc.est_reading_time_minutes,
        pages=pages_out,
        warnings=[]
    )
