import re
from typing import List
from backend.app.parsers.base import BaseParser, ParsedResult
from backend.app.db.schemas import PageChunk

class TextParser(BaseParser):
    def parse(self, content: bytes, filename: str) -> ParsedResult:
        if not content:
            raise ValueError("The uploaded text file is empty (0 bytes).")
            
        file_size = len(content)
        
        # Decode text with utf-8 or latin-1 fallback
        try:
            raw_text = content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                raw_text = content.decode("latin-1")
            except Exception as e:
                raise ValueError(f"Failed to decode text file. Ensure it is encoded in UTF-8 or ASCII: {str(e)}")

        return self.parse_text_string(raw_text, filename, file_size)

    def parse_text_string(self, text: str, filename: str, file_size: int = 0) -> ParsedResult:
        clean_text = text.strip()
        if not clean_text:
            raise ValueError("The provided text content is empty.")
            
        if file_size == 0:
            file_size = len(clean_text.encode("utf-8"))

        lines = clean_text.splitlines()
        detected_title = None

        # Check for first heading # Title or markdown title
        for line in lines[:10]:
            trimmed = line.strip()
            if trimmed.startswith("# ") and len(trimmed) > 2:
                detected_title = trimmed[2:].strip()
                break
            elif trimmed.startswith("Title:") and len(trimmed) > 6:
                detected_title = trimmed[6:].strip()
                break

        # Check for explicit slide/page dividers (e.g. '---', '===', '--- Page X ---', '--- Slide Y ---')
        divider_pattern = re.compile(r'^\s*(?:---|===|\*\*\*|--- (?:Page|Slide) \d+.*---)\s*$', re.MULTILINE)
        raw_sections = divider_pattern.split(clean_text)
        
        pages_data: List[PageChunk] = []
        full_text_parts: List[str] = []
        
        if len(raw_sections) > 1:
            for idx, sec in enumerate(raw_sections):
                sec_text = sec.strip()
                if not sec_text:
                    continue
                page_num = len(pages_data) + 1
                
                # Check for section title
                sec_lines = sec_text.splitlines()
                sec_title = f"Section {page_num}"
                if sec_lines and (sec_lines[0].startswith("#") or sec_lines[0].startswith("Slide") or sec_lines[0].startswith("Page")):
                    sec_title = sec_lines[0].strip("# ").strip()
                    
                pages_data.append(PageChunk(
                    page_number=page_num,
                    title=sec_title,
                    text=sec_text
                ))
                full_text_parts.append(f"--- {sec_title} ---\n{sec_text}")
        else:
            # Check for markdown headings `# ` or `## `
            heading_pattern = re.compile(r'^\s*(#{1,3}\s+.+)$', re.MULTILINE)
            split_by_headings = heading_pattern.split(clean_text)
            
            if len(split_by_headings) > 2:
                # split_by_headings alternates: [preamble, heading1, text1, heading2, text2, ...]
                preamble = split_by_headings[0].strip()
                if preamble:
                    pages_data.append(PageChunk(
                        page_number=1,
                        title="Introduction",
                        text=preamble
                    ))
                    full_text_parts.append(preamble)
                    
                for i in range(1, len(split_by_headings), 2):
                    h_title = split_by_headings[i].strip("# ").strip()
                    h_body = split_by_headings[i+1].strip() if i+1 < len(split_by_headings) else ""
                    chunk_text = f"## {h_title}\n\n{h_body}".strip()
                    page_num = len(pages_data) + 1
                    pages_data.append(PageChunk(
                        page_number=page_num,
                        title=h_title,
                        text=chunk_text
                    ))
                    full_text_parts.append(chunk_text)
            else:
                # If single unbroken text, partition into ~400 word chunks if large
                words = clean_text.split()
                if len(words) > 600:
                    chunk_size = 400
                    for chunk_idx, i in enumerate(range(0, len(words), chunk_size)):
                        chunk_words = words[i:i + chunk_size]
                        chunk_str = " ".join(chunk_words)
                        page_num = chunk_idx + 1
                        pages_data.append(PageChunk(
                            page_number=page_num,
                            title=f"Part {page_num}",
                            text=chunk_str
                        ))
                        full_text_parts.append(f"--- Part {page_num} ---\n{chunk_str}")
                else:
                    pages_data.append(PageChunk(
                        page_number=1,
                        title="Main Notes",
                        text=clean_text
                    ))
                    full_text_parts.append(clean_text)

        full_text = "\n\n".join(full_text_parts).strip()
        word_count, est_reading_time = self.calculate_stats(full_text)
        
        final_title = detected_title or filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()

        return ParsedResult(
            title=final_title,
            filename=filename,
            file_type="text/plain",
            file_size=file_size,
            page_count=len(pages_data),
            word_count=word_count,
            est_reading_time_minutes=est_reading_time,
            full_text=full_text,
            pages=pages_data,
            warnings=[]
        )
