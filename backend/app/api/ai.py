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
    allowed_ids = get_accessible_document_ids(current_user, db)
    if not allowed_ids:
        return {"answer": "No documents uploaded or you don't have access to any documents.", "source_documents": []}
        
    answer, source_docs = answer_query(db, payload.question, allowed_ids)
    
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
    # Verify permission
    verify_document_access(document_id, current_user, db, required_access="view")
    
    allowed_ids = get_accessible_document_ids(current_user, db)
    if document_id not in allowed_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this document."
        )
        
    answer, source_docs = answer_query(db, payload.question, allowed_ids, document_id=document_id)
    
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
    related_chunks = db.query(DocumentChunk).filter(
        DocumentChunk.document_id.in_(allowed_ids)
    ).order_by(
        DocumentChunk.embedding.cosine_distance(avg_embedding)
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
