from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.training_program import TrainingProgramService
from app.schemas.training_program import TrainingProgramCreate, TrainingProgramUpdate, TrainingProgramResponse

router = APIRouter(prefix="/training-programs", tags=["Training Programs"])


def _svc(db: Session = Depends(get_db)) -> TrainingProgramService:
    return TrainingProgramService(db)


@router.get("/", response_model=list[TrainingProgramResponse])
def list_training_programs(skip: int = 0, limit: int = 100, svc: TrainingProgramService = Depends(_svc)):
    return svc.list(skip=skip, limit=limit)


@router.get("/{id}", response_model=TrainingProgramResponse)
def get_training_program(id: int, svc: TrainingProgramService = Depends(_svc)):
    return svc.get(id)


@router.post("/", response_model=TrainingProgramResponse, status_code=status.HTTP_201_CREATED)
def create_training_program(payload: TrainingProgramCreate, svc: TrainingProgramService = Depends(_svc)):
    return svc.create(payload)


@router.put("/{id}", response_model=TrainingProgramResponse)
def update_training_program(id: int, payload: TrainingProgramUpdate, svc: TrainingProgramService = Depends(_svc)):
    return svc.update(id, payload)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_training_program(id: int, svc: TrainingProgramService = Depends(_svc)):
    svc.delete(id)
