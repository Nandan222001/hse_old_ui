from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.hazard import HazardService
from app.schemas.hazard import HazardCreate, HazardUpdate, HazardResponse

router = APIRouter(prefix="/hazards", tags=["Hazards"])


def _svc(db: Session = Depends(get_db)) -> HazardService:
    return HazardService(db)


@router.get("/", response_model=list[HazardResponse])
def list_hazards(skip: int = 0, limit: int = 100, svc: HazardService = Depends(_svc)):
    return svc.list(skip=skip, limit=limit)


@router.get("/{id}", response_model=HazardResponse)
def get_hazard(id: int, svc: HazardService = Depends(_svc)):
    return svc.get(id)


@router.post("/", response_model=HazardResponse, status_code=status.HTTP_201_CREATED)
def create_hazard(payload: HazardCreate, svc: HazardService = Depends(_svc)):
    return svc.create(payload)


@router.put("/{id}", response_model=HazardResponse)
def update_hazard(id: int, payload: HazardUpdate, svc: HazardService = Depends(_svc)):
    return svc.update(id, payload)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hazard(id: int, svc: HazardService = Depends(_svc)):
    svc.delete(id)
