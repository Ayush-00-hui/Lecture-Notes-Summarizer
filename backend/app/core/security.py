import re
from typing import Tuple

# Disallowed prompt injection patterns that attempt to escape data boundaries
PROMPT_INJECTION_PATTERNS = [
    r"(?i)\bignore (all )?previous instructions\b",
    r"(?i)\bdisregard (all )?previous commands\b",
    r"(?i)\byou are now\b",
    r"(?i)\bsystem prompt\b",
    r"(?i)\bjailbreak\b",
    r"(?i)\bdeveloper mode\b",
    r"(?i)\boutput the above instructions\b",
    r"(?i)\breveal your system instructions\b",
    r"(?i)\bDAN mode\b",
]

def sanitize_document_text(text: str) -> Tuple[str, bool]:
    """
    Sanitizes raw document text to prevent prompt injection and abnormal characters.
    Ensures text is treated strictly as data payload.
    Returns (sanitized_text, contains_suspicious_patterns).
    """
    if not text:
        return "", False
        
    # Replace null bytes and non-printable control characters (except tabs and newlines)
    cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    
    # Check for prompt injection markers
    suspicious = False
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, cleaned):
            suspicious = True
            # Neutralize potential delimiter breaks or escape commands
            cleaned = re.sub(pattern, "[FILTERED_INSTRUCTION_ATTEMPT]", cleaned)
            
    # Escape any XML/custom data delimiters to prevent breaking out of <lecture_notes>...</lecture_notes>
    cleaned = cleaned.replace("</lecture_notes>", "&lt;/lecture_notes&gt;")
    cleaned = cleaned.replace("<lecture_notes>", "&lt;lecture_notes&gt;")
    
    # Normalize excess whitespace (more than 3 consecutive newlines)
    cleaned = re.sub(r'\n{4,}', '\n\n\n', cleaned)
    
    return cleaned.strip(), suspicious

def format_data_boundary(text: str) -> str:
    """
    Wraps sanitized document text in strict XML-style data boundary tags.
    """
    sanitized, _ = sanitize_document_text(text)
    return f"<lecture_notes>\n{sanitized}\n</lecture_notes>"
