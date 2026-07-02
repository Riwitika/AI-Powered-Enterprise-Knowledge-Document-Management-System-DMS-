from typing import List

def chunk_text(text: str, chunk_size_words: int = 400, overlap_words: int = 50) -> List[str]:
    """
    Split text into chunks of size chunk_size_words with overlap_words overlapping.
    Using words is a simple and reliable proxy for token count in Python.
    400 words is roughly 500 tokens. 50 words is roughly 65 tokens.
    """
    words = text.split()
    if not words:
        return []
        
    chunks = []
    i = 0
    while i < len(words):
        # Slice words for the current chunk
        chunk_slice = words[i:i + chunk_size_words]
        chunks.append(" ".join(chunk_slice))
        
        # Advance the window
        i += (chunk_size_words - overlap_words)
        
        # Guard against infinite loops or tiny slices at the end
        if i >= len(words) or (len(words) - i) <= overlap_words:
            # If remaining words are less than overlap, add them and stop
            if i < len(words):
                last_slice = words[max(0, len(words) - chunk_size_words):]
                chunks.append(" ".join(last_slice))
            break
            
    # Deduplicate empty chunks
    return [c for c in chunks if c.strip()]
