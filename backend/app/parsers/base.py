from abc import ABC, abstractmethod
from typing import List
from pydantic import BaseModel
from backend.app.db.schemas import PageChunk

class ParsedResult(BaseModel):
    title: str
    filename: str
    file_type: str
    file_size: int
    page_count: int
    word_count: int
    est_reading_time_minutes: float
    full_text: str
    pages: List[PageChunk]
    warnings: List[str] = []

class BaseParser(ABC):
    @abstractmethod
    def parse(self, content: bytes, filename: str) -> ParsedResult:
        """Parses the raw file content and returns a standardized ParsedResult."""
        pass
        
    @staticmethod
    def calculate_stats(full_text: str) -> tuple[int, float]:
        """Calculates word count and estimated reading time (approx 200 wpm)."""
        words = full_text.split()
        word_count = len(words)
        est_minutes = round(word_count / 200.0, 1) if word_count > 0 else 0.0
        return word_count, est_minutes
