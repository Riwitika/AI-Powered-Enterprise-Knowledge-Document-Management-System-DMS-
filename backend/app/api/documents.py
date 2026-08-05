import os
from typing import List, Optional
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.deps import get_db, get_current_active_user, get_accessible_document_ids, verify_document_access
from app.models.models import Document, DocumentVersion, User, Folder
from app.schemas.schemas import DocumentResponse, DocumentUpdate, DocumentVersionResponse
from app.services.storage import storage
from app.services.document_processing import run_background_processing
from app.services.audit import log_audit

router = APIRouter()

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    folder_id: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    access_level: str = Form("private"),
    is_template: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    target_folder_id = None
    if folder_id is not None and folder_id != "" and folder_id != "null" and folder_id != "0":
        try:
            target_folder_id = int(folder_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid folder_id format. Must be an integer.")

    if target_folder_id:
        folder = db.query(Folder).filter(Folder.id == target_folder_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
            
    # Read file content and save it
    contents = file.file.read()
    file.file.seek(0)
    
    if not contents or len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )
        
    from app.core.config import settings
    max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(contents) > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )
        
    file_ext = os.path.splitext(file.filename)[1].replace(".", "").lower()
    allowed_extensions = {"pdf", "docx", "xlsx", "pptx", "txt"}
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '.{file_ext}'. Allowed types: pdf, docx, xlsx, pptx, txt."
        )
        
    doc_name = name or os.path.splitext(file.filename)[0]
    
    # Check duplicate document name in same folder context
    existing_doc = db.query(Document).filter(
        Document.folder_id == target_folder_id,
        Document.name == doc_name,
        Document.status != "archived"
    ).first()
    if existing_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A document named '{doc_name}' already exists in this folder."
        )
        
    file_path = storage.save_file(contents, file.filename)

    # Create document entry
    new_doc = Document(
        folder_id=target_folder_id,
        name=doc_name,
        description=description,
        file_path=file_path,
        file_type=file_ext or "txt",
        category=category,
        department_id=current_user.department_id,
        owner_id=current_user.id,
        access_level=access_level,
        current_version=1,
        status="active" if is_template else "pending",
        is_template=is_template
    )

    try:
        db.add(new_doc)
        db.flush()
        
        # Save the first version
        first_version = DocumentVersion(
            document_id=new_doc.id,
            version_number=1,
            file_path=file_path,
            uploaded_by=current_user.id
        )
        db.add(first_version)
        db.commit()
        db.refresh(new_doc)
    except Exception as e:
        db.rollback()
        try:
            storage.delete_file(file_path)
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save document record: {str(e)}"
        )
    
    # Trigger background text extraction, embedding & summary
    background_tasks.add_task(run_background_processing, new_doc.id)
    
    return new_doc


