from backend.app.services.chunker import MapReduceChunker
from backend.app.db.schemas import PageChunk

def test_chunker_small_document():
    pages = [
        PageChunk(page_number=1, title="Intro", text="Short introductory content here."),
        PageChunk(page_number=2, title="Body", text="Short body section here.")
    ]
    assert not MapReduceChunker.should_use_map_reduce(pages, 100)

def test_chunker_partition_large_document():
    # Simulate a 30-page lecture presentation
    pages = []
    for i in range(1, 31):
        pages.append(PageChunk(
            page_number=i,
            title=f"Slide {i}",
            text=f"This is the detailed content for slide {i} discussing principles and applications with around twenty words."
        ))
    
    assert MapReduceChunker.should_use_map_reduce(pages, 1000)
    batches = MapReduceChunker.partition_pages(pages)
    assert len(batches) >= 4
    
    # Check that all slides are accounted for
    total_batched_pages = sum(len(b) for b in batches)
    assert total_batched_pages == 30

def test_chunker_handles_200_pages():
    # Simulate up to 200 pages without failing
    pages = [
        PageChunk(page_number=i, title=f"Page {i}", text=f"Academic notes paragraph for page {i}.")
        for i in range(1, 201)
    ]
    batches = MapReduceChunker.partition_pages(pages)
    assert len(batches) > 10
    total_batched_pages = sum(len(b) for b in batches)
    assert total_batched_pages == 200
