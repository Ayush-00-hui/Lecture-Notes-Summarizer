import pytest
from backend.app.providers.offline_provider import OfflineProvider, OfflineNLP

SAMPLE_LECTURE = """--- Slide 1: Operating Systems & Virtual Memory ---
Virtual memory gives each running process the illusion of an isolated, continuous memory address space.
The Memory Management Unit (MMU) translates virtual addresses to physical RAM frames using hierarchical page tables.
If an accessed address is not currently resident in physical memory, the CPU hardware raises a page fault trap.

--- Slide 2: Page Replacement Strategies ---
When physical RAM is completely exhausted, the operating system kernel must select a victim page to evict to disk swap space.
The Least Recently Used (LRU) algorithm approximates optimal eviction by tracking temporal locality.
The Clock Page Replacement algorithm uses a circular pointer and reference bits to approximate LRU with minimal computational overhead.
"""

def test_offline_keyphrase_extraction():
    keyphrases = OfflineNLP.extract_keyphrases(SAMPLE_LECTURE, top_k=5)
    assert len(keyphrases) > 0
    joined = " ".join(keyphrases).lower()
    assert "memory" in joined or "virtual" in joined or "page" in joined

def test_offline_strategy_a_direct():
    provider = OfflineProvider()
    out = provider.generate_strategy_a_direct(SAMPLE_LECTURE, word_limit=100)
    assert len(out.summary) > 20
    assert len(out.key_concepts) > 0
    assert len(out.revision_points) > 0
    assert len(out.flashcards) > 0

def test_offline_strategy_b_structured():
    provider = OfflineProvider()
    out = provider.generate_strategy_b_structured(SAMPLE_LECTURE, word_limit=300)
    assert "### Executive Overview" in out.summary
    assert "### Key Theoretical Principles" in out.summary
    assert len(out.key_concepts) > 0
    # Verify slide references are attached
    assert any("Slide" in c.source_reference or "Page" in c.source_reference for c in out.key_concepts)
    # Verify exam questions are generated
    assert any(r.exam_question_hint for r in out.revision_points)

@pytest.mark.asyncio
async def test_offline_evaluate_judge():
    provider = OfflineProvider()
    out_a = provider.generate_strategy_a_direct(SAMPLE_LECTURE, word_limit=100)
    out_b = provider.generate_strategy_b_structured(SAMPLE_LECTURE, word_limit=300)
    judge_res = await provider.evaluate_judge(SAMPLE_LECTURE, out_a, out_b)
    assert 1 <= judge_res.score_a.faithfulness <= 5
    assert 1 <= judge_res.score_b.coverage <= 5
    assert len(judge_res.comparison_summary) > 10