@router.get("", response_model=List[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    allowed_ids = get_accessible_document_ids(current_user, db)
    docs = db.query(Document).filter(
        Document.id.in_(allowed_ids),
        or_(
            Document.status == "active",
            Document.owner_id == current_user.id
        )
    ).all()
    return docs


@router.get("/pending", response_model=List[DocumentResponse])
def get_pending_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not current_user.role or current_user.role.name not in ["super_admin", "admin", "department_manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    docs = db.query(Document).filter(Document.status == "pending_approval").all()
    return docs

@router.get("/templates", response_model=List[DocumentResponse])
def get_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    docs = db.query(Document).filter(Document.is_template == True).all()
    return docs


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify permission
    doc = verify_document_access(document_id, current_user, db, required_access="view")
    return doc


@router.get("/{document_id}/download")
def download_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    doc = verify_document_access(document_id, current_user, db, required_access="view")
    
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Physical file not found on disk")
        
    # We can determine the media type or let FileResponse handle it
    return FileResponse(
        path=doc.file_path,
        filename=f"{doc.name}.{doc.file_type}",
        media_type="application/octet-stream"
    )


@router.put("/{document_id}", response_model=DocumentResponse)
def update_document_metadata(
    document_id: UUID,
    payload: DocumentUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    doc = verify_document_access(document_id, current_user, db, required_access="edit")
    
    needs_reindex = False
    
    if payload.name is not None:
        doc.name = payload.name
    if payload.description is not None:
        doc.description = payload.description
    if payload.folder_id is not None:
        target_folder_id = payload.folder_id
        if target_folder_id == 0 or target_folder_id == "":
            target_folder_id = None

        if target_folder_id:
            folder = db.query(Folder).filter(Folder.id == target_folder_id).first()
            if not folder:
                raise HTTPException(status_code=404, detail="Folder not found")
        doc.folder_id = target_folder_id
    if payload.category is not None:
        doc.category = payload.category
    if payload.access_level is not None:
        doc.access_level = payload.access_level
    if payload.status is not None:
        doc.status = payload.status
    if payload.content is not None:
        doc.content = payload.content
        needs_reindex = True
    if payload.rejection_remarks is not None:
        doc.rejection_remarks = payload.rejection_remarks
    if payload.is_template is not None:
        doc.is_template = payload.is_template
        
    db.commit()
    db.refresh(doc)
    
    if needs_reindex:
        background_tasks.add_task(run_background_processing, doc.id)
        
    return doc


@router.post("/{document_id}/archive", response_model=DocumentResponse)
def archive_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    doc = verify_document_access(document_id, current_user, db, required_access="edit")
    doc.status = "archived"
    db.commit()
    db.refresh(doc)
    return doc


@router.post("/{document_id}/restore", response_model=DocumentResponse)
def restore_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    doc = verify_document_access(document_id, current_user, db, required_access="edit")
    doc.status = "active"
    db.commit()
    db.refresh(doc)
    return doc


@router.post("/{document_id}/favorite", response_model=DocumentResponse)
def toggle_favorite(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    doc = verify_document_access(document_id, current_user, db, required_access="view")
    doc.is_favorite = not doc.is_favorite
    db.commit()
    db.refresh(doc)
    return doc


from sqlalchemy.exc import IntegrityError

@router.delete("/{document_id}")
def delete_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    doc = verify_document_access(document_id, current_user, db, required_access="edit")
    
    # Delete all version files from local storage to prevent file leaks
    try:
        versions = db.query(DocumentVersion).filter(DocumentVersion.document_id == doc.id).all()
        for v in versions:
            storage.delete_file(v.file_path)
    except Exception:
        pass
        
    # Ensure current main path is deleted as well
    try:
        storage.delete_file(doc.file_path)
    except Exception:
        pass
        
    # Cascade delete is handled by ORM/Database Cascade
    try:
        db.delete(doc)
        db.commit()
        log_audit("document_deletion", current_user.email, f"User deleted document: {doc.name} (ID: {doc.id})")
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete document due to active database constraints."
        )
    return {"message": "Document deleted successfully"}


@router.get("/{document_id}/versions", response_model=List[DocumentVersionResponse])
def get_document_versions(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify view permission
    verify_document_access(document_id, current_user, db, required_access="view")
    versions = db.query(DocumentVersion).filter(DocumentVersion.document_id == document_id).order_by(DocumentVersion.version_number.desc()).all()
    return versions


@router.post("/{document_id}/version", response_model=DocumentResponse)
def upload_new_version(
    document_id: UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check edit permission
    doc = verify_document_access(document_id, current_user, db, required_access="edit")
    
    # Save file
    contents = file.file.read()
    file.file.seek(0)
    
    if not contents or len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )
        
    from app.core.config import settings
    max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(contents) > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )
        
    file_ext = os.path.splitext(file.filename)[1].replace(".", "").lower()
    allowed_extensions = {"pdf", "docx", "xlsx", "pptx", "txt"}
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '.{file_ext}'. Allowed types: pdf, docx, xlsx, pptx, txt."
        )
        
    file_path = storage.save_file(contents, file.filename)
    new_version_num = doc.current_version + 1
    
    # Create document version row
    new_version = DocumentVersion(
        document_id=doc.id,
        version_number=new_version_num,
        file_path=file_path,
        uploaded_by=current_user.id
    )

    try:
        db.add(new_version)
        # Update document main row to point to new file path, extension & version number
        file_ext = os.path.splitext(file.filename)[1].replace(".", "").lower()
        doc.file_path = file_path
        doc.file_type = file_ext or "txt"
        doc.current_version = new_version_num
        db.commit()
        db.refresh(doc)
    except Exception as e:
        db.rollback()
        try:
            storage.delete_file(file_path)
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save new document version: {str(e)}"
        )
    
    # Re-run extraction + chunking + embeddings in background for new version
    background_tasks.add_task(run_background_processing, doc.id)
    
    return doc


# ----------------- NEW WORKFLOWS & PUBLIC ROUTES -----------------



@router.get("/public/{document_id}", response_model=DocumentResponse)
def get_public_document(
    document_id: UUID,
    db: Session = Depends(get_db)
):
    doc = verify_document_access(document_id, None, db, required_access="view")
    return doc

@router.get("/public/{document_id}/download")
def download_public_document(
    document_id: UUID,
    db: Session = Depends(get_db)
):
    doc = verify_document_access(document_id, None, db, required_access="view")
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Physical file not found on disk")
    return FileResponse(
        path=doc.file_path,
        filename=f"{doc.name}.{doc.file_type}",
        media_type="application/octet-stream"
    )

@router.post("/{document_id}/submit-approval", response_model=DocumentResponse)
def submit_for_approval(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    doc = verify_document_access(document_id, current_user, db, required_access="edit")
    if doc.owner_id != current_user.id and (not current_user.role or current_user.role.name not in ["super_admin", "admin"]):
        raise HTTPException(status_code=403, detail="Only the owner can submit for approval")
    doc.status = "pending_approval"
    db.commit()
    db.refresh(doc)
    return doc

from pydantic import BaseModel
class RejectionPayload(BaseModel):
    rejection_remarks: Optional[str] = None

@router.post("/{document_id}/approve", response_model=DocumentResponse)
def approve_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not current_user.role or current_user.role.name not in ["super_admin", "admin", "department_manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.status = "active"
    doc.rejection_remarks = None
    db.commit()
    db.refresh(doc)
    
    log_audit("document_approval", current_user.email, f"Manager approved document: {doc.name} (ID: {doc.id})")
    
    return doc

@router.post("/{document_id}/reject", response_model=DocumentResponse)
def reject_document(
    document_id: UUID,
    payload: RejectionPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not current_user.role or current_user.role.name not in ["super_admin", "admin", "department_manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.status = "rejected"
    doc.rejection_remarks = payload.rejection_remarks
    db.commit()
    db.refresh(doc)
    
    log_audit("document_rejection", current_user.email, f"Manager rejected document: {doc.name} (ID: {doc.id}) with remarks: {payload.rejection_remarks}")
    
    return doc


@router.get("/{document_id}/versions/{version_number}/view")
def view_document_version(
    document_id: UUID,
    version_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    from app.services.extraction import extract_document_text
    doc = verify_document_access(document_id, current_user, db, required_access="view")
    version = db.query(DocumentVersion).filter(
        DocumentVersion.document_id == document_id,
        DocumentVersion.version_number == version_number
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    if not os.path.exists(version.file_path):
        # Fallback if file doesn't exist (e.g. mock seed files)
        return {"content": doc.content or "No content found.", "version_number": version_number, "name": doc.name}
    file_ext = os.path.splitext(version.file_path)[1].replace(".", "").lower() or doc.file_type
    content = extract_document_text(version.file_path, file_ext)
    return {"content": content, "version_number": version_number, "name": doc.name}
