from sqlalchemy.orm import Session
from app.repositories.shift_schedule import ShiftScheduleRepository
from app.schemas.shift_schedule import ShiftScheduleCreate, ShiftScheduleUpdate
from app.core.exceptions import NotFoundError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ShiftScheduleService:
    def __init__(self, db: Session) -> None:
        self._repo = ShiftScheduleRepository(db)

    def list(self, skip: int = 0, limit: int = 100):
        logger.debug("list ShiftSchedule skip=%s limit=%s", skip, limit)
        return self._repo.get_all(skip=skip, limit=limit)

    def get(self, id: int):
        item = self._repo.get_by_id(id)
        if item is None:
            raise NotFoundError("ShiftSchedule", id)
        return item

    def create(self, payload: ShiftScheduleCreate):
        logger.info("create ShiftSchedule")
        return self._repo.create(payload.model_dump())

    def update(self, id: int, payload: ShiftScheduleUpdate):
        item = self._repo.update(id, payload.model_dump(exclude_unset=True))
        if item is None:
            raise NotFoundError("ShiftSchedule", id)
        logger.info("updated ShiftSchedule id=%s", id)
        return item

    def delete(self, id: int) -> None:
        if not self._repo.delete(id):
            raise NotFoundError("ShiftSchedule", id)
        logger.info("deleted ShiftSchedule id=%s", id)
