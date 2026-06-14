from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.near_miss import NearMissService
from app.schemas.near_miss import NearMissCreate, NearMissUpdate, NearMissResponse

router = APIRouter(prefix="/near-misss", tags=["Near Misss"])


def _svc(db: Session = Depends(get_db)) -> NearMissService:
    return NearMissService(db)


@router.get("/", response_model=list[NearMissResponse])
def list_near_misss(skip: int = 0, limit: int = 100, svc: NearMissService = Depends(_svc)):
    return svc.list(skip=skip, limit=limit)


@router.get("/{id}", response_model=NearMissResponse)
def get_near_miss(id: int, svc: NearMissService = Depends(_svc)):
    return svc.get(id)


@router.post("/", response_model=NearMissResponse, status_code=status.HTTP_201_CREATED)
def create_near_miss(payload: NearMissCreate, svc: NearMissService = Depends(_svc)):
    return svc.create(payload)


@router.put("/{id}", response_model=NearMissResponse)
def update_near_miss(id: int, payload: NearMissUpdate, svc: NearMissService = Depends(_svc)):
    return svc.update(id, payload)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_near_miss(id: int, svc: NearMissService = Depends(_svc)):
    svc.delete(id)
