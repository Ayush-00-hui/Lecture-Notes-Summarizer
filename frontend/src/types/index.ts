export interface PageChunk {
  page_number: number;
  title?: string;
  text: string;
  notes?: string;
}

export interface DocumentPreview {
  id: string;
  title: string;
  filename: string;
  file_type: string;
  file_size: number;
  page_count: number;
  word_count: number;
  est_reading_time_minutes: number;
  pages: PageChunk[];
  warnings: string[];
}

export interface DocumentListItem {
  id: string;
  title: string;
  filename: string;
  file_type: string;
  file_size: number;
  page_count: number;
  word_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface KeyConcept {
  term: string;
  definition: string;
  importance: 'High' | 'Medium' | 'Low';
  source_reference: string;
  category?: string;
  why_it_matters?: string;
  common_misconception?: string;
  analogy?: string;
  formula_or_code?: string;
}

export interface RevisionPoint {
  topic: string;
  point: string;
  exam_question_hint?: string;
  model_answer?: string;
  blooms_level?: 'Recall' | 'Application' | 'Analysis' | 'Evaluation' | string;
  difficulty?: 'Standard' | 'Challenging' | 'Edge Case' | string;
}

export interface Flashcard {
  question: string;
  answer: string;
  category?: string;
  hint?: string;
  detailed_explanation?: string;
  trap_to_avoid?: string;
  source_reference?: string;
}

export interface StudyPackageOutput {
  summary: string;
  key_concepts: KeyConcept[];
  revision_points: RevisionPoint[];
  flashcards: Flashcard[];
}

export interface UnsupportedSentence {
  sentence: string;
  lexical_overlap_score: number;
  reason: string;
}

export interface MetricsData {
  word_count: number;
  char_count: number;
  compression_ratio: number;
  latency_ms: number;
  token_usage_estimate: number;
  flesch_kincaid_grade: number;
  flesch_reading_ease: number;
  concept_coverage_pct: number;
  redundancy_score: number;
  hallucination_risk_pct: number;
  unsupported_sentences: UnsupportedSentence[];
}

export interface DiffSegment {
  text: string;
  type: 'equal' | 'insert' | 'delete';
}

export interface LLMJudgeScore {
  faithfulness: number;
  coverage: number;
  clarity: number;
  conciseness: number;
  rationale: string;
}

export interface LLMJudgeComparison {
  score_a: LLMJudgeScore;
  score_b: LLMJudgeScore;
  comparison_summary: string;
}

export interface SummarizeResponse {
  id: string;
  document_id: string;
  summary_mode: string;
  audience_level: string;
  language: string;
  output: StudyPackageOutput;
  provider_type: string;
  model_name: string;
  latency_ms: number;
  created_at: string;
}

export interface CompareResponse {
  id: string;
  document_id: string;
  prompt_a_name: string;
  prompt_b_name: string;
  output_a: StudyPackageOutput;
  output_b: StudyPackageOutput;
  metrics_a: MetricsData;
  metrics_b: MetricsData;
  diff_data: DiffSegment[];
  llm_judge?: LLMJudgeComparison;
  verdict_summary: string;
  user_votes: Record<string, any>;
  created_at: string;
}

export interface PromptTemplateDTO {
  id: string;
  name: string;
  prompt_type: string;
  version: number;
  description?: string;
  system_prompt: string;
  user_template: string;
  is_default: boolean;
  updated_at: string;
}

export interface SettingsDTO {
  has_gemini_api_key: boolean;
  gemini_api_key_masked: string;
  active_model: string;
  temperature: number;
  default_summary_mode: string;
  default_audience: string;
  offline_available: boolean;
  available_models: { id: string; name: string }[];
}
