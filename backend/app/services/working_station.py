from sqlalchemy.orm import Session
from app.repositories.working_station import WorkingStationRepository
from app.schemas.working_station import WorkingStationCreate, WorkingStationUpdate
from app.core.exceptions import NotFoundError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class WorkingStationService:
    def __init__(self, db: Session) -> None:
        self._repo = WorkingStationRepository(db)

    def list(self, skip: int = 0, limit: int = 100):
        logger.debug("list WorkingStation skip=%s limit=%s", skip, limit)
        return self._repo.get_all(skip=skip, limit=limit)

    def get(self, id: int):
        item = self._repo.get_by_id(id)
        if item is None:
            raise NotFoundError("WorkingStation", id)
        return item

    def create(self, payload: WorkingStationCreate):
        logger.info("create WorkingStation")
        return self._repo.create(payload.model_dump())

    def update(self, id: int, payload: WorkingStationUpdate):
        item = self._repo.update(id, payload.model_dump(exclude_unset=True))
        if item is None:
            raise NotFoundError("WorkingStation", id)
        logger.info("updated WorkingStation id=%s", id)
        return item

    def delete(self, id: int) -> None:
        if not self._repo.delete(id):
            raise NotFoundError("WorkingStation", id)
        logger.info("deleted WorkingStation id=%s", id)
