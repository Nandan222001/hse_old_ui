from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.department import DepartmentService
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse

router = APIRouter(prefix="/departments", tags=["Departments"])


def _svc(db: Session = Depends(get_db)) -> DepartmentService:
    return DepartmentService(db)


@router.get("/", response_model=list[DepartmentResponse])
def list_departments(skip: int = 0, limit: int = 100, svc: DepartmentService = Depends(_svc)):
    return svc.list(skip=skip, limit=limit)


@router.get("/{id}", response_model=DepartmentResponse)
def get_department(id: int, svc: DepartmentService = Depends(_svc)):
    return svc.get(id)


@router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(payload: DepartmentCreate, svc: DepartmentService = Depends(_svc)):
    return svc.create(payload)


@router.put("/{id}", response_model=DepartmentResponse)
def update_department(id: int, payload: DepartmentUpdate, svc: DepartmentService = Depends(_svc)):
    return svc.update(id, payload)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(id: int, svc: DepartmentService = Depends(_svc)):
    svc.delete(id)
