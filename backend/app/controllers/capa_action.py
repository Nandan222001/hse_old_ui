from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.capa_action import CapaActionService
from app.schemas.capa_action import CapaActionCreate, CapaActionUpdate, CapaActionResponse

router = APIRouter(prefix="/capa-actions", tags=["Capa Actions"])


def _svc(db: Session = Depends(get_db)) -> CapaActionService:
    return CapaActionService(db)


@router.get("/", response_model=list[CapaActionResponse])
def list_capa_actions(skip: int = 0, limit: int = 100, svc: CapaActionService = Depends(_svc)):
    return svc.list(skip=skip, limit=limit)


@router.get("/{id}", response_model=CapaActionResponse)
def get_capa_action(id: int, svc: CapaActionService = Depends(_svc)):
    return svc.get(id)


@router.post("/", response_model=CapaActionResponse, status_code=status.HTTP_201_CREATED)
def create_capa_action(payload: CapaActionCreate, svc: CapaActionService = Depends(_svc)):
    return svc.create(payload)


@router.put("/{id}", response_model=CapaActionResponse)
def update_capa_action(id: int, payload: CapaActionUpdate, svc: CapaActionService = Depends(_svc)):
    return svc.update(id, payload)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_capa_action(id: int, svc: CapaActionService = Depends(_svc)):
    svc.delete(id)
