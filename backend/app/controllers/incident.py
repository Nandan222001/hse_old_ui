from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.incident import IncidentService
from app.schemas.incident import IncidentCreate, IncidentUpdate, IncidentResponse

router = APIRouter(prefix="/incidents", tags=["Incidents"])


def _svc(db: Session = Depends(get_db)) -> IncidentService:
    return IncidentService(db)


@router.get("/", response_model=list[IncidentResponse])
def list_incidents(skip: int = 0, limit: int = 100, svc: IncidentService = Depends(_svc)):
    return svc.list(skip=skip, limit=limit)


@router.get("/{id}", response_model=IncidentResponse)
def get_incident(id: int, svc: IncidentService = Depends(_svc)):
    return svc.get(id)


@router.post("/", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(payload: IncidentCreate, svc: IncidentService = Depends(_svc)):
    return svc.create(payload)


@router.put("/{id}", response_model=IncidentResponse)
def update_incident(id: int, payload: IncidentUpdate, svc: IncidentService = Depends(_svc)):
    return svc.update(id, payload)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident(id: int, svc: IncidentService = Depends(_svc)):
    svc.delete(id)
