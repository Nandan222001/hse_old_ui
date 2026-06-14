from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.working_station import WorkingStationService
from app.schemas.working_station import WorkingStationCreate, WorkingStationUpdate, WorkingStationResponse

router = APIRouter(prefix="/working-stations", tags=["Working Stations"])


def _svc(db: Session = Depends(get_db)) -> WorkingStationService:
    return WorkingStationService(db)


@router.get("/", response_model=list[WorkingStationResponse])
def list_working_stations(skip: int = 0, limit: int = 100, svc: WorkingStationService = Depends(_svc)):
    return svc.list(skip=skip, limit=limit)


@router.get("/{id}", response_model=WorkingStationResponse)
def get_working_station(id: int, svc: WorkingStationService = Depends(_svc)):
    return svc.get(id)


@router.post("/", response_model=WorkingStationResponse, status_code=status.HTTP_201_CREATED)
def create_working_station(payload: WorkingStationCreate, svc: WorkingStationService = Depends(_svc)):
    return svc.create(payload)


@router.put("/{id}", response_model=WorkingStationResponse)
def update_working_station(id: int, payload: WorkingStationUpdate, svc: WorkingStationService = Depends(_svc)):
    return svc.update(id, payload)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_working_station(id: int, svc: WorkingStationService = Depends(_svc)):
    svc.delete(id)
