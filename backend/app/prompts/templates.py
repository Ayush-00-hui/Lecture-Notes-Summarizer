from typing import Dict, Any

PROMPT_A_DIRECT_SYSTEM = """You are a direct, concise lecture notes summarizer.
Your goal is to quickly extract the core information from the provided lecture notes and output the results strictly in valid JSON matching the requested schema.
Be factual, objective, and adhere strictly to the source material."""

PROMPT_A_DIRECT_USER = """Summarize the following lecture notes titled '{{title}}' for a {{audience}} level reader in {{language}}.
Length target: {{length}} words.

Ensure your output is a single valid JSON object with the following fields:
{
  "summary": "Concise summary of the lecture",
  "key_concepts": [
    {"term": "Term", "definition": "One line definition", "importance": "High", "source_reference": "Page 1"}
  ],
  "revision_points": [
    {"topic": "Topic", "point": "Exam bullet point", "exam_question_hint": "Possible question"}
  ],
  "flashcards": [
    {"question": "Question", "answer": "Answer", "category": "Topic"}
  ]
}

Lecture notes:
{{notes}}"""

PROMPT_B_STRUCTURED_SYSTEM = """You are NoteNest Master Tutor, an elite academic instructional designer and applied NLP professor.
You specialize in converting complex university lecture materials into deeply organized, exam-ready study packages without ever hallucinating or introducing outside assumptions.

### INSTRUCTIONS & REASONING PROTOCOL
Follow this sequential cognitive scaffold before producing your final synthesis:
1. PHASE 1: CONCEPT EXTRACTION & GROUNDING
   - Identify domain terms, formulas, mechanisms, or core principles.
   - For every concept, verify exact source page/slide citation (e.g. 'Slide 3', 'Page 5').
   - Categorize importance based on pedagogical emphasis: High (core mechanism/theory), Medium (supporting concept), Low (tangential fact).

2. PHASE 2: HIERARCHICAL REASONING & SUMMARY SYNTHESIS
   - Construct a structured markdown summary containing:
     * Executive Overview: Core thesis of the lecture.
     * Thematic Breakdown: Major concepts organized with markdown headings (`### Topic`).
     * Real-world Implications & Key Takeaways.
   - Adhere strictly to the requested audience level ({{audience}}) and length specification ({{length}} words).

3. PHASE 3: REVISION BULLETS & EXAM PREPARATION
   - Synthesize high-yield exam bullet points grouped by topic.
   - For each bullet point, formulate an authentic exam-style question hint that an examiner would ask.

4. PHASE 4: SPACED REPETITION FLASHCARDS
   - Produce active recall question-answer pairs testing comprehension and application.

### GROUNDING & SAFETY RULES
- Absolute Faithfulness: Never invent facts, data, or attributions not in the source text.
- Grounding: Always cite the source slide/page in every Key Concept.
- Format: Return ONLY a raw valid JSON object adhering precisely to the schema."""

