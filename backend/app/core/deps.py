from typing import Generator, List, Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.models import User, Document, Permission, Role
from app.core.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_token(token)
    if not payload:
        raise credentials_exception
        
    user_id: str = payload.get("sub")
    token_type: str = payload.get("type")
    
    if user_id is None or token_type != "access":
        raise credentials_exception
        
    try:
        user = db.query(User).filter(User.id == UUID(user_id)).first()
    except ValueError:
        raise credentials_exception
        
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

def get_current_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    if not current_user.role or current_user.role.name not in ["super_admin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges"
        )
    return current_user

def get_accessible_document_ids(user: User, db: Session) -> List[UUID]:
    """
    Optimized: Returns the list of document UUIDs the user is allowed to view
    in a single database query using outer joins.
    """
    if user.role and user.role.name in ["super_admin", "admin"]:
        return [d[0] for d in db.query(Document.id).all()]

    # Base access level conditions
    conditions = [
        Document.owner_id == user.id,
        Document.access_level.in_(["organization", "view_only", "edit", "public"])
    ]
    
    if user.department_id:
        conditions.append(
            and_(Document.access_level == "department", Document.department_id == user.department_id)
        )
        
    # Join with Permission table for custom user/dept sharing grants
    query = db.query(Document.id).outerjoin(
        Permission, Permission.document_id == Document.id
    )
    
    custom_conditions = [Permission.user_id == user.id]
    if user.department_id:
        custom_conditions.append(Permission.department_id == user.department_id)
        
    conditions.append(
        and_(Permission.id.is_not(None), or_(*custom_conditions))
    )
    
    # Filter based on document status and user role permissions
    is_manager = user.role and user.role.name == "department_manager"
    status_conditions = [
        Document.status == "active",
        Document.owner_id == user.id
    ]
    if is_manager:
        status_conditions.append(Document.status == "pending_approval")
        
    query = query.filter(or_(*conditions)).filter(or_(*status_conditions))
    
    return [r[0] for r in query.distinct().all()]

def verify_document_access(
    document_id: UUID,
    user: Optional[User],
    db: Session,
    required_access: str = "view"  # "view" or "edit"
) -> Document:
    """
    Checks if the user has access to a document.
    Returns the Document model if access is granted, otherwise raises 403 or 404.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
        
    # Public access check first
    if doc.access_level == "public" and required_access == "view":
        if doc.status == "active":
            return doc

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
        
    # Admins can access everything
    if user.role and user.role.name in ["super_admin", "admin"]:
        return doc
        
    # Owner can access everything
    if doc.owner_id == user.id:
        return doc

    # Filter by approval workflow status
    if doc.status in ["pending", "pending_approval", "rejected"]:
        is_manager = user.role and user.role.name == "department_manager"
        if doc.status == "pending_approval" and is_manager:
            return doc
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Document is not approved or you do not have permission to access it"
        )

    # If document is archived, only admins and owners can see it
    if doc.status == "archived":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Document is archived"
        )

    # Edit access check
    if required_access == "edit":
        # Check if the access level is 'edit' (anyone in organization can edit)
        if doc.access_level == "edit":
            return doc
            
        # Check custom edit permissions
        edit_conditions = [Permission.user_id == user.id]
        if user.department_id:
            edit_conditions.append(Permission.department_id == user.department_id)

        custom_edit = db.query(Permission).filter(
            Permission.document_id == doc.id,
            Permission.access_type == "edit",
            or_(*edit_conditions)
        ).first()
        if custom_edit:
            return doc
            
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have edit permission for this document"
        )

    # View access check (required_access == "view")
    if doc.access_level in ["organization", "view_only", "edit", "public"]:
        return doc
        
    if doc.access_level == "department" and user.department_id == doc.department_id:
        return doc

    # Check custom permissions (either view or edit is fine for viewing)
    view_conditions = [Permission.user_id == user.id]
    if user.department_id:
        view_conditions.append(Permission.department_id == user.department_id)

    custom_permission = db.query(Permission).filter(
        Permission.document_id == doc.id,
        or_(*view_conditions)
    ).first()
    if custom_permission:
        return doc

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have access permission for this document"
    )
