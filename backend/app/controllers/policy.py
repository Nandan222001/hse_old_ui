from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.policy import PolicyService
from app.schemas.policy import PolicyCreate, PolicyUpdate, PolicyResponse

router = APIRouter(prefix="/policys", tags=["Policys"])


def _svc(db: Session = Depends(get_db)) -> PolicyService:
    return PolicyService(db)


@router.get("/", response_model=list[PolicyResponse])
def list_policys(skip: int = 0, limit: int = 100, svc: PolicyService = Depends(_svc)):
    return svc.list(skip=skip, limit=limit)


@router.get("/{id}", response_model=PolicyResponse)
def get_policy(id: int, svc: PolicyService = Depends(_svc)):
    return svc.get(id)


@router.post("/", response_model=PolicyResponse, status_code=status.HTTP_201_CREATED)
def create_policy(payload: PolicyCreate, svc: PolicyService = Depends(_svc)):
    return svc.create(payload)


@router.put("/{id}", response_model=PolicyResponse)
def update_policy(id: int, payload: PolicyUpdate, svc: PolicyService = Depends(_svc)):
    return svc.update(id, payload)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_policy(id: int, svc: PolicyService = Depends(_svc)):
    svc.delete(id)
