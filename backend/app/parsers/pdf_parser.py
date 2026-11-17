import io
import re
import shutil
from typing import List
from pypdf import PdfReader
import pdfplumber

from backend.app.parsers.base import BaseParser, ParsedResult
from backend.app.db.schemas import PageChunk

class PDFParser(BaseParser):
    def parse(self, content: bytes, filename: str) -> ParsedResult:
        if not content:
            raise ValueError("The uploaded PDF file is empty (0 bytes).")
            
        file_size = len(content)
        file_stream = io.BytesIO(content)
        
        try:
            reader = PdfReader(file_stream)
        except Exception as e:
            raise ValueError(f"Failed to read PDF file. It may be corrupted or malformed. ({str(e)})")
            
        if reader.is_encrypted:
            # Check if decryptable with empty password
            try:
                decrypted = reader.decrypt("")
                if decrypted == 0:
                    raise ValueError("PDF is password-protected. Please remove the password before uploading.")
            except Exception:
                raise ValueError("PDF is password-protected. Please remove the password before uploading.")

        total_pages = len(reader.pages)
        if total_pages == 0:
            raise ValueError("The PDF document contains 0 pages.")

        pages_data: List[PageChunk] = []
        warnings: List[str] = []
        full_text_parts: List[str] = []
        
        # Try pdfplumber for high-fidelity text and table extraction
        try:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                for idx, page in enumerate(pdf.pages):
                    page_num = idx + 1
                    page_text = page.extract_text(layout=True) or ""
                    
                    # Extract tables if available
                    tables = page.extract_tables()
                    table_texts = []
                    for table in tables:
                        table_rows = []
                        for row in table:
                            clean_row = [str(c).strip() if c is not None else "" for c in row]
                            table_rows.append(" | ".join(clean_row))
                        if table_rows:
                            table_texts.append("\n" + "\n".join(table_rows) + "\n")
                    
                    if table_texts:
                        page_text += "\n" + "\n".join(table_texts)
                        
                    # Normalize excess horizontal whitespace in text lines
                    lines = [re.sub(r'[ \t]+', ' ', line).strip() for line in page_text.splitlines()]
                    clean_text = "\n".join(line for line in lines if line).strip()
                    pages_data.append(PageChunk(
                        page_number=page_num,
                        title=f"Page {page_num}",
                        text=clean_text
                    ))
                    if clean_text:
                        full_text_parts.append(f"--- Page {page_num} ---\n{clean_text}")
        except Exception:
            # Fallback to standard pypdf extraction if pdfplumber encounters an error
            pages_data = []
            full_text_parts = []
            for idx, page in enumerate(reader.pages):
                page_num = idx + 1
                try:
                    text = (page.extract_text() or "").strip()
                except Exception:
                    text = ""
                pages_data.append(PageChunk(
                    page_number=page_num,
                    title=f"Page {page_num}",
                    text=text
                ))
                if text:
                    full_text_parts.append(f"--- Page {page_num} ---\n{text}")

        full_text = "\n\n".join(full_text_parts).strip()
        
        # Check for empty text layer (scanned PDF)
        if not full_text:
            # Check if OCR (pytesseract + tesseract binary) is available
            tesseract_available = shutil.which("tesseract") is not None
            ocr_applied = False
            
            if tesseract_available:
                try:
                    import pytesseract
                    with pdfplumber.open(io.BytesIO(content)) as pdf:
                        ocr_parts = []
                        pages_data = []
                        for idx, page in enumerate(pdf.pages):
                            page_num = idx + 1
                            img = page.to_image(resolution=200).original
                            ocr_text = pytesseract.image_to_string(img).strip()
                            pages_data.append(PageChunk(
                                page_number=page_num,
                                title=f"Page {page_num} (OCR)",
                                text=ocr_text
                            ))
                            if ocr_text:
                                ocr_parts.append(f"--- Page {page_num} (OCR) ---\n{ocr_text}")
                        full_text = "\n\n".join(ocr_parts).strip()
                        if full_text:
                            ocr_applied = True
                            warnings.append("Document was scanned; text was extracted using OCR.")
                except Exception as ocr_err:
                    warnings.append(f"OCR processing failed: {str(ocr_err)}")

            if not ocr_applied and not full_text:
                warning_msg = (
                    "Scanned document detected: This PDF appears to be an image-only scan with no text layer. "
                    "Tesseract OCR is not installed or configured on the server. "
                    "Please upload a searchable PDF or paste the lecture text."
                )
                warnings.append(warning_msg)
                full_text = f"[Empty text layer. {warning_msg}]"

        # Determine document title
        title = filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()
        if reader.metadata and reader.metadata.title:
            meta_title = str(reader.metadata.title).strip()
            if meta_title and len(meta_title) > 2 and meta_title.lower() not in ["(anonymous)", "untitled"]:
                title = meta_title

        word_count, est_reading_time = self.calculate_stats(full_text)

        return ParsedResult(
            title=title,
            filename=filename,
            file_type="application/pdf",
            file_size=file_size,
            page_count=total_pages,
            word_count=word_count,
            est_reading_time_minutes=est_reading_time,
            full_text=full_text,
            pages=pages_data,
            warnings=warnings
        )