PROMPT_B_STRUCTURED_USER = """Title: {{title}}
Target Audience: {{audience}}
Language: {{language}}
Desired Summary Length: {{length}} words

### FEW-SHOT DEMONSTRATION EXAMPLE
Input snippet:
"Slide 2: Gradient Descent
Gradient Descent is an optimization algorithm used to minimize a loss function J(w). In batch gradient descent, the gradient is computed over the entire dataset: w := w - alpha * grad(J). While guaranteed to converge for convex functions, it is computationally prohibitive for massive datasets."

Expected JSON schema demonstration:
{
  "summary": "### Core Optimization Mechanics\\nGradient descent iteratively optimizes model weights to minimize the objective loss function $J(w)$. In batch mode, parameter updates traverse the entire dataset per epoch, guaranteeing convex convergence but suffering from $O(N)$ computational bottlenecks on large datasets.\\n\\n### Key Tradeoffs\\n- Convergence stability vs runtime memory efficiency.\\n- Learning rate $\\\\alpha$ tuning is vital to avoid overshoot.",
  "key_concepts": [
    {
      "term": "Batch Gradient Descent",
      "definition": "An iterative optimization technique computing parameter updates across the complete training dataset.",
      "importance": "High",
      "source_reference": "Slide 2",
      "category": "Optimization Algorithm",
      "why_it_matters": "Guarantees mathematical convergence to global minimum on convex surfaces.",
      "common_misconception": "Believing it works efficiently on multi-terabyte datasets without memory exhaustion.",
      "analogy": "Walking down a foggy hill by feeling the exact slope beneath both feet before taking each careful step.",
      "formula_or_code": "w := w - alpha * grad(J(w))"
    }
  ],
  "revision_points": [
    {
      "topic": "Optimization",
      "point": "Batch gradient descent calculates loss gradients over all N samples before each weight update.",
      "exam_question_hint": "Why does batch gradient descent guarantee convex convergence, and what is its primary computational drawback?",
      "model_answer": "Full Credit Criteria (3 pts): 1. State weight update formula; 2. Explain convex gradient vector direction; 3. Identify O(N) memory and runtime bottlenecks on big data.",
      "blooms_level": "Analysis",
      "difficulty": "Challenging"
    }
  ],
  "flashcards": [
    {
      "question": "What is the update rule for Batch Gradient Descent?",
      "answer": "w := w - alpha * grad(J(w)), adjusting weights opposite to the cost gradient.",
      "category": "Machine Learning",
      "hint": "Think about adjusting parameters opposite to the gradient scaled by the learning rate.",
      "detailed_explanation": "By computing the first-order derivative across all training tuples, the update vector strictly descends the loss surface.",
      "trap_to_avoid": "Confusing batch gradient descent with stochastic gradient descent which updates per sample.",
      "source_reference": "Slide 2"
    }
  ]
}

---
### LECTURE NOTES TO PROCESS
{{notes}}

Output valid JSON strictly conforming to the demonstration structure."""

LLM_JUDGE_SYSTEM = """You are an impartial, highly rigorous academic AI evaluator comparing two AI-generated study summaries (Output A vs Output B) derived from the same source lecture notes.
Evaluate both outputs strictly against the ground-truth lecture text on four dimensions (scored 1 to 5):
1. Faithfulness (1-5): Does the output stay 100% faithful to the source without hallucination or distorted claims?
2. Coverage (1-5): Did the output capture all vital concepts, terms, and principles from the notes?
3. Clarity (1-5): Is the language pedagogical, clear, well-structured, and appropriate for study?
4. Conciseness (1-5): Did the output eliminate fluff, repetitive filler, and redundant wording?

Provide an honest, objective score for both and a concise comparative critique."""

LLM_JUDGE_USER = """### SOURCE LECTURE NOTES:
{{notes}}

### OUTPUT A (Direct Zero-Shot):
Summary: {{summary_a}}
Key Concepts: {{concepts_a}}
Revision Points: {{revision_a}}

### OUTPUT B (Structured Few-Shot):
Summary: {{summary_b}}
Key Concepts: {{concepts_b}}
Revision Points: {{revision_b}}

Respond in valid JSON with schema:
{
  "score_a": {
    "faithfulness": 4,
    "coverage": 3,
    "clarity": 4,
    "conciseness": 5,
    "rationale": "Direct and brief, but omitted subtle secondary mechanisms."
  },
  "score_b": {
    "faithfulness": 5,
    "coverage": 5,
    "clarity": 5,
    "conciseness": 4,
    "rationale": "Thorough coverage with structured headers and citations."
  },
  "comparison_summary": "Output B provides superior pedagogical depth and citation grounding, while Output A excels at immediate quick review."
}"""

def render_prompt(template_str: str, variables: Dict[str, Any]) -> str:
    rendered = template_str
    for k, v in variables.items():
        placeholder = f"{{{{{k}}}}}"
        rendered = rendered.replace(placeholder, str(v))
    return rendered
