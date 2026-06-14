from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.employee import EmployeeService
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse

router = APIRouter(prefix="/employees", tags=["Employees"])


def _svc(db: Session = Depends(get_db)) -> EmployeeService:
    return EmployeeService(db)


@router.get("/", response_model=list[EmployeeResponse])
def list_employees(skip: int = 0, limit: int = 100, svc: EmployeeService = Depends(_svc)):
    return svc.list(skip=skip, limit=limit)


@router.get("/{id}", response_model=EmployeeResponse)
def get_employee(id: int, svc: EmployeeService = Depends(_svc)):
    return svc.get(id)


@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(payload: EmployeeCreate, svc: EmployeeService = Depends(_svc)):
    return svc.create(payload)


@router.put("/{id}", response_model=EmployeeResponse)
def update_employee(id: int, payload: EmployeeUpdate, svc: EmployeeService = Depends(_svc)):
    return svc.update(id, payload)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(id: int, svc: EmployeeService = Depends(_svc)):
    svc.delete(id)
