from backend.app.services.metrics import (
    calculate_readability, calculate_concept_coverage, calculate_redundancy,
    check_hallucinations, compute_word_diff, evaluate_metrics
)
from backend.app.db.schemas import StudyPackageOutput, KeyConcept

def test_readability_metrics():
    text = "The quick brown fox jumps over the lazy dog. Scientific principles dictate empirical verification."
    grade, ease = calculate_readability(text)
    assert 1.0 <= grade <= 18.0
    assert 0.0 <= ease <= 100.0

def test_concept_coverage():
    source = "Convolutional neural networks apply kernel matrices to extract spatial hierarchical image features."
    summary_good = "Convolutional neural networks utilize kernels to extract spatial image features."
    summary_poor = "Cooking pasta requires boiling salted water on a high flame."
    
    cov_high = calculate_concept_coverage(source, summary_good)
    cov_low = calculate_concept_coverage(source, summary_poor)
    assert cov_high > cov_low
    assert cov_high >= 50.0

def test_redundancy_score():
    repeated_text = "Neural networks learn weights. Neural networks learn weights. Neural networks learn weights."
    diverse_text = "Neural networks compute linear matrix transformations. Backpropagation calculates loss gradients via calculus. Overfitting is mitigated by dropout."
    
    red_high = calculate_redundancy(repeated_text)
    red_low = calculate_redundancy(diverse_text)
    assert red_high >= red_low

def test_hallucination_detection():
    source = "Raft uses leader election and log replication for distributed consensus in server clusters."
    grounded = "Raft provides distributed consensus via leader election and log replication."
    hallucinated = "Quantum teleportation utilizes entangled qubits across Martian communication relays."
    
    risk_grounded, unsupp_grounded = check_hallucinations(source, grounded)
    risk_hallucinated, unsupp_hallucinated = check_hallucinations(source, hallucinated)
    
    assert risk_hallucinated > risk_grounded
    assert len(unsupp_hallucinated) > 0

def test_compute_word_diff():
    text_a = "The model trained quickly on GPU."
    text_b = "The neural model trained rapidly on TPU cluster."
    segments = compute_word_diff(text_a, text_b)
    assert len(segments) > 1
    types = {s.type for s in segments}
    assert "equal" in types
    assert "insert" in types or "delete" in types

def test_evaluate_metrics_full():
    source = "Support vector machines find optimal hyperplanes maximizing margin between distinct binary classes."
    out = StudyPackageOutput(
        summary="Support vector machines optimize hyperplanes to maximize class margins.",
        key_concepts=[
            KeyConcept(term="Hyperplane", definition="Decision boundary separating classes", importance="High", source_reference="Page 1")
        ]
    )
    metrics = evaluate_metrics(source, out, latency_ms=120.0, token_usage=45)
    assert metrics.word_count > 0
    assert metrics.compression_ratio > 0
    assert metrics.latency_ms == 120.0
    assert metrics.concept_coverage_pct > 30.0
