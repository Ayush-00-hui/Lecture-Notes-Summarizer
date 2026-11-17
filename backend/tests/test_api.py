import os
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.database import init_db

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

@pytest.fixture(scope="session", autouse=True)
def initialize_database():
    import asyncio
    asyncio.run(init_db())

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_upload_file_endpoint(client):
    pdf_path = os.path.join(FIXTURES_DIR, "lecture_sample.pdf")
    with open(pdf_path, "rb") as f:
        response = client.post(
            "/api/upload",
            files={"file": ("lecture_sample.pdf", f, "application/pdf")}
        )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["page_count"] >= 1
    assert data["word_count"] > 10

def test_paste_text_endpoint(client):
    payload = {
        "title": "Machine Learning Fundamentals",
        "text": "# Lecture 1: Supervised Learning\nLinear regression models relationships between scalar dependent and independent variables using least squares."
    }
    response = client.post("/api/upload/paste", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Machine Learning Fundamentals"
    assert data["word_count"] > 5

def test_summarize_endpoint(client):
    payload = {
        "title": "Operating Systems",
        "raw_text": "Virtual memory provides an abstraction of address space. Page tables translate virtual addresses to physical RAM frames. A page fault occurs when a frame is not present.",
        "summary_mode": "short",
        "audience_level": "intermediate",
        "language": "English",
        "generate_summary": True,
        "generate_concepts": True,
        "generate_revision_points": True,
        "generate_flashcards": True
    }
    response = client.post("/api/summarize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "output" in data
    assert len(data["output"]["summary"]) > 10
    assert len(data["output"]["key_concepts"]) > 0

def test_compare_endpoint(client):
    payload = {
        "title": "Distributed Systems",
        "raw_text": "Raft is a consensus protocol designed for understandability. It establishes a leader via election timeouts. The leader accepts log entries and replicates them across followers.",
        "summary_mode": "short",
        "audience_level": "intermediate",
        "language": "English",
        "run_llm_judge": True
    }
    response = client.post("/api/compare", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "output_a" in data
    assert "output_b" in data
    assert "metrics_a" in data
    assert "metrics_b" in data
    assert "verdict_summary" in data
    assert len(data["diff_data"]) > 0

def test_history_list_and_details(client):
    response = client.get("/api/history")
    assert response.status_code == 200
    docs = response.json()
    assert isinstance(docs, list)
    if docs:
        doc_id = docs[0]["id"]
        detail_resp = client.get(f"/api/history/{doc_id}")
        assert detail_resp.status_code == 200
        assert detail_resp.json()["id"] == doc_id

def test_prompts_crud_and_reset(client):
    # Get prompts
    get_resp = client.get("/api/prompts")
    assert get_resp.status_code == 200
    prompts = get_resp.json()
    assert len(prompts) >= 2

    # Reset prompts
    reset_resp = client.post("/api/prompts/reset")
    assert reset_resp.status_code == 200
    assert reset_resp.json()["status"] == "success"

def test_export_markdown(client):
    payload = {
        "title": "Test Study Notes",
        "type": "study_package",
        "data": {
            "summary": "This is a concise summary of the lecture.",
            "key_concepts": [
                {"term": "Paxos", "definition": "Consensus algorithm", "importance": "High", "source_reference": "Page 1"}
            ],
            "revision_points": [
                {"topic": "Consensus", "point": "Paxos guarantees safety under asynchronous network conditions.", "exam_question_hint": "Define safety vs liveness."}
            ],
            "flashcards": [
                {"question": "What is Paxos?", "answer": "A distributed consensus algorithm.", "category": "Theory"}
            ]
        }
    }
    response = client.post("/api/export/markdown", json=payload)
    assert response.status_code == 200
    assert "text/markdown" in response.headers["content-type"]
    assert "Executive Summary" in response.text

def test_settings_endpoint(client):
    get_resp = client.get("/api/settings")
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert "available_models" in data
