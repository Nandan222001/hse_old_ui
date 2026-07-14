from typing import List, Dict
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.core.dependencies import get_current_user, CurrentUser
from app.services.shift_schedule import ShiftScheduleService
from app.schemas.shift_schedule import ShiftScheduleCreate, ShiftScheduleUpdate, ShiftScheduleResponse

router = APIRouter(prefix="/shift-schedules", tags=["Shift Schedules"])


def _svc(db: Session = Depends(get_db)) -> ShiftScheduleService:
    return ShiftScheduleService(db)


@router.get("/", response_model=List[ShiftScheduleResponse])
def list_shift_schedules(skip: int = 0, limit: int = 100, svc: ShiftScheduleService = Depends(_svc), current_user: CurrentUser = Depends(get_current_user)):
    return svc.list(skip=skip, limit=limit, org_id=current_user.org_id)


@router.get("/{id}", response_model=ShiftScheduleResponse)
def get_shift_schedule(id: int, svc: ShiftScheduleService = Depends(_svc), current_user: CurrentUser = Depends(get_current_user)):
    return svc.get(id, org_id=current_user.org_id)


@router.post("/", response_model=ShiftScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_shift_schedule(payload: ShiftScheduleCreate, svc: ShiftScheduleService = Depends(_svc), current_user: CurrentUser = Depends(get_current_user)):
    return svc.create(payload, org_id=current_user.org_id)


@router.put("/{id}", response_model=ShiftScheduleResponse)
def update_shift_schedule(id: int, payload: ShiftScheduleUpdate, svc: ShiftScheduleService = Depends(_svc), current_user: CurrentUser = Depends(get_current_user)):
    return svc.update(id, payload, org_id=current_user.org_id)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shift_schedule(id: int, svc: ShiftScheduleService = Depends(_svc), current_user: CurrentUser = Depends(get_current_user)):
    svc.delete(id, org_id=current_user.org_id)
