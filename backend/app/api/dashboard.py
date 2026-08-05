from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.core.deps import get_db, get_current_active_user, get_accessible_document_ids
from app.models.models import Document, Department, User, AIConversation, DocumentVersion
from app.schemas.schemas import DashboardMetrics

router = APIRouter()

@router.get("", response_model=DashboardMetrics)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    allowed_ids = get_accessible_document_ids(current_user, db)
    
    total_users_count = db.query(User).count()
    active_users_count = db.query(User).filter(User.is_active == True).count()
    
    is_approver = current_user.role and current_user.role.name in ["super_admin", "admin", "department_manager"]

    if not allowed_ids:
        # Return empty metrics safely
        return {
            "total_documents": 0,
            "pending_approvals_count": 0,
            "approved_documents_count": 0,
            "public_documents_count": 0,
            "total_users_count": total_users_count,
            "recent_uploads_count": 0,
            "documents_by_department": {},
            "recent_uploads": [],
            "most_viewed_documents": [],
            "ai_questions_asked_count": 0,
            "active_users_count": active_users_count,
            "recent_activity": []
        }

    # 1. Total documents (non-archived documents that are accessible)
    total_docs = db.query(Document).filter(
        Document.status != "archived",
        Document.id.in_(allowed_ids)
    ).count()

    # 2. Pending approvals count
    if is_approver:
        pending_approvals_count = db.query(Document).filter(
            Document.status == "pending_approval"
        ).count()
    else:
        pending_approvals_count = db.query(Document).filter(
            Document.status == "pending_approval",
            Document.owner_id == current_user.id
        ).count()

    # 3. Approved Documents count (status active and accessible)
    approved_documents_count = db.query(Document).filter(
        Document.status == "active",
        Document.id.in_(allowed_ids)
    ).count()

    # 4. Public Documents count
    public_documents_count = db.query(Document).filter(
        Document.access_level == "public",
        Document.status == "active"
    ).count()

    # 5. Recent uploads count (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_uploads_count = db.query(Document).filter(
        Document.created_at >= seven_days_ago,
        Document.id.in_(allowed_ids)
    ).count()

    # 6. Documents by department
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

    # 7. Recent uploads (limit 5)
    recent_uploads = db.query(Document).options(
        joinedload(Document.owner).joinedload(User.role),
        joinedload(Document.owner).joinedload(User.department)
    ).filter(
        Document.status == "active",
        Document.id.in_(allowed_ids)
    ).order_by(Document.created_at.desc()).limit(5).all()

    # 8. Most viewed documents (limit 5)
    most_viewed_query = db.query(Document, func.count(AIConversation.id).label("convo_count"))\
        .outerjoin(AIConversation, AIConversation.document_id == Document.id)\
        .options(
            joinedload(Document.owner).joinedload(User.role),
            joinedload(Document.owner).joinedload(User.department)
        )\
        .filter(
            Document.status == "active",
            Document.id.in_(allowed_ids)
        )\
        .group_by(Document.id)\
        .order_by(func.count(AIConversation.id).desc())\
        .limit(5).all()
    most_viewed = [item[0] for item in most_viewed_query]

    # 9. AI questions count
    ai_questions_count = db.query(AIConversation).filter(AIConversation.user_id == current_user.id).count()

    # 10. Recent activity feed (uploads, edits, approvals)
    recent_activity = []
    
    # A. Recent uploads (up to 5)
    uploads = db.query(Document).options(
        joinedload(Document.owner)
    ).filter(
        Document.id.in_(allowed_ids)
    ).order_by(Document.created_at.desc()).limit(5).all()
    for doc in uploads:
        recent_activity.append({
            "id": f"upload-{doc.id}",
            "type": "upload",
            "document_id": doc.id,
            "document_name": doc.name,
            "user_name": doc.owner.full_name if doc.owner else "System",
            "timestamp": doc.created_at
        })

    # B. Recent edits/new versions (up to 5)
    edits = db.query(DocumentVersion).join(Document).options(
        joinedload(DocumentVersion.uploader),
        joinedload(DocumentVersion.document)
    ).filter(
        Document.id.in_(allowed_ids)
    ).order_by(DocumentVersion.uploaded_at.desc()).limit(5).all()
    for version in edits:
        recent_activity.append({
            "id": f"edit-{version.id}",
            "type": "edit",
            "document_id": version.document_id,
            "document_name": version.document.name,
            "user_name": version.uploader.full_name if version.uploader else "System",
            "timestamp": version.uploaded_at
        })

    # C. Recent approvals (up to 5)
    approvals = db.query(Document).options(
        joinedload(Document.owner)
    ).filter(
        Document.status == "active",
        Document.id.in_(allowed_ids)
    ).order_by(Document.updated_at.desc()).limit(5).all()
    for doc in approvals:
        recent_activity.append({
            "id": f"approval-{doc.id}",
            "type": "approval",
            "document_id": doc.id,
            "document_name": doc.name,
            "user_name": "System / Manager",
            "timestamp": doc.updated_at
        })

    # Sort recent activity by timestamp descending and limit to top 10
    recent_activity.sort(key=lambda x: x["timestamp"], reverse=True)
    recent_activity = recent_activity[:10]

    return {
        "total_documents": total_docs,
        "pending_approvals_count": pending_approvals_count,
        "approved_documents_count": approved_documents_count,
        "public_documents_count": public_documents_count,
        "total_users_count": total_users_count,
        "recent_uploads_count": recent_uploads_count,
        "documents_by_department": docs_by_dept,
        "recent_uploads": recent_uploads,
        "most_viewed_documents": most_viewed,
        "ai_questions_asked_count": ai_questions_count,
        "active_users_count": active_users_count,
        "recent_activity": recent_activity
    }
