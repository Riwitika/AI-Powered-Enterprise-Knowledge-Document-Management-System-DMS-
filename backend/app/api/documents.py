import os
from typing import List, Optional
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_active_user, get_accessible_document_ids, verify_document_access
from app.models.models import Document, DocumentVersion, User, Folder
from app.schemas.schemas import DocumentResponse, DocumentUpdate, DocumentVersionResponse
from app.services.storage import storage
from app.services.document_processing import run_background_processing

router = APIRouter()

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    folder_id: Optional[int] = Form(None),
    category: Optional[str] = Form(None),
    access_level: str = Form("private"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if folder_id:
        folder = db.query(Folder).filter(Folder.id == folder_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
            
    # Read file content and save it
    contents = file.file.read()
    file.file.seek(0)
    
    file_path = storage.save_file(contents, file.filename)
    file_ext = os.path.splitext(file.filename)[1].replace(".", "").lower()
    
    doc_name = name or os.path.splitext(file.filename)[0]

    # Create document entry
    new_doc = Document(
        folder_id=folder_id,
        name=doc_name,
        description=description,
        file_path=file_path,
        file_type=file_ext or "txt",
        category=category,
        department_id=current_user.department_id,
        owner_id=current_user.id,
        access_level=access_level,
        current_version=1,
        status="active"
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
        Document.status == "active"
    ).all()
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
        if payload.folder_id:
            folder = db.query(Folder).filter(Folder.id == payload.folder_id).first()
            if not folder:
                raise HTTPException(status_code=404, detail="Folder not found")
        doc.folder_id = payload.folder_id
    if payload.category is not None:
        doc.category = payload.category
    if payload.access_level is not None:
        doc.access_level = payload.access_level
    if payload.status is not None:
        doc.status = payload.status
    if payload.content is not None:
        doc.content = payload.content
        needs_reindex = True
        
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


from sqlalchemy.exc import IntegrityError

@router.delete("/{document_id}")
def delete_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    doc = verify_document_access(document_id, current_user, db, required_access="edit")
    
    # Delete from local storage
    try:
        storage.delete_file(doc.file_path)
    except Exception:
        pass
        
    # Cascade delete is handled by ORM/Database Cascade
    try:
        db.delete(doc)
        db.commit()
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
        # Update document main row to point to new file path & version number
        doc.file_path = file_path
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
