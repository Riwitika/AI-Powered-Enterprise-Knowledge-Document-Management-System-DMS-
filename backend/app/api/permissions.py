from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_active_user, verify_document_access
from app.models.models import Permission, Document, User, Department
from app.schemas.schemas import PermissionResponse, PermissionGrantRequest

router = APIRouter()

@router.get("/{document_id}", response_model=List[PermissionResponse])
def list_document_permissions(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify owner or edit permission
    verify_document_access(document_id, current_user, db, required_access="edit")
    
    perms = db.query(Permission).filter(Permission.document_id == document_id).all()
    return perms


@router.post("/{document_id}/grant", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
def grant_permission(
    document_id: UUID,
    payload: PermissionGrantRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Only document owner or admins can modify permissions
    doc = verify_document_access(document_id, current_user, db, required_access="edit")
    
    # Must specify either user_id or department_id, not both/neither
    if (payload.user_id is None) == (payload.department_id is None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Specify either user_id OR department_id, not both or neither."
        )

    # Validate access_type
    if payload.access_type not in ["view", "edit"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="access_type must be either 'view' or 'edit'."
        )

    # Validate target user or department
    if payload.user_id:
        target_user = db.query(User).filter(User.id == payload.user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="Target user not found")
        # Check if already exists
        existing = db.query(Permission).filter(
            Permission.document_id == document_id,
            Permission.user_id == payload.user_id
        ).first()
    else:
        target_dept = db.query(Department).filter(Department.id == payload.department_id).first()
        if not target_dept:
            raise HTTPException(status_code=404, detail="Target department not found")
        existing = db.query(Permission).filter(
            Permission.document_id == document_id,
            Permission.department_id == payload.department_id
        ).first()

    if existing:
        # Update existing permission
        existing.access_type = payload.access_type
        db.commit()
        db.refresh(existing)
        return existing

    new_perm = Permission(
        document_id=document_id,
        user_id=payload.user_id,
        department_id=payload.department_id,
        access_type=payload.access_type
    )
    db.add(new_perm)
    db.commit()
    db.refresh(new_perm)
    return new_perm


@router.delete("/{document_id}/revoke")
def revoke_permission(
    document_id: UUID,
    user_id: Optional[UUID] = None,
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Only document owner or admins can modify permissions
    verify_document_access(document_id, current_user, db, required_access="edit")
    
    if (user_id is None) == (department_id is None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Specify either user_id OR department_id to revoke, not both or neither."
        )
        
    if user_id:
        perm = db.query(Permission).filter(
            Permission.document_id == document_id,
            Permission.user_id == user_id
        ).first()
    else:
        perm = db.query(Permission).filter(
            Permission.document_id == document_id,
            Permission.department_id == department_id
        ).first()
        
    if not perm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission mapping not found"
        )
        
    db.delete(perm)
    db.commit()
    return {"message": "Permission revoked successfully"}
