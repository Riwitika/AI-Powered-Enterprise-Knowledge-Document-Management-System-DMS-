from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_admin, get_current_active_user
from app.models.models import Department, User
from app.schemas.schemas import DepartmentResponse, DepartmentCreate

router = APIRouter()

@router.get("", response_model=List[DepartmentResponse])
def list_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(Department).all()


@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    # Check if department with same name exists under the same parent
    existing = db.query(Department).filter(
        Department.name == payload.name,
        Department.parent_id == payload.parent_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department with this name already exists under the parent"
        )
        
    if payload.parent_id:
        parent = db.query(Department).filter(Department.id == payload.parent_id).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Parent department with ID {payload.parent_id} not found"
            )
            
    new_dept = Department(
        name=payload.name,
        parent_id=payload.parent_id
    )
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return new_dept


@router.get("/{dept_id}", response_model=DepartmentResponse)
def get_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    return dept


@router.put("/{dept_id}", response_model=DepartmentResponse)
def update_department(
    dept_id: int,
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
        
    if payload.parent_id == dept_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A department cannot be its own parent"
        )
        
    if payload.parent_id:
        parent = db.query(Department).filter(Department.id == payload.parent_id).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent department not found"
            )
            
    dept.name = payload.name
    dept.parent_id = payload.parent_id
    db.commit()
    db.refresh(dept)
    return dept


from sqlalchemy.exc import IntegrityError

@router.delete("/{dept_id}")
def delete_department(
    dept_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
        
    # Check if there are sub-departments
    has_children = db.query(Department).filter(Department.parent_id == dept_id).first()
    if has_children:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a department that has sub-departments. Delete the sub-departments first."
        )
        
    try:
        db.delete(dept)
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete department due to active constraint references in other tables."
        )
    return {"message": "Department deleted successfully"}
