import os
import logging
from abc import ABC, abstractmethod
from typing import List, Tuple, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from google import genai
from google.genai import types

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


class GeminiLLMProvider(LLMProvider):
    def __init__(self):
        self.api_key = None
        self.model_name = None
        self._configured = False

    def _ensure_configured(self):
        if not self._configured:
            self.api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
            self.model_name = settings.GEMINI_MODEL or os.getenv("GEMINI_MODEL") or "gemini-flash-latest"
            
            if not self.api_key:
                raise ValueError("GEMINI_API_KEY is not set. A valid Gemini API key is required.")
            self._configured = True

    def generate_response(self, system_prompt: str, user_prompt: str) -> str:
        self._ensure_configured()
        print(f"[STAGE 3 - GEMINI] generate_response() reached. Model: {self.model_name}", flush=True)
        try:
            config = types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.3
            )
            print("[STAGE 3 - GEMINI] Instantiating request-scoped genai.Client...", flush=True)
            with genai.Client(api_key=self.api_key) as client:
                print("[STAGE 3 - GEMINI] Calling generate_content()...", flush=True)
                response = client.models.generate_content(
                    model=self.model_name,
                    contents=user_prompt,
                    config=config
                )
            print(f"[STAGE 3 - GEMINI] generate_content() succeeded. Response: '{response.text[:50]}...'", flush=True)
            return response.text or ""
        except Exception as e:
            logger.error(f"Gemini API call failed: {e}")
            raise e

    def generate_summary_and_keywords(self, text: str) -> Tuple[str, List[str]]:
        self._ensure_configured()
        print(f"[STAGE 3 - GEMINI] generate_summary_and_keywords() reached. Model: {self.model_name}", flush=True)
        # Take the first 3000 words to avoid overloading context
        truncated_text = " ".join(text.split()[:3000])
        
        system_prompt = (
            "You are an AI assistant that analyzes uploaded documents. "
            "Provide a brief 2-3 sentence executive summary of the document, "
            "and a list of 5-8 relevant comma-separated tags/keywords. "
            "Return in JSON format strictly: {\"summary\": \"...\", \"keywords\": [\"tag1\", \"tag2\"]}"
        )
        user_prompt = f"Analyze the following document content:\n\n{truncated_text}"

        try:
            config = types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.2,
                response_mime_type="application/json"
            )
            print("[STAGE 3 - GEMINI] Instantiating request-scoped genai.Client for summary...", flush=True)
            with genai.Client(api_key=self.api_key) as client:
                print("[STAGE 3 - GEMINI] Calling generate_content() for summary...", flush=True)
                response = client.models.generate_content(
                    model=self.model_name,
                    contents=user_prompt,
                    config=config
                )
            import json
            result = json.loads(response.text or "{}")
            summary = result.get("summary", "No summary generated.")
            keywords = result.get("keywords", ["general"])
            print(f"[STAGE 3 - GEMINI] generate_summary_and_keywords() succeeded. Summary length: {len(summary)}", flush=True)
            return summary, keywords
        except Exception as e:
            logger.error(f"Gemini Summary failed: {e}")
            raise e

# Global provider instance
llm_provider = GeminiLLMProvider()

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
    print(f"[STAGE 2 - RAG] answer_query() reached with question: '{question}', scoped document_id: {document_id}", flush=True)
    # If a specific document is requested, narrow search down to that document only
    if document_id:
        if document_id not in accessible_doc_ids:
            print("[STAGE 2 - RAG] Document ID not accessible.", flush=True)
            return "You do not have permission to access this document.", []
        search_doc_ids = [document_id]
    else:
        search_doc_ids = accessible_doc_ids

    # Retrieve chunks
    print("[STAGE 2 - RAG] Retrieving relevant chunks...", flush=True)
    chunks = retrieve_relevant_chunks(db, question, search_doc_ids, limit=5)
    print(f"[STAGE 2 - RAG] Retrieved {len(chunks)} relevant chunks.", flush=True)
    
    if not chunks:
        print("[STAGE 2 - RAG] No relevant chunks found.", flush=True)
        transform_markers = (
            "return only the",
            "following selected text",
            "following text",
            "rewrite the following",
            "improve the grammar",
            "summarize the following",
            "explain the following",
            "make the following text shorter",
            "expand the following text",
            "generate document content",
        )
        if any(marker in question.lower() for marker in transform_markers):
            print("[STAGE 2 - RAG] Transform request without chunks — calling LLM directly.", flush=True)
            system_prompt = (
                "You are an enterprise document writing assistant. "
                "Follow the user's instruction exactly and return only the requested output."
            )
            try:
                answer = llm_provider.generate_response(system_prompt, question)
            except Exception as llm_err:
                logger.error(f"LLM generation failed for transform request: {llm_err}")
                answer = "The AI generation service is temporarily unavailable. Please try again shortly."
            return answer, []
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
    print(f"[STAGE 2 - RAG] Context compiled (length: {len(context_text)}).", flush=True)
    
    transform_markers = (
        "return only the",
        "following selected text",
        "following text",
        "rewrite the following",
        "improve the grammar",
        "summarize the following",
        "explain the following",
        "make the following text shorter",
        "expand the following text",
        "generate document content",
    )
    question_lower = question.lower()
    is_transform_request = any(marker in question_lower for marker in transform_markers)

    if is_transform_request:
        system_prompt = (
            "You are an enterprise document writing assistant. "
            "Follow the user's instruction exactly. "
            "When text is provided inside the instruction, transform that text directly. "
            "Return only the requested output without extra commentary unless the user asks otherwise."
        )
        user_prompt = question
        if context_text:
            user_prompt = (
                f"Reference document context (optional):\n{context_text}\n\n"
                f"Instruction:\n{question}"
            )
    else:
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
    
    print("[STAGE 2 - RAG] Calling llm_provider.generate_response()...", flush=True)
    try:
        answer = llm_provider.generate_response(system_prompt, user_prompt)
    except Exception as llm_err:
        logger.error(f"LLM generation failed in answer_query: {llm_err}")
        retrieved_names = ", ".join([doc.name for doc in source_docs_map.values()])
        answer = f"I retrieved relevant context from: {retrieved_names}. However, the AI generation service is temporarily unavailable. Please try again shortly."
    print(f"[STAGE 2 - RAG] llm_provider returned: '{answer[:50]}...'", flush=True)
    return answer, list(source_docs_map.values())
