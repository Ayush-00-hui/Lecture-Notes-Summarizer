from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime

# --- Study Asset Models ---
class KeyConcept(BaseModel):
    term: str = Field(..., description="Key technical term or principle")
    definition: str = Field(..., description="Concise one-line definition")
    importance: Literal["High", "Medium", "Low"] = Field("High", description="Importance rating")
    source_reference: str = Field("Page 1", description="Source citation, e.g. 'Page 3' or 'Slide 7'")
    category: Optional[str] = Field(None, description="Topic or conceptual domain")
    why_it_matters: Optional[str] = Field(None, description="Engineering/practical significance")
    common_misconception: Optional[str] = Field(None, description="Frequent student error or trap")
    analogy: Optional[str] = Field(None, description="Intuitive real-world mental model")
    formula_or_code: Optional[str] = Field(None, description="Mathematical or algorithmic invariant")

class RevisionPoint(BaseModel):
    topic: str = Field(..., description="Subtopic or thematic group")
    point: str = Field(..., description="Exam-ready revision bullet point")
    exam_question_hint: Optional[str] = Field(None, description="Likely exam question based on this point")
    model_answer: Optional[str] = Field(None, description="Examiner marking criteria & full marks model answer")
    blooms_level: Optional[str] = Field("Analysis", description="Bloom's Taxonomy category (Recall, Application, Analysis, Evaluation)")
    difficulty: Optional[Literal["Standard", "Challenging", "Edge Case"]] = Field("Standard", description="Difficulty classification")

class Flashcard(BaseModel):
    question: str = Field(..., description="Direct question or prompt")
    answer: str = Field(..., description="Concise answer / explanation")
    category: Optional[str] = Field("General", description="Subject tag")
    hint: Optional[str] = Field(None, description="Clue without revealing the answer")
    detailed_explanation: Optional[str] = Field(None, description="In-depth pedagogical reasoning")
    trap_to_avoid: Optional[str] = Field(None, description="Common pitfall or exam trap")
    source_reference: Optional[str] = Field(None, description="Slide or page source reference")

class StudyPackageOutput(BaseModel):
    summary: str = Field(..., description="Summary content in structured markdown")
    key_concepts: List[KeyConcept] = Field(default_factory=list)
    revision_points: List[RevisionPoint] = Field(default_factory=list)
    flashcards: List[Flashcard] = Field(default_factory=list)

# --- Metric & Diff Models ---
class UnsupportedSentence(BaseModel):
    sentence: str
    lexical_overlap_score: float
    reason: str

class MetricsData(BaseModel):
    word_count: int
    char_count: int
    compression_ratio: float  # output_words / input_words
    latency_ms: float
    token_usage_estimate: int
    flesch_kincaid_grade: float
    flesch_reading_ease: float
    concept_coverage_pct: float
    redundancy_score: float
    hallucination_risk_pct: float
    unsupported_sentences: List[UnsupportedSentence] = Field(default_factory=list)

class DiffSegment(BaseModel):
    text: str
    type: Literal["equal", "insert", "delete"]

class LLMJudgeScore(BaseModel):
    faithfulness: int = Field(..., ge=1, le=5)
    coverage: int = Field(..., ge=1, le=5)
    clarity: int = Field(..., ge=1, le=5)
    conciseness: int = Field(..., ge=1, le=5)
    rationale: str

class LLMJudgeComparison(BaseModel):
    score_a: LLMJudgeScore
    score_b: LLMJudgeScore
    comparison_summary: str

# --- Page Chunk Model ---
class PageChunk(BaseModel):
    page_number: int
    title: Optional[str] = None
    text: str
    notes: Optional[str] = None

# --- Document Request & Response Models ---
class DocumentPreview(BaseModel):
    id: str
    title: str
    filename: str
    file_type: str
    file_size: int
    page_count: int
    word_count: int
    est_reading_time_minutes: float
    pages: List[PageChunk]
    warnings: List[str] = Field(default_factory=list)

class DocumentUpdateText(BaseModel):
    full_text: str
    pages: Optional[List[PageChunk]] = None

class DocumentListItem(BaseModel):
    id: str
    title: str
    filename: str
    file_type: str
    file_size: int
    page_count: int
    word_count: int
    is_pinned: bool
    created_at: datetime
    updated_at: datetime

# --- Summarization Requests & Responses ---
class SummarizeRequest(BaseModel):
    document_id: Optional[str] = None
    raw_text: Optional[str] = None
    title: Optional[str] = "Lecture Notes"
    summary_mode: Literal["short", "detailed", "custom"] = "short"
    target_words: Optional[int] = None
    audience_level: Literal["beginner", "intermediate", "expert"] = "intermediate"
    language: str = "English"
    generate_summary: bool = True
    generate_concepts: bool = True
    generate_revision_points: bool = True
    generate_flashcards: bool = True
    model: Optional[str] = None
    temperature: Optional[float] = None

class SummarizeResponse(BaseModel):
    id: str
    document_id: str
    summary_mode: str
    audience_level: str
    language: str
    output: StudyPackageOutput
    provider_type: str
    model_name: str
    latency_ms: float
    created_at: datetime

# --- Compare Requests & Responses ---
class CompareRequest(BaseModel):
    document_id: Optional[str] = None
    raw_text: Optional[str] = None
    title: Optional[str] = "Lecture Notes"
    summary_mode: Literal["short", "detailed", "custom"] = "short"
    target_words: Optional[int] = None
    audience_level: Literal["beginner", "intermediate", "expert"] = "intermediate"
    language: str = "English"
    custom_prompt_a: Optional[str] = None
    custom_prompt_b: Optional[str] = None
    run_llm_judge: bool = False

class CompareResponse(BaseModel):
    id: str
    document_id: str
    prompt_a_name: str
    prompt_b_name: str
    output_a: StudyPackageOutput
    output_b: StudyPackageOutput
    metrics_a: MetricsData
    metrics_b: MetricsData
    diff_data: List[DiffSegment]
    llm_judge: Optional[LLMJudgeComparison] = None
    verdict_summary: str
    user_votes: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

class UserVoteRequest(BaseModel):
    comparison_id: str
    better_coverage: Optional[Literal["A", "B", "Tie"]] = None
    better_conciseness: Optional[Literal["A", "B", "Tie"]] = None
    better_clarity: Optional[Literal["A", "B", "Tie"]] = None
    overall_winner: Optional[Literal["A", "B", "Tie"]] = None
    feedback_notes: Optional[str] = None

# --- Prompt Template Models ---
class PromptTemplateDTO(BaseModel):
    id: str
    name: str
    prompt_type: str
    version: int
    description: Optional[str] = None
    system_prompt: str
    user_template: str
    is_default: bool
    updated_at: datetime

class PromptTemplateUpdate(BaseModel):
    system_prompt: Optional[str] = None
    user_template: Optional[str] = None
    description: Optional[str] = None

# --- Settings Models ---
class SettingsDTO(BaseModel):
    has_gemini_api_key: bool
    gemini_api_key_masked: str
    active_model: str
    temperature: float
    default_summary_mode: str
    default_audience: str
    offline_available: bool = True
