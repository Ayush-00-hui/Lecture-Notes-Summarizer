from typing import List
from backend.app.db.schemas import PageChunk

MAX_CHUNK_WORDS = 2500
MAX_PAGES_PER_CHUNK = 8

class MapReduceChunker:
    @staticmethod
    def should_use_map_reduce(pages: List[PageChunk], total_words: int) -> bool:
        """Determines if the document requires hierarchical map-reduce chunking."""
        return len(pages) > MAX_PAGES_PER_CHUNK or total_words > MAX_CHUNK_WORDS

    @staticmethod
    def partition_pages(pages: List[PageChunk]) -> List[List[PageChunk]]:
        """
        Partitions up to ~200 pages into balanced, cohesive chunk groups.
        """
        if not pages:
            return []

        chunks: List[List[PageChunk]] = []
        current_chunk: List[PageChunk] = []
        current_words = 0

        for page in pages:
            page_words = len(page.text.split())
            
            # If adding this page exceeds chunk bounds, seal the chunk
            if current_chunk and (current_words + page_words > MAX_CHUNK_WORDS or len(current_chunk) >= MAX_PAGES_PER_CHUNK):
                chunks.append(current_chunk)
                current_chunk = [page]
                current_words = page_words
            else:
                current_chunk.append(page)
                current_words += page_words

        if current_chunk:
            chunks.append(current_chunk)

        return chunks

    @staticmethod
    def combine_chunk_texts(chunk_pages: List[PageChunk]) -> str:
        """Combines pages in a chunk into a formatted block with slide/page tags."""
        parts = []
        for p in chunk_pages:
            title_tag = f"[{p.title}]" if p.title else f"[Page {p.page_number}]"
            notes_part = f"\nNotes: {p.notes}" if p.notes else ""
            parts.append(f"{title_tag}\n{p.text}{notes_part}")
        return "\n\n".join(parts)
