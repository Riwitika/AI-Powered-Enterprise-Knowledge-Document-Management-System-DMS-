from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.deps import get_db, get_current_active_user
from app.models.models import Comment, User

router = APIRouter()


class CommentSchema(BaseModel):
    id: int
    document_id: UUID
    user_name: str
    content: str
    parent_id: Optional[int] = None
    resolved: bool
    created_at: datetime
    replies: List['CommentSchema'] = []

    class Config:
        from_attributes = True


class CreateCommentRequest(BaseModel):
    content: str
    parent_id: Optional[int] = None


# ---- Fixed-path routes MUST come before parameterised /{document_id} routes ----

@router.post("/resolve/{comment_id}", response_model=CommentSchema)
def resolve_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    comment.resolved = not comment.resolved
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/item/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted successfully"}


# ---- Parameterised routes last ----

@router.get("/{document_id}", response_model=List[CommentSchema])
def get_comments(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    comments = db.query(Comment).filter(
        Comment.document_id == document_id,
        Comment.parent_id == None
    ).order_by(Comment.created_at.asc()).all()
    return comments


@router.post("/{document_id}", response_model=CommentSchema)
def create_comment(
    document_id: UUID,
    payload: CreateCommentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    new_comment = Comment(
        document_id=document_id,
        user_name=current_user.full_name,
        content=payload.content,
        parent_id=payload.parent_id,
        resolved=False
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment
