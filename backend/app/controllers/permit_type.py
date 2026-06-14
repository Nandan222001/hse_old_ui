from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.permit_type import PermitTypeService
from app.schemas.permit_type import PermitTypeCreate, PermitTypeUpdate, PermitTypeResponse

router = APIRouter(prefix="/permit-types", tags=["Permit Types"])


def _svc(db: Session = Depends(get_db)) -> PermitTypeService:
    return PermitTypeService(db)


@router.get("/", response_model=list[PermitTypeResponse])
def list_permit_types(skip: int = 0, limit: int = 100, svc: PermitTypeService = Depends(_svc)):
    return svc.list(skip=skip, limit=limit)


@router.get("/{id}", response_model=PermitTypeResponse)
def get_permit_type(id: int, svc: PermitTypeService = Depends(_svc)):
    return svc.get(id)


@router.post("/", response_model=PermitTypeResponse, status_code=status.HTTP_201_CREATED)
def create_permit_type(payload: PermitTypeCreate, svc: PermitTypeService = Depends(_svc)):
    return svc.create(payload)


@router.put("/{id}", response_model=PermitTypeResponse)
def update_permit_type(id: int, payload: PermitTypeUpdate, svc: PermitTypeService = Depends(_svc)):
    return svc.update(id, payload)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_permit_type(id: int, svc: PermitTypeService = Depends(_svc)):
    svc.delete(id)
