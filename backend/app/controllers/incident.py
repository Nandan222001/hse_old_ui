from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.core.dependencies import get_current_user, CurrentUser
from app.services.incident import IncidentService
from app.schemas.incident import IncidentCreate, IncidentUpdate, IncidentResponse

router = APIRouter(prefix="/incidents", tags=["Incidents"])


def _svc(db: Session = Depends(get_db)) -> IncidentService:
    return IncidentService(db)


@router.get("/", response_model=list[IncidentResponse])
def list_incidents(
    skip: int = 0,
    limit: int = 100,
    svc: IncidentService = Depends(_svc),
    current_user: CurrentUser = Depends(get_current_user),
):
    return svc.list(skip=skip, limit=limit, org_id=current_user.org_id)


@router.get("/{id}", response_model=IncidentResponse)
def get_incident(
    id: int,
    svc: IncidentService = Depends(_svc),
    current_user: CurrentUser = Depends(get_current_user),
):
    return svc.get(id, org_id=current_user.org_id)


@router.post("/", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(
    payload: IncidentCreate,
    svc: IncidentService = Depends(_svc),
    current_user: CurrentUser = Depends(get_current_user),
):
    return svc.create(payload, org_id=current_user.org_id)


@router.put("/{id}", response_model=IncidentResponse)
def update_incident(
    id: int,
    payload: IncidentUpdate,
    svc: IncidentService = Depends(_svc),
    current_user: CurrentUser = Depends(get_current_user),
):
    return svc.update(id, payload, org_id=current_user.org_id)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident(
    id: int,
    svc: IncidentService = Depends(_svc),
    current_user: CurrentUser = Depends(get_current_user),
):
    svc.delete(id, org_id=current_user.org_id)
