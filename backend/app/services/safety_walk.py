from sqlalchemy.orm import Session
from app.repositories.safety_walk import SafetyWalkRepository
from app.schemas.safety_walk import SafetyWalkCreate, SafetyWalkUpdate
from app.core.exceptions import NotFoundError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class SafetyWalkService:
    def __init__(self, db: Session) -> None:
        self._repo = SafetyWalkRepository(db)

    def list(self, skip: int = 0, limit: int = 100):
        logger.debug("list SafetyWalk skip=%s limit=%s", skip, limit)
        return self._repo.get_all(skip=skip, limit=limit)

    def get(self, id: int):
        item = self._repo.get_by_id(id)
        if item is None:
            raise NotFoundError("SafetyWalk", id)
        return item

    def create(self, payload: SafetyWalkCreate):
        logger.info("create SafetyWalk")
        return self._repo.create(payload.model_dump())

    def update(self, id: int, payload: SafetyWalkUpdate):
        item = self._repo.update(id, payload.model_dump(exclude_unset=True))
        if item is None:
            raise NotFoundError("SafetyWalk", id)
        logger.info("updated SafetyWalk id=%s", id)
        return item

    def delete(self, id: int) -> None:
        if not self._repo.delete(id):
            raise NotFoundError("SafetyWalk", id)
        logger.info("deleted SafetyWalk id=%s", id)
