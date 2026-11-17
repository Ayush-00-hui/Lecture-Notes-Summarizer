import asyncio
import json
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.security import sanitize_document_text, format_data_boundary
from backend.app.db.models import Document, ComparisonRun
from backend.app.db.schemas import (
    CompareRequest, CompareResponse, MetricsData
)
from backend.app.prompts.templates import (
    PROMPT_A_DIRECT_SYSTEM, PROMPT_A_DIRECT_USER,
    PROMPT_B_STRUCTURED_SYSTEM, PROMPT_B_STRUCTURED_USER,
    render_prompt
)
from backend.app.providers.factory import ProviderFactory
from backend.app.services.metrics import (
    evaluate_metrics, compute_word_diff
)

class ComparatorService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def compare(
        self,
        request: CompareRequest,
        api_key: Optional[str] = None
    ) -> CompareResponse:
        # 1. Fetch document text
        doc_title = request.title or "Lecture Notes"
        full_text = ""
        doc_id = request.document_id

        if doc_id:
            db_doc = await self.db.get(Document, doc_id)
            if not db_doc:
                raise ValueError(f"Document with ID '{doc_id}' not found.")
            full_text = db_doc.full_text
            doc_title = db_doc.title
        elif request.raw_text:
            full_text = request.raw_text
        else:
            raise ValueError("Either document_id or raw_text must be provided.")

        sanitized_text, _ = sanitize_document_text(full_text)
        if not sanitized_text:
            raise ValueError("Input document contains no valid text to compare.")

        # 2. Setup prompts and target length
        target_words = 140 if request.summary_mode == "short" else 450
        if request.target_words:
            target_words = request.target_words

        variables = {
            "title": doc_title,
            "notes": format_data_boundary(sanitized_text),
            "length": target_words,
            "audience": request.audience_level,
            "language": request.language,
        }

        # Prompt A (Direct)
        prompt_a_sys = PROMPT_A_DIRECT_SYSTEM
        prompt_a_usr = request.custom_prompt_a or render_prompt(PROMPT_A_DIRECT_USER, variables)

        # Prompt B (Structured)
        prompt_b_sys = PROMPT_B_STRUCTURED_SYSTEM
        prompt_b_usr = request.custom_prompt_b or render_prompt(PROMPT_B_STRUCTURED_USER, variables)

        # 3. Provider initialization
        provider = ProviderFactory.get_provider(api_key=api_key)

        # 4. RUN BOTH IN PARALLEL with identical model settings
        async def run_prompt_a():
            return await provider.generate_study_package(
                user_prompt=prompt_a_usr,
                system_prompt=prompt_a_sys,
                temperature=0.2
            )

        async def run_prompt_b():
            return await provider.generate_study_package(
                user_prompt=prompt_b_usr,
                system_prompt=prompt_b_sys,
                temperature=0.2
            )

        task_a = asyncio.create_task(run_prompt_a())
        task_b = asyncio.create_task(run_prompt_b())
        (out_a, lat_a, tok_a), (out_b, lat_b, tok_b) = await asyncio.gather(task_a, task_b)

        # 5. Compute objective NLP metrics for both outputs
        metrics_a = evaluate_metrics(sanitized_text, out_a, lat_a, tok_a)
        metrics_b = evaluate_metrics(sanitized_text, out_b, lat_b, tok_b)

        # 6. Compute word-level diff between Output A and Output B summaries
        diff_data = compute_word_diff(out_a.summary, out_b.summary)

        # 7. Optional or automatic LLM-as-judge evaluation
        llm_judge = None
        if request.run_llm_judge:
            try:
                llm_judge = await provider.evaluate_judge(sanitized_text, out_a, out_b)
            except Exception:
                llm_judge = None

        # 8. Synthesize summary verdict
        verdict = self._synthesize_verdict(metrics_a, metrics_b)

        # 9. Persist comparison run
        comp_record = ComparisonRun(
            document_id=doc_id or "adhoc",
            prompt_a_name="Prompt A (Direct Zero-Shot)",
            prompt_a_text=prompt_a_usr,
            prompt_b_name="Prompt B (Structured Scaffold)",
            prompt_b_text=prompt_b_usr,
            output_a=json.dumps(out_a.model_dump()),
            output_b=json.dumps(out_b.model_dump()),
            metrics_a=json.dumps(metrics_a.model_dump()),
            metrics_b=json.dumps(metrics_b.model_dump()),
            diff_data=json.dumps([d.model_dump() for d in diff_data]),
            llm_judge=json.dumps(llm_judge.model_dump()) if llm_judge else "{}",
            user_votes="{}",
            verdict_summary=verdict
        )
        self.db.add(comp_record)
        await self.db.commit()
        await self.db.refresh(comp_record)

        return CompareResponse(
            id=comp_record.id,
            document_id=comp_record.document_id,
            prompt_a_name=comp_record.prompt_a_name,
            prompt_b_name=comp_record.prompt_b_name,
            output_a=out_a,
            output_b=out_b,
            metrics_a=metrics_a,
            metrics_b=metrics_b,
            diff_data=diff_data,
            llm_judge=llm_judge,
            verdict_summary=verdict,
            user_votes={},
            created_at=comp_record.created_at
        )

    @staticmethod
    def _synthesize_verdict(ma: MetricsData, mb: MetricsData) -> str:
        """Generates dynamic, data-driven summary verdict comparing A and B."""
        wins_a = []
        wins_b = []

        if ma.concept_coverage_pct > mb.concept_coverage_pct + 3.0:
            wins_a.append("Concept Coverage")
        elif mb.concept_coverage_pct > ma.concept_coverage_pct + 3.0:
            wins_b.append("Concept Coverage")

        if ma.latency_ms < mb.latency_ms:
            wins_a.append("Latency & Speed")
        else:
            wins_b.append("Latency & Speed")

        if ma.compression_ratio < mb.compression_ratio:
            wins_a.append("Conciseness & High Density")
        else:
            wins_b.append("Depth & Structural Elaboration")

        if ma.flesch_reading_ease > mb.flesch_reading_ease + 5.0:
            wins_a.append("Reading Accessibility")
        elif mb.flesch_reading_ease > ma.flesch_reading_ease + 5.0:
            wins_b.append("Reading Accessibility")

        if ma.hallucination_risk_pct < mb.hallucination_risk_pct:
            wins_a.append("Lexical Grounding")
        elif mb.hallucination_risk_pct < ma.hallucination_risk_pct:
            wins_b.append("Lexical Grounding")

        summary_a_wins = ", ".join(wins_a) if wins_a else "Execution Speed"
        summary_b_wins = ", ".join(wins_b) if wins_b else "Pedagogical Depth"

        return (
            f"Prompt B (Structured) wins on {summary_b_wins}; "
            f"Prompt A (Direct) wins on {summary_a_wins}."
        )
