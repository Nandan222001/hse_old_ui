from sqlalchemy.orm import Session
from app.repositories.training_program import TrainingProgramRepository
from app.schemas.training_program import TrainingProgramCreate, TrainingProgramUpdate
from app.core.exceptions import NotFoundError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class TrainingProgramService:
    def __init__(self, db: Session) -> None:
        self._repo = TrainingProgramRepository(db)

    def list(self, skip: int = 0, limit: int = 100):
        logger.debug("list TrainingProgram skip=%s limit=%s", skip, limit)
        return self._repo.get_all(skip=skip, limit=limit)

    def get(self, id: int):
        item = self._repo.get_by_id(id)
        if item is None:
            raise NotFoundError("TrainingProgram", id)
        return item

    def create(self, payload: TrainingProgramCreate):
        logger.info("create TrainingProgram")
        return self._repo.create(payload.model_dump())

    def update(self, id: int, payload: TrainingProgramUpdate):
        item = self._repo.update(id, payload.model_dump(exclude_unset=True))
        if item is None:
            raise NotFoundError("TrainingProgram", id)
        logger.info("updated TrainingProgram id=%s", id)
        return item

    def delete(self, id: int) -> None:
        if not self._repo.delete(id):
            raise NotFoundError("TrainingProgram", id)
        logger.info("deleted TrainingProgram id=%s", id)
