from abc import ABC, abstractmethod
from typing import Tuple, AsyncGenerator, Optional
from backend.app.db.schemas import StudyPackageOutput, LLMJudgeComparison

class LLMProvider(ABC):
    @abstractmethod
    async def generate_study_package(
        self,
        user_prompt: str,
        system_prompt: str,
        temperature: float = 0.2,
        model_name: Optional[str] = None
    ) -> Tuple[StudyPackageOutput, float, int]:
        """
        Generates structured study package (summary, concepts, revision points, flashcards).
        Returns: (StudyPackageOutput, latency_ms, estimated_token_usage)
        """
        pass

    @abstractmethod
    async def evaluate_judge(
        self,
        doc_text: str,
        output_a: StudyPackageOutput,
        output_b: StudyPackageOutput,
        model_name: Optional[str] = None
    ) -> LLMJudgeComparison:
        """
        Evaluates outputs A and B as an LLM judge on faithfulness, coverage, clarity, conciseness.
        """
        pass

    @abstractmethod
    async def stream_summary(
        self,
        user_prompt: str,
        system_prompt: str,
        temperature: float = 0.2,
        model_name: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Streams generated tokens/chunks.
        """
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Checks if provider has necessary API keys/credentials configured."""
        pass
