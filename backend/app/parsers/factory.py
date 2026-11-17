from pathlib import Path
from typing import Dict, Type
from backend.app.parsers.base import BaseParser, ParsedResult
from backend.app.parsers.pdf_parser import PDFParser
from backend.app.parsers.pptx_parser import PPTXParser
from backend.app.parsers.ppt_parser import PPTParser
from backend.app.parsers.docx_parser import DOCXParser
from backend.app.parsers.text_parser import TextParser

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

PARSER_MAP: Dict[str, Type[BaseParser]] = {
    ".pdf": PDFParser,
    ".pptx": PPTXParser,
    ".ppt": PPTParser,
    ".docx": DOCXParser,
    ".txt": TextParser,
    ".md": TextParser,
    ".markdown": TextParser,
}

class ParserFactory:
    @staticmethod
    def get_parser(filename: str) -> BaseParser:
        ext = Path(filename).suffix.lower()
        parser_cls = PARSER_MAP.get(ext)
        if not parser_cls:
            supported = ", ".join(PARSER_MAP.keys())
            raise ValueError(f"Unsupported file format '{ext}'. NoteNest supports: {supported}")
        return parser_cls()

    @classmethod
    def parse_file(cls, content: bytes, filename: str) -> ParsedResult:
        if not content or len(content) == 0:
            raise ValueError(f"The file '{filename}' is empty (0 bytes). Please upload a file containing lecture notes.")
            
        if len(content) > MAX_FILE_SIZE:
            raise ValueError(
                f"File '{filename}' exceeds the maximum allowed size of 20 MB "
                f"({round(len(content)/(1024*1024), 2)} MB). Please upload a smaller document."
            )
            
        parser = cls.get_parser(filename)
        return parser.parse(content, filename)
