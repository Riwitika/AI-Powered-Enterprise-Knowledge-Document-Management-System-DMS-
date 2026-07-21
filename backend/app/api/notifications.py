from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.deps import get_db, get_current_active_user
from app.models.models import Notification, User

router = APIRouter()

class NotificationSchema(BaseModel):
    id: int
    user_email: str
    title: str
    message: str
    type: Optional[str] = None
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CreateNotificationRequest(BaseModel):
    user_email: str
    title: str
    message: str
    type: Optional[str] = None

@router.get("", response_model=List[NotificationSchema])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    notifications = db.query(Notification).filter(
        Notification.user_email == current_user.email
    ).order_by(Notification.created_at.desc()).all()
    return notifications

@router.post("", response_model=NotificationSchema)
def create_notification(
    payload: CreateNotificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    new_notif = Notification(
        user_email=payload.user_email,
        title=payload.title,
        message=payload.message,
        type=payload.type,
        read=False
    )
    db.add(new_notif)
    db.commit()
    db.refresh(new_notif)
    return new_notif

@router.post("/read/{notification_id}", response_model=NotificationSchema)
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_email == current_user.email
    ).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    notif.read = True
    db.commit()
    db.refresh(notif)
    return notif

@router.post("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db.query(Notification).filter(
        Notification.user_email == current_user.email,
        Notification.read == False
    ).update({"read": True}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read"}

@router.post("/clear-all")
def clear_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db.query(Notification).filter(
        Notification.user_email == current_user.email
    ).delete(synchronize_session=False)
    db.commit()
    return {"message": "All notifications cleared"}

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_email == current_user.email
    ).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    db.delete(notif)
    db.commit()
    return {"message": "Notification deleted successfully"}
