from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.shift_schedule import ShiftScheduleService
from app.schemas.shift_schedule import ShiftScheduleCreate, ShiftScheduleUpdate, ShiftScheduleResponse

router = APIRouter(prefix="/shift-schedules", tags=["Shift Schedules"])


def _svc(db: Session = Depends(get_db)) -> ShiftScheduleService:
    return ShiftScheduleService(db)


@router.get("/", response_model=list[ShiftScheduleResponse])
def list_shift_schedules(skip: int = 0, limit: int = 100, svc: ShiftScheduleService = Depends(_svc)):
    return svc.list(skip=skip, limit=limit)


@router.get("/{id}", response_model=ShiftScheduleResponse)
def get_shift_schedule(id: int, svc: ShiftScheduleService = Depends(_svc)):
    return svc.get(id)


@router.post("/", response_model=ShiftScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_shift_schedule(payload: ShiftScheduleCreate, svc: ShiftScheduleService = Depends(_svc)):
    return svc.create(payload)


@router.put("/{id}", response_model=ShiftScheduleResponse)
def update_shift_schedule(id: int, payload: ShiftScheduleUpdate, svc: ShiftScheduleService = Depends(_svc)):
    return svc.update(id, payload)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shift_schedule(id: int, svc: ShiftScheduleService = Depends(_svc)):
    svc.delete(id)
