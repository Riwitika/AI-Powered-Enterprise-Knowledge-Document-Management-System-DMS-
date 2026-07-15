from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_active_user, get_accessible_document_ids
from app.models.models import Folder, Document, User
from app.schemas.schemas import FolderResponse, FolderCreate, FolderTreeNode, DocumentResponse

router = APIRouter()

@router.get("", response_model=List[FolderResponse])
def list_folders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(Folder).all()


from datetime import datetime, timezone

@router.get("/tree", response_model=List[FolderTreeNode])
def get_tree(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get the full folder tree recursively, with documents inside each folder,
    pre-filtered by the user's document permissions.
    """
    # Get all folders
    all_folders = db.query(Folder).all()
    
    # Get all active documents the user is allowed to access
    allowed_doc_ids = get_accessible_document_ids(current_user, db)
    
    if not allowed_doc_ids:
        # Create virtual Workspace Root node with empty folders/docs
        workspace_root = FolderTreeNode(
            id=0,
            name="Workspace Root",
            parent_id=None,
            created_by=None,
            created_at=datetime.now(timezone.utc),
            sub_folders=[],
            documents=[]
        )
        return [workspace_root]
        
    allowed_docs = db.query(Document).filter(
        Document.id.in_(allowed_doc_ids)
    ).all()
    
    # Map folders by ID
    folder_nodes: Dict[int, FolderTreeNode] = {}
    for folder in all_folders:
        folder_nodes[folder.id] = FolderTreeNode(
            id=folder.id,
            name=folder.name,
            parent_id=folder.parent_id,
            created_by=folder.created_by,
            created_at=folder.created_at,
            sub_folders=[],
            documents=[]
        )
        
    # Map documents to folders
    for doc in allowed_docs:
        if doc.folder_id in folder_nodes:
            folder_nodes[doc.folder_id].documents.append(
                DocumentResponse.model_validate(doc)
            )

    # Build hierarchy
    root_nodes: List[FolderTreeNode] = []
    for f_id, node in folder_nodes.items():
        if node.parent_id is None:
            root_nodes.append(node)
        else:
            parent_node = folder_nodes.get(node.parent_id)
            if parent_node:
                parent_node.sub_folders.append(node)

    # Gather root-level documents (folder_id is None or not in folder_nodes)
    root_documents = []
    for doc in allowed_docs:
        if doc.folder_id is None or doc.folder_id not in folder_nodes:
            root_documents.append(DocumentResponse.model_validate(doc))

    # Create virtual Workspace Root node
    workspace_root = FolderTreeNode(
        id=0,
        name="Workspace Root",
        parent_id=None,
        created_by=None,
        created_at=datetime.now(timezone.utc),
        sub_folders=root_nodes,
        documents=root_documents
    )
                
    return [workspace_root]


@router.post("", response_model=FolderResponse, status_code=status.HTTP_201_CREATED)
def create_folder(
    payload: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    parent_id = payload.parent_id
    if parent_id == 0 or parent_id == "":
        parent_id = None

    if parent_id:
        parent = db.query(Folder).filter(Folder.id == parent_id).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Parent folder with ID {parent_id} not found"
            )
            
    new_folder = Folder(
        name=payload.name,
        parent_id=parent_id,
        created_by=current_user.id
    )
    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)
    return new_folder


@router.get("/{folder_id}", response_model=FolderResponse)
def get_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
    return folder


@router.put("/{folder_id}", response_model=FolderResponse)
def update_folder(
    folder_id: int,
    payload: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
        
    parent_id = payload.parent_id
    if parent_id == 0 or parent_id == "":
        parent_id = None

    if parent_id == folder_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A folder cannot be its own parent"
        )

    # Prevent cycle: check if parent_id is a descendant of folder_id
    if parent_id:
        current_parent_id = parent_id
        while current_parent_id:
            if current_parent_id == folder_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot move a folder into one of its descendants"
                )
            p_folder = db.query(Folder).filter(Folder.id == current_parent_id).first()
            current_parent_id = p_folder.parent_id if p_folder else None

        # Check parent folder existence
        parent = db.query(Folder).filter(Folder.id == parent_id).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent folder not found"
            )
            
    folder.name = payload.name
    folder.parent_id = parent_id
    db.commit()
    db.refresh(folder)
    return folder


from sqlalchemy.exc import IntegrityError

@router.delete("/{folder_id}")
def delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
        
    # Check for child sub-folders
    has_sub = db.query(Folder).filter(Folder.parent_id == folder_id).first()
    if has_sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete folder containing subfolders"
        )
        
    # Check for any documents in the folder
    has_docs = db.query(Document).filter(
        Document.folder_id == folder_id
    ).first()
    if has_docs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete folder containing documents"
        )
        
    try:
        db.delete(folder)
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete folder due to active database constraint references."
        )
    return {"message": "Folder deleted successfully"}
