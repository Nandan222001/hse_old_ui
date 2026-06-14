from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.permit_to_work import PermitToWorkService
from app.schemas.permit_to_work import PermitToWorkCreate, PermitToWorkUpdate, PermitToWorkResponse

router = APIRouter(prefix="/permit-to-works", tags=["Permit To Works"])


def _svc(db: Session = Depends(get_db)) -> PermitToWorkService:
    return PermitToWorkService(db)


@router.get("/", response_model=list[PermitToWorkResponse])
def list_permit_to_works(skip: int = 0, limit: int = 100, svc: PermitToWorkService = Depends(_svc)):
    return svc.list(skip=skip, limit=limit)


@router.get("/{id}", response_model=PermitToWorkResponse)
def get_permit_to_work(id: int, svc: PermitToWorkService = Depends(_svc)):
    return svc.get(id)


@router.post("/", response_model=PermitToWorkResponse, status_code=status.HTTP_201_CREATED)
def create_permit_to_work(payload: PermitToWorkCreate, svc: PermitToWorkService = Depends(_svc)):
    return svc.create(payload)


@router.put("/{id}", response_model=PermitToWorkResponse)
def update_permit_to_work(id: int, payload: PermitToWorkUpdate, svc: PermitToWorkService = Depends(_svc)):
    return svc.update(id, payload)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_permit_to_work(id: int, svc: PermitToWorkService = Depends(_svc)):
    svc.delete(id)
