import os
import logging
from abc import ABC, abstractmethod
from typing import List, Tuple, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from openai import OpenAI

from app.core.config import settings
from app.models.models import DocumentChunk, Document
from app.services.embeddings import embedding_service

logger = logging.getLogger(__name__)

# ----------------- LLM PROVIDER INTERFACE -----------------
class LLMProvider(ABC):
    @abstractmethod
    def generate_response(self, system_prompt: str, user_prompt: str) -> str:
        """Generate response based on a system and user prompt."""
        pass

    @abstractmethod
    def generate_summary_and_keywords(self, text: str) -> Tuple[str, List[str]]:
        """Generate summary and list of keywords for a parsed document."""
        pass


class OpenAILLMProvider(LLMProvider):
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
        self.model = settings.OPENAI_MODEL or "gpt-4o-mini"
        if not self.api_key:
            is_dev = os.getenv("ENV") == "development" or os.getenv("DEBUG", "").lower() in ("true", "1")
            if is_dev:
                logger.warning("OPENAI_API_KEY is not set. LLM provider will run in MOCK mode.")
                self.client = None
            else:
                raise ValueError("OPENAI_API_KEY is not set. A valid OpenAI API key is required in production.")
        else:
            self.client = OpenAI(api_key=self.api_key)

    def generate_response(self, system_prompt: str, user_prompt: str) -> str:
        if not self.client:
            is_dev = os.getenv("ENV") == "development" or os.getenv("DEBUG", "").lower() in ("true", "1")
            if is_dev:
                return self._mock_response(user_prompt)
            raise ValueError("LLM provider client is not initialized because OpenAI API key is missing.")
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            is_dev = os.getenv("ENV") == "development" or os.getenv("DEBUG", "").lower() in ("true", "1")
            if is_dev:
                logger.error(f"OpenAI API call failed: {e}. Falling back to mock response.")
                return self._mock_response(user_prompt)
            logger.error(f"OpenAI API call failed: {e}")
            raise e

    def generate_summary_and_keywords(self, text: str) -> Tuple[str, List[str]]:
        # Take the first 3000 words to avoid overloading context
        truncated_text = " ".join(text.split()[:3000])
        
        system_prompt = (
            "You are an AI assistant that analyzes uploaded documents. "
            "Provide a brief 2-3 sentence executive summary of the document, "
            "and a list of 5-8 relevant comma-separated tags/keywords. "
            "Return in JSON format strictly: {\"summary\": \"...\", \"keywords\": [\"tag1\", \"tag2\"]}"
        )
        user_prompt = f"Analyze the following document content:\n\n{truncated_text}"

        if not self.client:
            is_dev = os.getenv("ENV") == "development" or os.getenv("DEBUG", "").lower() in ("true", "1")
            if is_dev:
                return self._mock_summary(truncated_text)
            raise ValueError("LLM provider client is not initialized because OpenAI API key is missing.")

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            import json
            result = json.loads(response.choices[0].message.content or "{}")
            summary = result.get("summary", "No summary generated.")
            keywords = result.get("keywords", ["general"])
            return summary, keywords
        except Exception as e:
            is_dev = os.getenv("ENV") == "development" or os.getenv("DEBUG", "").lower() in ("true", "1")
            if is_dev:
                logger.error(f"OpenAI Summary failed: {e}. Falling back to mock summary.")
                return self._mock_summary(truncated_text)
            logger.error(f"OpenAI Summary failed: {e}")
            raise e

    def _mock_response(self, user_prompt: str) -> str:
        return (
            f"**[MOCK LLM RESPONSE]**\n"
            f"This is a response generated in offline mock mode since no OpenAI API key is configured. "
            f"Regarding your query: '{user_prompt[:50]}...', the retrieved document chunks indicate that "
            f"the system is correctly parsing and retrieving document context using pgvector. "
            f"Please check the sources listed below to verify content."
        )

    def _mock_summary(self, text: str) -> Tuple[str, List[str]]:
        # Simple extraction for mock
        words = text.split()
        summary = f"Mock Summary: A document containing {len(words)} words. It covers general topics related to the upload."
        keywords = ["mock", "document", "upload", "system"]
        if len(words) > 3:
            keywords.extend([w.lower().strip(",.()\"") for w in words[:4] if len(w) > 4])
        return summary, list(set(keywords))[:6]

