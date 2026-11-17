import io
from typing import List
from pptx import Presentation

from backend.app.parsers.base import BaseParser, ParsedResult
from backend.app.db.schemas import PageChunk

class PPTXParser(BaseParser):
    def parse(self, content: bytes, filename: str) -> ParsedResult:
        if not content:
            raise ValueError("The uploaded PowerPoint file is empty (0 bytes).")
            
        file_size = len(content)
        file_stream = io.BytesIO(content)
        
        try:
            prs = Presentation(file_stream)
        except Exception as e:
            raise ValueError(f"Failed to read PPTX presentation. The file may be corrupt or invalid: {str(e)}")

        total_slides = len(prs.slides)
        if total_slides == 0:
            raise ValueError("The PowerPoint presentation contains 0 slides.")

        pages_data: List[PageChunk] = []
        full_text_parts: List[str] = []
        detected_title = None

        for idx, slide in enumerate(prs.slides):
            slide_num = idx + 1
            slide_title = None
            text_items: List[str] = []
            table_items: List[str] = []
            
            # 1. Slide Title
            if slide.shapes.title and slide.shapes.title.text:
                slide_title = slide.shapes.title.text.strip()
                if not detected_title and slide_title:
                    detected_title = slide_title

            # 2. Iterate Shapes for text, bullet points, tables
            for shape in slide.shapes:
                # Skip the title shape if already processed
                if shape == slide.shapes.title:
                    continue
                    
                if shape.has_text_frame:
                    for paragraph in shape.text_frame.paragraphs:
                        text = paragraph.text.strip()
                        if text:
                            # Preserve level indentation if sub-bullet
                            prefix = "  " * paragraph.level + "- " if paragraph.level > 0 else ""
                            text_items.append(f"{prefix}{text}")
                            
                elif shape.has_table:
                    table = shape.table
                    rows_text = []
                    for row in table.rows:
                        row_vals = [cell.text.strip().replace("\n", " ") for cell in row.cells]
                        rows_text.append(" | ".join(row_vals))
                    if rows_text:
                        table_items.append("Table:\n" + "\n".join(rows_text))

            # 3. Speaker Notes
            notes_text = ""
            if slide.has_notes_slide and slide.notes_slide:
                notes_tf = slide.notes_slide.notes_text_frame
                if notes_tf and notes_tf.text:
                    clean_notes = notes_tf.text.strip()
                    if clean_notes:
                        notes_text = clean_notes

            # Format the slide chunk
            effective_title = slide_title or f"Slide {slide_num}"
            slide_body_parts = []
            if text_items:
                slide_body_parts.append("\n".join(text_items))
            if table_items:
                slide_body_parts.append("\n\n".join(table_items))
                
            slide_content = "\n\n".join(slide_body_parts).strip()
            
            # Build unified slide display text
            display_text = f"## {effective_title}\n"
            if slide_content:
                display_text += f"\n{slide_content}\n"
            if notes_text:
                display_text += f"\n[Speaker Notes]:\n{notes_text}\n"

            pages_data.append(PageChunk(
                page_number=slide_num,
                title=effective_title,
                text=display_text.strip(),
                notes=notes_text if notes_text else None
            ))
            
            full_text_parts.append(f"--- Slide {slide_num}: {effective_title} ---\n{display_text.strip()}")

        full_text = "\n\n".join(full_text_parts).strip()
        word_count, est_reading_time = self.calculate_stats(full_text)
        
        final_title = detected_title or filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()

        return ParsedResult(
            title=final_title,
            filename=filename,
            file_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            file_size=file_size,
            page_count=total_slides,
            word_count=word_count,
            est_reading_time_minutes=est_reading_time,
            full_text=full_text,
            pages=pages_data,
            warnings=[]
        )
