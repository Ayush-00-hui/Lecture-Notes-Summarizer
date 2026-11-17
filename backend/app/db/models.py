from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from backend.app.db.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=False, default=0)
    page_count = Column(Integer, nullable=False, default=1)
    word_count = Column(Integer, nullable=False, default=0)
    est_reading_time_minutes = Column(Float, nullable=False, default=0.0)
    full_text = Column(Text, nullable=False)
    pages_data = Column(Text, nullable=False, default="[]")  # JSON list of page chunks
    is_pinned = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class SummaryResult(Base):
    __tablename__ = "summaries"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    summary_mode = Column(String(50), nullable=False, default="short")
    target_words = Column(Integer, nullable=True)
    audience_level = Column(String(50), nullable=False, default="intermediate")
    language = Column(String(50), nullable=False, default="English")
    summary_text = Column(Text, nullable=False)
    key_concepts = Column(Text, nullable=False, default="[]")       # JSON
    revision_points = Column(Text, nullable=False, default="[]")    # JSON
    flashcards = Column(Text, nullable=False, default="[]")         # JSON
    provider_type = Column(String(50), nullable=False)              # "gemini" | "offline"
    model_name = Column(String(100), nullable=False)
    latency_ms = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ComparisonRun(Base):
    __tablename__ = "comparisons"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    prompt_a_name = Column(String(100), nullable=False, default="Prompt A (Direct)")
    prompt_a_text = Column(Text, nullable=False)
    prompt_b_name = Column(String(100), nullable=False, default="Prompt B (Structured)")
    prompt_b_text = Column(Text, nullable=False)
    output_a = Column(Text, nullable=False, default="{}")        # JSON summary & study assets
    output_b = Column(Text, nullable=False, default="{}")        # JSON summary & study assets
    metrics_a = Column(Text, nullable=False, default="{}")       # JSON NLP metrics
    metrics_b = Column(Text, nullable=False, default="{}")       # JSON NLP metrics
    diff_data = Column(Text, nullable=False, default="[]")       # JSON word-level diff segments
    llm_judge = Column(Text, nullable=True, default="{}")        # JSON model-evaluated scores
    user_votes = Column(Text, nullable=False, default="{}")      # JSON user ratings/votes
    verdict_summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PromptTemplate(Base):
    __tablename__ = "prompt_templates"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False)
    prompt_type = Column(String(50), nullable=False)  # "direct", "structured", "judge"
    version = Column(Integer, nullable=False, default=1)
    description = Column(Text, nullable=True)
    system_prompt = Column(Text, nullable=False)
    user_template = Column(Text, nullable=False)
    is_default = Column(Boolean, nullable=False, default=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class AppSettings(Base):
    __tablename__ = "app_settings"
    
    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