# Global provider instance
llm_provider = OpenAILLMProvider()

# ----------------- RAG PIPELINE FUNCTIONS -----------------
def retrieve_relevant_chunks(
    db: Session,
    query: str,
    accessible_doc_ids: List[UUID],
    limit: int = 5
) -> List[DocumentChunk]:
    if not accessible_doc_ids:
        return []
        
    # Generate query embedding
    query_embedding = embedding_service.get_embedding(query)
    
    try:
        chunks = db.query(DocumentChunk).filter(
            DocumentChunk.document_id.in_(accessible_doc_ids)
        ).order_by(
            DocumentChunk.embedding.cosine_distance(query_embedding)
        ).limit(limit).all()
        return chunks
    except Exception as e:
        logger.error(f"pgvector query failed (possibly using SQLite): {e}")
        logger.info("Attempting dynamic in-memory cosine similarity math fallback...")
        try:
            import numpy as np
            import json
            
            all_chunks = db.query(DocumentChunk).filter(
                DocumentChunk.document_id.in_(accessible_doc_ids)
            ).all()
            
            def cosine_similarity(v1, v2):
                if not v1 or not v2: return 0.0
                if isinstance(v1, str):
                    try: v1 = json.loads(v1)
                    except: return 0.0
                if isinstance(v2, str):
                    try: v2 = json.loads(v2)
                    except: return 0.0
                a = np.array(v1)
                b = np.array(v2)
                dot = np.dot(a, b)
                norma = np.linalg.norm(a)
                normb = np.linalg.norm(b)
                if norma == 0 or normb == 0: return 0.0
                return float(dot / (norma * normb))
                
            chunks_with_score = []
            for c in all_chunks:
                if c.embedding:
                    score = cosine_similarity(c.embedding, query_embedding)
                    chunks_with_score.append((c, score))
            chunks_with_score.sort(key=lambda x: x[1], reverse=True)
            return [x[0] for x in chunks_with_score[:limit]]
        except Exception as py_err:
            logger.error(f"In-memory math fallback failed: {py_err}")
            return db.query(DocumentChunk).filter(
                DocumentChunk.document_id.in_(accessible_doc_ids)
            ).limit(limit).all()

def answer_query(
    db: Session,
    question: str,
    accessible_doc_ids: List[UUID],
    document_id: Optional[UUID] = None
) -> Tuple[str, List[Document]]:
    """
    RAG Pipeline:
    1. Filter accessible document IDs (already pre-filtered).
    2. Retrieve top-k relevant chunks.
    3. Generate answer using LLM.
    """
    # If a specific document is requested, narrow search down to that document only
    if document_id:
        if document_id not in accessible_doc_ids:
            return "You do not have permission to access this document.", []
        search_doc_ids = [document_id]
    else:
        search_doc_ids = accessible_doc_ids

    # Retrieve chunks
    chunks = retrieve_relevant_chunks(db, question, search_doc_ids, limit=5)
    
    if not chunks:
        return "No relevant documents found or you don't have access to them.", []

    # Compile context
    context_blocks = []
    source_docs_map = {}
    for i, chunk in enumerate(chunks):
        doc = db.query(Document).filter(Document.id == chunk.document_id).first()
        if doc:
            source_docs_map[doc.id] = doc
            context_blocks.append(
                f"[Source: {doc.name} (ID: {doc.id}) - Chunk {chunk.chunk_index}]\n{chunk.content}"
            )
            
    context_text = "\n\n".join(context_blocks)
    
    # Build prompts
    system_prompt = (
        "You are an enterprise AI Knowledge Assistant. Use the provided document context to answer the user's question. "
        "Strictly base your answer on the context. If the answer cannot be found in the context, say "
        "'I cannot find the answer in the provided documents.' Do not make up information. "
        "Cite the document name when mentioning facts."
    )
    
    user_prompt = (
        f"Context:\n{context_text}\n\n"
        f"Question: {question}\n\n"
        f"Answer:"
    )
    
    answer = llm_provider.generate_response(system_prompt, user_prompt)
    return answer, list(source_docs_map.values())
