from typing import Literal, Dict, Any
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from backend.app.db.schemas import StudyPackageOutput, CompareResponse
from backend.app.services.exporter import ExporterService

router = APIRouter(prefix="/export", tags=["Export Services"])

class ExportPayload(BaseModel):
    title: str = "NoteNest Study Package"
    type: Literal["study_package", "comparison_report"]
    data: Dict[str, Any]

@router.post("/{format}")
async def export_document(
    format: Literal["markdown", "docx", "pdf", "json", "txt"],
    payload: ExportPayload
):
    """
    Exports study notes or comparison benchmark reports into Markdown, DOCX, PDF, TXT, or JSON.
    """
    try:
        if payload.type == "study_package":
            model_data = StudyPackageOutput.model_validate(payload.data)
        else:
            model_data = CompareResponse.model_validate(payload.data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid payload data structure: {str(e)}")

    safe_title = "".join(c for c in payload.title if c.isalnum() or c in (' ', '_', '-')).strip()
    safe_title = safe_title.replace(" ", "_") or "notenest_summary"

    if format == "markdown":
        md_content = ExporterService.to_markdown(model_data, title=payload.title)
        return Response(
            content=md_content,
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="{safe_title}.md"'}
        )

    elif format == "txt":
        txt_content = ExporterService.to_txt(model_data, title=payload.title)
        return Response(
            content=txt_content,
            media_type="text/plain; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{safe_title}.txt"'}
        )

    elif format == "docx":
        docx_bytes = ExporterService.to_docx(model_data, title=payload.title)
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{safe_title}.docx"'}
        )

    elif format == "pdf":
        pdf_bytes = ExporterService.to_pdf(model_data, title=payload.title)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{safe_title}.pdf"'}
        )

    elif format == "json":
        json_content = ExporterService.to_json(model_data)
        return Response(
            content=json_content,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{safe_title}.json"'}
        )

    raise HTTPException(status_code=400, detail=f"Unsupported export format '{format}'.")
