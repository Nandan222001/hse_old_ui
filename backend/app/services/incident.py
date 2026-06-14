from sqlalchemy.orm import Session
from app.repositories.incident import IncidentRepository
from app.schemas.incident import IncidentCreate, IncidentUpdate
from app.core.exceptions import NotFoundError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class IncidentService:
    def __init__(self, db: Session) -> None:
        self._repo = IncidentRepository(db)

    def list(self, skip: int = 0, limit: int = 100):
        logger.debug("list Incident skip=%s limit=%s", skip, limit)
        return self._repo.get_all(skip=skip, limit=limit)

    def get(self, id: int):
        item = self._repo.get_by_id(id)
        if item is None:
            raise NotFoundError("Incident", id)
        return item

    def create(self, payload: IncidentCreate):
        logger.info("create Incident")
        return self._repo.create(payload.model_dump())

    def update(self, id: int, payload: IncidentUpdate):
        item = self._repo.update(id, payload.model_dump(exclude_unset=True))
        if item is None:
            raise NotFoundError("Incident", id)
        logger.info("updated Incident id=%s", id)
        return item

    def delete(self, id: int) -> None:
        if not self._repo.delete(id):
            raise NotFoundError("Incident", id)
        logger.info("deleted Incident id=%s", id)
