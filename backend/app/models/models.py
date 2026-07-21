import uuid
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    func,
)
import os
from sqlalchemy.orm import relationship, backref

db_url = os.getenv("DATABASE_URL", "sqlite:///./kms.db")
is_sqlite = db_url.startswith("sqlite")

if is_sqlite:
    from sqlalchemy.types import TypeDecorator, String as SQLAlchemyString
    import uuid
    
    class SQLiteUUID(TypeDecorator):
        impl = SQLAlchemyString(36)
        cache_ok = True
        
        def __init__(self, *args, **kwargs):
            super().__init__()
            
        def process_bind_param(self, value, dialect):
            if value is None:
                return value
            if isinstance(value, uuid.UUID):
                return str(value)
            return value
            
        def process_result_value(self, value, dialect):
            if value is None:
                return value
            try:
                return uuid.UUID(value)
            except ValueError:
                return value
                
    UUID = SQLiteUUID
    
    import json
    from sqlalchemy.types import TypeDecorator, Text
    import uuid as py_uuid

    class SQLiteARRAY(TypeDecorator):
        impl = Text
        cache_ok = True
        
        def __init__(self, item_type=None):
            super().__init__()
            self.item_type = item_type
            
        def process_bind_param(self, value, dialect):
            if value is None:
                return value
            if isinstance(value, list):
                # Convert UUIDs to strings since UUID objects are not JSON serializable
                cleaned_value = [str(item) if isinstance(item, py_uuid.UUID) else item for item in value]
                return json.dumps(cleaned_value)
            return value
            
        def process_result_value(self, value, dialect):
            if value is None:
                return value
            if isinstance(value, str):
                try:
                    res = json.loads(value)
                    if isinstance(res, list) and self.item_type == py_uuid.UUID:
                        return [py_uuid.UUID(x) for x in res if isinstance(x, str)]
                    return res
                except ValueError:
                    return value
            return value
            
    ARRAY = SQLiteARRAY
    
    class SQLiteVector(TypeDecorator):
        impl = Text
        cache_ok = True
        
        def __init__(self, dimensions=None):
            super().__init__()
            
        def process_bind_param(self, value, dialect):
            if value is None:
                return value
            if isinstance(value, list):
                return json.dumps(value)
            return value
            
        def process_result_value(self, value, dialect):
            if value is None:
                return value
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except ValueError:
                    return value
            return value
            
    Vector = SQLiteVector
else:
    from sqlalchemy.dialects.postgresql import UUID, ARRAY
    from pgvector.sqlalchemy import Vector

from app.db.session import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)

    users = relationship("User", back_populates="role")


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    parent_id = Column(Integer, ForeignKey("departments.id"), nullable=True)

    parent = relationship("Department", remote_side=[id], backref="sub_departments")
    users = relationship("User", back_populates="department")
    documents = relationship("Document", back_populates="department")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    role = relationship("Role", back_populates="users")
    department = relationship("Department", back_populates="users")
    documents_owned = relationship("Document", back_populates="owner")
    uploaded_versions = relationship("DocumentVersion", back_populates="uploader")
    conversations = relationship("AIConversation", back_populates="user")


class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    parent_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    parent = relationship("Folder", remote_side=[id], backref="sub_folders")
    documents = relationship("Document", back_populates="folder")


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(20), nullable=False)
    category = Column(String(100), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    access_level = Column(String(30), nullable=False, default="private")
    current_version = Column(Integer, default=1)
    content = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    ai_keywords = Column(ARRAY(String), nullable=True)
    status = Column(String(20), default="active")
    rejection_remarks = Column(Text, nullable=True)
    is_template = Column(Boolean, default=False)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    folder = relationship("Folder", back_populates="documents")
    department = relationship("Department", back_populates="documents")
    owner = relationship("User", back_populates="documents_owned")
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")
    tags = relationship("DocumentTag", back_populates="document", cascade="all, delete-orphan")
    permissions = relationship("Permission", back_populates="document", cascade="all, delete-orphan")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    conversations = relationship("AIConversation", back_populates="document", cascade="all, delete-orphan")


class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    file_path = Column(String(500), nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    uploaded_at = Column(DateTime, server_default=func.now())

    document = relationship("Document", back_populates="versions")
    uploader = relationship("User", back_populates="uploaded_versions")


class DocumentTag(Base):
    __tablename__ = "document_tags"

    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True)
    tag = Column(String(50), primary_key=True)

    document = relationship("Document", back_populates="tags")


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    access_type = Column(String(30), nullable=False)  # view | edit

    document = relationship("Document", back_populates="permissions")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(384))  # pgvector embedding column
    created_at = Column(DateTime, server_default=func.now())

    document = relationship("Document", back_populates="chunks")


class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    source_document_ids = Column(ARRAY(UUID), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="conversations")
    document = relationship("Document", back_populates="conversations")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    user_name = Column(String(150), nullable=False)
    content = Column(Text, nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    replies = relationship("Comment", backref=backref("parent", remote_side=[id]), cascade="all, delete-orphan")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String(150), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

