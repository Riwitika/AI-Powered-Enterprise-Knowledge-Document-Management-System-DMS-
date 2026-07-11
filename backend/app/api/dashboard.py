from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.deps import get_db, get_current_active_user, get_accessible_document_ids
from app.models.models import Document, Department, User, AIConversation
from app.schemas.schemas import DashboardMetrics

router = APIRouter()

@router.get("", response_model=DashboardMetrics)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    allowed_ids = get_accessible_document_ids(current_user, db)
    
    if not allowed_ids:
        # Return empty metrics safely
        active_users_count = db.query(User).filter(User.is_active == True).count()
        return {
            "total_documents": 0,
            "documents_by_department": {},
            "recent_uploads": [],
            "most_viewed_documents": [],
            "ai_questions_asked_count": 0,
            "active_users_count": active_users_count
        }

    # 1. Total active documents
    total_docs = db.query(Document).filter(
        Document.status == "active",
        Document.id.in_(allowed_ids)
    ).count()

    # 2. Documents by department
    dept_counts = db.query(Department.name, func.count(Document.id))\
        .join(Document, Document.department_id == Department.id)\
        .filter(
            Document.status == "active",
            Document.id.in_(allowed_ids)
        )\
        .group_by(Department.name).all()
    docs_by_dept = {name: count for name, count in dept_counts}
    
    # Check if there are active documents with no department assigned
    unassigned_count = db.query(Document).filter(
        Document.status == "active",
        Document.department_id.is_(None),
        Document.id.in_(allowed_ids)
    ).count()
    if unassigned_count > 0:
        docs_by_dept["Unassigned"] = unassigned_count

    # 3. Recent uploads (limit 5)
    recent_uploads = db.query(Document).filter(
        Document.status == "active",
        Document.id.in_(allowed_ids)
    ).order_by(Document.created_at.desc()).limit(5).all()

    # 4. Most viewed documents (limit 5)
    # Since there's no view count column, we use the documents that have the most AI conversations associated
    most_viewed_query = db.query(Document, func.count(AIConversation.id).label("convo_count"))\
        .join(AIConversation, AIConversation.document_id == Document.id, isouter=True)\
        .filter(
            Document.status == "active",
            Document.id.in_(allowed_ids)
        )\
        .group_by(Document.id)\
        .order_by(func.count(AIConversation.id).desc())\
        .limit(5).all()
    most_viewed = [item[0] for item in most_viewed_query]

    # 5. AI questions count
    ai_questions_count = db.query(AIConversation).filter(AIConversation.user_id == current_user.id).count()

    # 6. Active users count
    active_users_count = db.query(User).filter(User.is_active == True).count()

    return {
        "total_documents": total_docs,
        "documents_by_department": docs_by_dept,
        "recent_uploads": recent_uploads,
        "most_viewed_documents": most_viewed,
        "ai_questions_asked_count": ai_questions_count,
        "active_users_count": active_users_count
    }
