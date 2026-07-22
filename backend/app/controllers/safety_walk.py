from typing import List, Dict
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.core.dependencies import get_current_user, CurrentUser
from app.services.safety_walk import SafetyWalkService
from app.schemas.safety_walk import SafetyWalkCreate, SafetyWalkUpdate, SafetyWalkResponse

router = APIRouter(prefix="/safety-walks", tags=["Safety Walks"])


def _svc(db: Session = Depends(get_db)) -> SafetyWalkService:
    return SafetyWalkService(db)


@router.get("/", response_model=List[SafetyWalkResponse])
def list_safety_walks(skip: int = 0, limit: int = 100, svc: SafetyWalkService = Depends(_svc), current_user: CurrentUser = Depends(get_current_user)):
    return svc.list(skip=skip, limit=limit, org_id=current_user.org_id)


@router.get("/{id}", response_model=SafetyWalkResponse)
def get_safety_walk(id: int, svc: SafetyWalkService = Depends(_svc), current_user: CurrentUser = Depends(get_current_user)):
    return svc.get(id, org_id=current_user.org_id)


@router.post("/", response_model=SafetyWalkResponse, status_code=status.HTTP_201_CREATED)
def create_safety_walk(payload: SafetyWalkCreate, svc: SafetyWalkService = Depends(_svc), current_user: CurrentUser = Depends(get_current_user)):
    return svc.create(payload, org_id=current_user.org_id)


@router.put("/{id}", response_model=SafetyWalkResponse)
def update_safety_walk(id: int, payload: SafetyWalkUpdate, svc: SafetyWalkService = Depends(_svc), current_user: CurrentUser = Depends(get_current_user)):
    return svc.update(id, payload, org_id=current_user.org_id)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_safety_walk(id: int, svc: SafetyWalkService = Depends(_svc), current_user: CurrentUser = Depends(get_current_user)):
    svc.delete(id, org_id=current_user.org_id)
