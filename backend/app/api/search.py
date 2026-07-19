from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.deps import get_db, get_current_active_user, get_accessible_document_ids
from app.models.models import Document, DocumentTag, User
from app.schemas.schemas import DocumentResponse

router = APIRouter()

@router.get("", response_model=List[DocumentResponse])
def search_documents(
    q: Optional[str] = Query(None, description="Query text matching document name, description, or summary"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    category: Optional[str] = Query(None, description="Filter by category"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Retrieve accessible documents
    allowed_ids = get_accessible_document_ids(current_user, db)
    if not allowed_ids:
        return []

    query = db.query(Document).filter(
        Document.id.in_(allowed_ids),
        Document.status == "active"
    )

    # Apply text filter
    if q:
        # We can also join tags and filter
        q_filter = f"%{q}%"
        # Join tags
        query = query.outerjoin(DocumentTag)
        query = query.filter(
            or_(
                Document.name.ilike(q_filter),
                Document.description.ilike(q_filter),
                Document.ai_summary.ilike(q_filter),
                Document.category.ilike(q_filter),
                DocumentTag.tag.ilike(q_filter)
            )
        )

    # Apply tag filter
    if tag:
        # Check if already joined, otherwise join
        if not q:
            query = query.join(DocumentTag)
        query = query.filter(DocumentTag.tag == tag.strip().lower())

    # Apply category filter
    if category:
        query = query.filter(Document.category.ilike(category))

    # Apply department filter
    if department_id:
        query = query.filter(Document.department_id == department_id)

    # Deduplicate results if we joined tags
    results = query.distinct().all()
    return results
