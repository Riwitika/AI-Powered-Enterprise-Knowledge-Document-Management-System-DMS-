from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_active_user, get_accessible_document_ids, verify_document_access
from app.models.models import AIConversation, Document, DocumentChunk, User
from app.schemas.schemas import AIAnswerResponse, AIQuestionRequest, DocumentResponse, AIConversationResponse
from app.services.rag import answer_query
from app.services.embeddings import embedding_service

router = APIRouter()

@router.post("/ask", response_model=AIAnswerResponse)
def ask_org_wide(
    payload: AIQuestionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Org-wide RAG assistant.
    Retrieves information from all accessible documents.
    """
    print(f"[STAGE 1 - ROUTER] Reached ask_org_wide with question: '{payload.question}'", flush=True)
    allowed_ids = get_accessible_document_ids(current_user, db)
    print(f"[STAGE 1 - ROUTER] Allowed document IDs for user: {allowed_ids}", flush=True)
    if not allowed_ids:
        print("[STAGE 1 - ROUTER] No allowed documents found. Returning early.", flush=True)
        return {"answer": "No documents uploaded or you don't have access to any documents.", "source_documents": []}
        
    print("[STAGE 1 - ROUTER] Calling answer_query()...", flush=True)
    answer, source_docs = answer_query(db, payload.question, allowed_ids)
    print(f"[STAGE 4 - ROUTER RETURN] answer_query() finished. Answer: '{answer[:50]}...', Source Docs: {[doc.name for doc in source_docs]}", flush=True)
    
    # Save conversation
    conversation = AIConversation(
        user_id=current_user.id,
        document_id=None,
        question=payload.question,
        answer=answer,
        source_document_ids=[doc.id for doc in source_docs]
    )
    db.add(conversation)
    db.commit()
    
    print("[STAGE 4 - ROUTER RETURN] Serializing and returning response.", flush=True)
    return {
        "answer": answer,
        "source_documents": source_docs
    }


@router.post("/ask/{document_id}", response_model=AIAnswerResponse)
def ask_document_scoped(
    document_id: UUID,
    payload: AIQuestionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Document-scoped RAG assistant.
    Retrieves information only from the specified document.
    """
    print(f"[STAGE 1 - ROUTER] Reached ask_document_scoped for doc: {document_id} with question: '{payload.question}'", flush=True)
    # Verify permission
    verify_document_access(document_id, current_user, db, required_access="view")
    
    allowed_ids = get_accessible_document_ids(current_user, db)
    print(f"[STAGE 1 - ROUTER] Allowed document IDs for user: {allowed_ids}", flush=True)
    if document_id not in allowed_ids:
        print("[STAGE 1 - ROUTER] Document not in allowed IDs. Raising 403.", flush=True)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this document."
        )
        
    print("[STAGE 1 - ROUTER] Calling answer_query() scoped...", flush=True)
    answer, source_docs = answer_query(db, payload.question, allowed_ids, document_id=document_id)
    print(f"[STAGE 4 - ROUTER RETURN] answer_query() finished. Answer: '{answer[:50]}...', Source Docs: {[doc.name for doc in source_docs]}", flush=True)
    
    # Save conversation
    conversation = AIConversation(
        user_id=current_user.id,
        document_id=document_id,
        question=payload.question,
        answer=answer,
        source_document_ids=[doc.id for doc in source_docs]
    )
    db.add(conversation)
    db.commit()
    
    print("[STAGE 4 - ROUTER RETURN] Serializing and returning response.", flush=True)
    return {
        "answer": answer,
        "source_documents": source_docs
    }


@router.get("/related/{document_id}", response_model=List[DocumentResponse])
def get_related_documents(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Finds related documents by computing the average embedding vector of the target document's chunks,
    and then searching the nearest neighbor chunks from other documents.
    """
    # Verify permission of target document
    verify_document_access(document_id, current_user, db, required_access="view")
    
    # Get target document chunks
    target_chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).all()
    if not target_chunks:
        return []
        
    target_embeddings = [c.embedding for c in target_chunks if c.embedding is not None]
    if not target_embeddings:
        return []
        
    # Calculate average embedding
    import numpy as np
    avg_embedding = np.mean(target_embeddings, axis=0).tolist()
    
    # Get other accessible documents
    allowed_ids = get_accessible_document_ids(current_user, db)
    if document_id in allowed_ids:
        allowed_ids.remove(document_id)
        
    if not allowed_ids:
        return []
        
    # Find nearest chunks from other documents
    try:
        related_chunks = db.query(DocumentChunk).filter(
            DocumentChunk.document_id.in_(allowed_ids)
        ).order_by(
            DocumentChunk.embedding.cosine_distance(avg_embedding)
        ).limit(5).all()
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"pgvector query for related docs failed (possibly SQLite): {e}")
        try:
            import json
            all_chunks = db.query(DocumentChunk).filter(
                DocumentChunk.document_id.in_(allowed_ids)
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
                    score = cosine_similarity(c.embedding, avg_embedding)
                    chunks_with_score.append((c, score))
            chunks_with_score.sort(key=lambda x: x[1], reverse=True)
            related_chunks = [x[0] for x in chunks_with_score[:5]]
        except Exception as py_err:
            logging.getLogger(__name__).error(f"Python related docs similarity failed: {py_err}")
            related_chunks = db.query(DocumentChunk).filter(
                DocumentChunk.document_id.in_(allowed_ids)
            ).limit(5).all()
    
    # Resolve to unique documents
    related_docs_map = {}
    for rc in related_chunks:
        doc = db.query(Document).filter(Document.id == rc.document_id).first()
        if doc and doc.id not in related_docs_map:
            related_docs_map[doc.id] = doc
            
    return list(related_docs_map.values())


@router.get("/conversations", response_model=List[AIConversationResponse])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves previous RAG chat message history for the current user.
    """
    conversations = db.query(AIConversation).filter(
        AIConversation.user_id == current_user.id
    ).order_by(AIConversation.created_at.desc()).limit(30).all()
    return conversations
