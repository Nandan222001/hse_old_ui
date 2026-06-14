from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.role import RoleService
from app.schemas.role import RoleCreate, RoleUpdate, RoleResponse

router = APIRouter(prefix="/roles", tags=["Roles"])


def _svc(db: Session = Depends(get_db)) -> RoleService:
    return RoleService(db)


@router.get("/", response_model=list[RoleResponse])
def list_roles(skip: int = 0, limit: int = 100, svc: RoleService = Depends(_svc)):
    return svc.list(skip=skip, limit=limit)


@router.get("/{id}", response_model=RoleResponse)
def get_role(id: int, svc: RoleService = Depends(_svc)):
    return svc.get(id)


@router.post("/", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(payload: RoleCreate, svc: RoleService = Depends(_svc)):
    return svc.create(payload)


@router.put("/{id}", response_model=RoleResponse)
def update_role(id: int, payload: RoleUpdate, svc: RoleService = Depends(_svc)):
    return svc.update(id, payload)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(id: int, svc: RoleService = Depends(_svc)):
    svc.delete(id)
