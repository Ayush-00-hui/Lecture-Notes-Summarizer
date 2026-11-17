import os
import pytest
from backend.app.parsers.factory import ParserFactory

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

def test_parse_text_pdf():
    file_path = os.path.join(FIXTURES_DIR, "lecture_sample.pdf")
    with open(file_path, "rb") as f:
        content = f.read()
    result = ParserFactory.parse_file(content, "lecture_sample.pdf")
    assert result.page_count >= 1
    assert result.word_count > 20
    assert "Neural Networks" in result.full_text or "Neural Networks" in result.title
    assert result.est_reading_time_minutes >= 0.1

def test_parse_scanned_empty_pdf_warning():
    file_path = os.path.join(FIXTURES_DIR, "scanned_empty_text.pdf")
    with open(file_path, "rb") as f:
        content = f.read()
    result = ParserFactory.parse_file(content, "scanned_empty_text.pdf")
    assert len(result.warnings) > 0
    assert any("Scanned document" in w or "OCR" in w for w in result.warnings)

def test_parse_password_protected_pdf_raises_error():
    file_path = os.path.join(FIXTURES_DIR, "password_protected.pdf")
    with open(file_path, "rb") as f:
        content = f.read()
    with pytest.raises(ValueError) as exc_info:
        ParserFactory.parse_file(content, "password_protected.pdf")
    assert "password-protected" in str(exc_info.value).lower()

def test_parse_pptx_with_notes_and_tables():
    file_path = os.path.join(FIXTURES_DIR, "lecture_presentation.pptx")
    with open(file_path, "rb") as f:
        content = f.read()
    result = ParserFactory.parse_file(content, "lecture_presentation.pptx")
    assert result.page_count == 3
    assert "Raft" in result.full_text
    assert "Follower" in result.full_text
    # Verify speaker notes were extracted
    assert any(p.notes and "exam" in p.notes.lower() for p in result.pages)
    # Verify table content was captured
    assert "Table:" in result.full_text or "Metric" in result.full_text

def test_parse_docx():
    file_path = os.path.join(FIXTURES_DIR, "lecture_notes.docx")
    with open(file_path, "rb") as f:
        content = f.read()
    result = ParserFactory.parse_file(content, "lecture_notes.docx")
    assert result.page_count >= 1
    assert "Atomicity" in result.full_text
    assert "Durability" in result.full_text

def test_parse_text_file():
    file_path = os.path.join(FIXTURES_DIR, "operating_systems.txt")
    with open(file_path, "rb") as f:
        content = f.read()
    result = ParserFactory.parse_file(content, "operating_systems.txt")
    assert result.page_count >= 1
    assert "Virtual Memory" in result.title or "Virtual Memory" in result.full_text
    assert "Paging" in result.full_text

def test_parse_empty_file_error():
    file_path = os.path.join(FIXTURES_DIR, "empty_file.txt")
    with open(file_path, "rb") as f:
        content = f.read()
    with pytest.raises(ValueError) as exc_info:
        ParserFactory.parse_file(content, "empty_file.txt")
    assert "empty" in str(exc_info.value).lower()

def test_parse_corrupt_file_error():
    file_path = os.path.join(FIXTURES_DIR, "corrupt_document.pdf")
    with open(file_path, "rb") as f:
        content = f.read()
    with pytest.raises(ValueError) as exc_info:
        ParserFactory.parse_file(content, "corrupt_document.pdf")
    assert "corrupt" in str(exc_info.value).lower() or "failed" in str(exc_info.value).lower()

def test_unsupported_file_extension():
    with pytest.raises(ValueError) as exc_info:
        ParserFactory.parse_file(b"some audio bytes", "song.mp3")
    assert "unsupported file format" in str(exc_info.value).lower()
