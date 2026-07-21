from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, ConfigDict, Field
from uuid import UUID

# ----------------- ROLE -----------------
class RoleBase(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

# ----------------- DEPARTMENT -----------------
class DepartmentBase(BaseModel):
    name: str
    parent_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int

# ----------------- USER -----------------
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    is_active: bool = True
    role_id: Optional[int] = None
    department_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role_id: Optional[int] = None
    department_id: Optional[int] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    role_id: Optional[int] = None
    department_id: Optional[int] = None
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    is_active: bool
    role_id: Optional[int]
    department_id: Optional[int]
    created_at: datetime
    
    role: Optional[RoleBase] = None
    department: Optional[DepartmentResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

# ----------------- AUTH -----------------
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    type: Optional[str] = None
    exp: Optional[int] = None

class LoginRequest(BaseModel):
    username: str  # FastAPI OAuth2 uses username for email
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role_name: Optional[str] = None
    department_id: Optional[int] = None
    invite_code: Optional[str] = None

# ----------------- DOCUMENT -----------------
class DocumentBase(BaseModel):
    name: str
    description: Optional[str] = None
    folder_id: Optional[int] = None
    category: Optional[str] = None
    access_level: str = "private"  # private | view_only | edit | department | organization | custom
    status: str = "active"
    content: Optional[str] = None
    rejection_remarks: Optional[str] = None
    is_template: bool = False
    is_favorite: bool = False
    model_config = ConfigDict(from_attributes=True)

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    folder_id: Optional[int] = None
    category: Optional[str] = None
    access_level: Optional[str] = None
    status: Optional[str] = None
    content: Optional[str] = None
    rejection_remarks: Optional[str] = None
    is_template: Optional[bool] = None
    is_favorite: Optional[bool] = None

class DocumentResponse(DocumentBase):
    id: UUID
    file_path: str
    file_type: str
    department_id: Optional[int]
    owner_id: Optional[UUID]
    current_version: int
    ai_summary: Optional[str] = None
    ai_keywords: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime
    owner: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)

# ----------------- FOLDER -----------------
class FolderBase(BaseModel):
    name: str
    parent_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class FolderCreate(FolderBase):
    pass

class FolderResponse(FolderBase):
    id: int
    created_by: Optional[UUID]
    created_at: datetime

# Recursive Folder Tree node
class FolderTreeNode(BaseModel):
    id: int
    name: str
    parent_id: Optional[int]
    created_by: Optional[UUID]
    created_at: datetime
    sub_folders: List['FolderTreeNode'] = []
    documents: List[DocumentResponse] = []
    
    model_config = ConfigDict(from_attributes=True)

# ----------------- DOCUMENT VERSION -----------------
class DocumentVersionResponse(BaseModel):
    id: int
    document_id: UUID
    version_number: int
    file_path: str
    uploaded_by: Optional[UUID]
    uploaded_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- PERMISSION -----------------
class PermissionBase(BaseModel):
    user_id: Optional[UUID] = None
    department_id: Optional[int] = None
    access_type: str  # view | edit
    model_config = ConfigDict(from_attributes=True)

class PermissionCreate(PermissionBase):
    pass

class PermissionResponse(PermissionBase):
    id: int
    document_id: UUID

class PermissionGrantRequest(BaseModel):
    user_id: Optional[UUID] = None
    department_id: Optional[int] = None
    access_type: str

# ----------------- RAG / AI -----------------
class AIQuestionRequest(BaseModel):
    question: str

class AIAnswerResponse(BaseModel):
    answer: str
    source_documents: List[DocumentResponse]

class AIConversationResponse(BaseModel):
    id: int
    user_id: UUID
    document_id: Optional[UUID]
    question: str
    answer: str
    source_document_ids: Optional[List[UUID]]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- DASHBOARD -----------------
class ActivityItem(BaseModel):
    id: str
    type: str  # "upload" | "edit" | "approval"
    document_id: UUID
    document_name: str
    user_name: str
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)

class DashboardMetrics(BaseModel):
    total_documents: int
    pending_approvals_count: int
    approved_documents_count: int
    public_documents_count: int
    total_users_count: int
    recent_uploads_count: int
    documents_by_department: Dict[str, int]
    recent_uploads: List[DocumentResponse]
    most_viewed_documents: List[DocumentResponse]
    ai_questions_asked_count: int
    active_users_count: int
    recent_activity: List[ActivityItem]
