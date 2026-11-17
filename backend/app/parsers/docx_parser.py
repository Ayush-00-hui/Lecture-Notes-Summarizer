import io
from typing import List
from docx import Document as DocxDocument

from backend.app.parsers.base import BaseParser, ParsedResult
from backend.app.db.schemas import PageChunk

class DOCXParser(BaseParser):
    def parse(self, content: bytes, filename: str) -> ParsedResult:
        if not content:
            raise ValueError("The uploaded Word document is empty (0 bytes).")
            
        file_size = len(content)
        file_stream = io.BytesIO(content)
        
        try:
            doc = DocxDocument(file_stream)
        except Exception as e:
            raise ValueError(f"Failed to read Word document (.docx). The file may be corrupt: {str(e)}")

        pages_data: List[PageChunk] = []
        full_text_parts: List[str] = []
        
        current_section_title = "Document Introduction"
        current_section_lines: List[str] = []
        section_idx = 1
        detected_title = None

        # Helper to flush a section into a chunk
        def flush_section(title: str, lines: List[str], num: int):
            text = "\n".join(lines).strip()
            if text:
                pages_data.append(PageChunk(
                    page_number=num,
                    title=title,
                    text=f"## {title}\n\n{text}"
                ))
                full_text_parts.append(f"--- Section {num}: {title} ---\n\n{text}")

        # Iterate paragraphs and tables
        for block in doc.element.body:
            # Check if block is a paragraph
            if block.tag.endswith('p'):
                for p in doc.paragraphs:
                    if p._element == block:
                        p_text = p.text.strip()
                        if not p_text:
                            continue
                            
                        # Detect heading
                        is_heading = p.style.name.startswith('Heading') or p.style.name == 'Title'
                        
                        if p.style.name == 'Title' and not detected_title:
                            detected_title = p_text

                        if is_heading:
                            if current_section_lines:
                                flush_section(current_section_title, current_section_lines, section_idx)
                                section_idx += 1
                                current_section_lines = []
                            current_section_title = p_text
                        else:
                            current_section_lines.append(p_text)
                        break

            # Check if block is a table
            elif block.tag.endswith('tbl'):
                for table in doc.tables:
                    if table._element == block:
                        table_rows = []
                        for row in table.rows:
                            row_vals = [c.text.strip().replace("\n", " ") for c in row.cells]
                            table_rows.append(" | ".join(row_vals))
                        if table_rows:
                            current_section_lines.append("\nTable:\n" + "\n".join(table_rows) + "\n")
                        break

        # Flush final section
        if current_section_lines:
            flush_section(current_section_title, current_section_lines, section_idx)

        # Fallback if no sections were flushed (e.g. document with unusual formatting)
        if not pages_data:
            all_text = "\n".join([p.text.strip() for p in doc.paragraphs if p.text.strip()])
            if all_text:
                pages_data.append(PageChunk(
                    page_number=1,
                    title="Main Content",
                    text=all_text
                ))
                full_text_parts.append(all_text)

        full_text = "\n\n".join(full_text_parts).strip()
        word_count, est_reading_time = self.calculate_stats(full_text)
        
        final_title = detected_title or filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()

        return ParsedResult(
            title=final_title,
            filename=filename,
            file_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            file_size=file_size,
            page_count=max(1, len(pages_data)),
            word_count=word_count,
            est_reading_time_minutes=est_reading_time,
            full_text=full_text,
            pages=pages_data,
            warnings=[]
        )
