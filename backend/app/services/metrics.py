import re
import difflib
from typing import List, Tuple
from collections import Counter
from backend.app.db.schemas import (
    StudyPackageOutput, MetricsData, UnsupportedSentence, DiffSegment
)

# Common english stopwords
STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
    "can", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't",
    "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have",
    "haven't", "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how", "i",
    "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most",
    "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other",
    "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "should",
    "shouldn't", "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves",
    "then", "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up",
    "very", "was", "wasn't", "we", "were", "weren't", "what", "when", "where", "which", "while", "who",
    "whom", "why", "with", "won't", "would", "wouldn't", "you", "your", "yours", "yourself", "yourselves"
}

def count_syllables_word(word: str) -> int:
    w = word.lower().strip()
    if not w:
        return 0
    if len(w) <= 3:
        return 1
    w = re.sub(r'(?:[^laeiouy]|ed|es|e)$', '', w)
    w = re.sub(r'^y', '', w)
    syllables = len(re.findall(r'[aeiouy]{1,2}', w))
    return max(1, syllables)

def extract_content_words(text: str) -> List[str]:
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    return [w for w in words if w not in STOPWORDS]

def calculate_readability(text: str) -> Tuple[float, float]:
    """Calculates Flesch-Kincaid Grade Level and Flesch Reading Ease."""
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    num_sentences = max(1, len(sentences))
    
    words = re.findall(r'\b\w+\b', text)
    num_words = max(1, len(words))
    
    total_syllables = sum(count_syllables_word(w) for w in words)
    
    # Flesch Reading Ease = 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
    asl = num_words / num_sentences
    asw = total_syllables / num_words
    
    reading_ease = 206.835 - (1.015 * asl) - (84.6 * asw)
    reading_ease = max(0.0, min(100.0, round(reading_ease, 1)))
    
    # Flesch-Kincaid Grade Level = 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
    grade_level = (0.39 * asl) + (11.8 * asw) - 15.59
    grade_level = max(1.0, min(18.0, round(grade_level, 1)))
    
    return grade_level, reading_ease

def calculate_concept_coverage(source_text: str, output_text: str, top_k: int = 25) -> float:
    """
    Computes concept coverage: % of top TF-IDF / key terms from the source that appear in the output.
    """
    source_words = extract_content_words(source_text)
    if not source_words:
        return 100.0
        
    freq = Counter(source_words)
    top_terms = [t for t, _ in freq.most_common(top_k)]
    if not top_terms:
        return 100.0
        
    output_lower = output_text.lower()
    found = sum(1 for term in top_terms if term in output_lower)
    
    return round((found / len(top_terms)) * 100.0, 1)

def calculate_redundancy(output_text: str) -> float:
    """
    Calculates redundancy score (0 to 100) based on n-gram and sentence pairwise token overlap.
    """
    sentences = re.split(r'[.!?]+', output_text)
    s_tokens = [set(extract_content_words(s)) for s in sentences if len(s.strip().split()) >= 4]
    
    if len(s_tokens) < 2:
        return 0.0
        
    pairwise_overlaps = []
    for i in range(len(s_tokens)):
        for j in range(i + 1, len(s_tokens)):
            union = s_tokens[i].union(s_tokens[j])
            if union:
                jaccard = len(s_tokens[i].intersection(s_tokens[j])) / len(union)
                pairwise_overlaps.append(jaccard)
                
    if not pairwise_overlaps:
        return 0.0
        
    avg_overlap = sum(pairwise_overlaps) / len(pairwise_overlaps)
    return round(min(100.0, avg_overlap * 100.0), 1)

def check_hallucinations(source_text: str, summary_text: str) -> Tuple[float, List[UnsupportedSentence]]:
    """
    Checks each sentence in summary for lexical/semantic grounding in source text.
    Flags sentences with low lexical overlap or unsupported specific assertions.
    """
    source_tokens = set(extract_content_words(source_text))
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', summary_text) if len(s.strip().split()) >= 5]
    
    if not sentences:
        return 0.0, []
        
    unsupported: List[UnsupportedSentence] = []
    
    for s in sentences:
        # Ignore markdown headers
        if s.startswith("#"):
            continue
            
        s_tokens = extract_content_words(s)
        if not s_tokens:
            continue
            
        supported_tokens = [t for t in s_tokens if t in source_tokens]
        overlap_score = len(supported_tokens) / len(s_tokens)
        
        # Sentences with < 35% supported content words are flagged as potential hallucination
        if overlap_score < 0.35:
            missing_tokens = [t for t in s_tokens if t not in source_tokens]
            unsupported.append(UnsupportedSentence(
                sentence=s,
                lexical_overlap_score=round(overlap_score, 2),
                reason=f"Low lexical grounding ({int(overlap_score*100)}%). Terms not found in source: {', '.join(missing_tokens[:4])}"
            ))
            
    risk_pct = round((len(unsupported) / max(1, len(sentences))) * 100.0, 1)
    return risk_pct, unsupported

def compute_word_diff(text_a: str, text_b: str) -> List[DiffSegment]:
    """
    Computes fine-grained word-level diff segments between Output A and Output B.
    """
    words_a = re.findall(r'\S+|\s+', text_a)
    words_b = re.findall(r'\S+|\s+', text_b)
    
    matcher = difflib.SequenceMatcher(None, words_a, words_b)
    segments: List[DiffSegment] = []
    
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == 'equal':
            segments.append(DiffSegment(
                text="".join(words_a[i1:i2]),
                type="equal"
            ))
        elif tag == 'delete':
            segments.append(DiffSegment(
                text="".join(words_a[i1:i2]),
                type="delete"
            ))
        elif tag == 'insert':
            segments.append(DiffSegment(
                text="".join(words_b[j1:j2]),
                type="insert"
            ))
        elif tag == 'replace':
            segments.append(DiffSegment(
                text="".join(words_a[i1:i2]),
                type="delete"
            ))
            segments.append(DiffSegment(
                text="".join(words_b[j1:j2]),
                type="insert"
            ))
            
    return segments

def evaluate_metrics(source_text: str, output: StudyPackageOutput, latency_ms: float, token_usage: int) -> MetricsData:
    """Computes full suite of objective NLP metrics on study package output."""
    full_output_text = output.summary + "\n" + "\n".join(f"{c.term}: {c.definition}" for c in output.key_concepts)
    
    words = full_output_text.split()
    word_count = len(words)
    char_count = len(full_output_text)
    
    input_word_count = max(1, len(source_text.split()))
    compression_ratio = round(word_count / input_word_count, 3)
    
    grade_level, reading_ease = calculate_readability(output.summary)
    coverage_pct = calculate_concept_coverage(source_text, full_output_text)
    redundancy_score = calculate_redundancy(output.summary)
    hallucination_pct, unsupported = check_hallucinations(source_text, output.summary)
    
    return MetricsData(
        word_count=word_count,
        char_count=char_count,
        compression_ratio=compression_ratio,
        latency_ms=round(latency_ms, 1),
        token_usage_estimate=token_usage,
        flesch_kincaid_grade=grade_level,
        flesch_reading_ease=reading_ease,
        concept_coverage_pct=coverage_pct,
        redundancy_score=redundancy_score,
        hallucination_risk_pct=hallucination_pct,
        unsupported_sentences=unsupported
    )
