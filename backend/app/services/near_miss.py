from sqlalchemy.orm import Session
from app.repositories.near_miss import NearMissRepository
from app.schemas.near_miss import NearMissCreate, NearMissUpdate
from app.core.exceptions import NotFoundError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class NearMissService:
    def __init__(self, db: Session) -> None:
        self._repo = NearMissRepository(db)

    def list(self, skip: int = 0, limit: int = 100):
        logger.debug("list NearMiss skip=%s limit=%s", skip, limit)
        return self._repo.get_all(skip=skip, limit=limit)

    def get(self, id: int):
        item = self._repo.get_by_id(id)
        if item is None:
            raise NotFoundError("NearMiss", id)
        return item

    def create(self, payload: NearMissCreate):
        logger.info("create NearMiss")
        return self._repo.create(payload.model_dump())

    def update(self, id: int, payload: NearMissUpdate):
        item = self._repo.update(id, payload.model_dump(exclude_unset=True))
        if item is None:
            raise NotFoundError("NearMiss", id)
        logger.info("updated NearMiss id=%s", id)
        return item

    def delete(self, id: int) -> None:
        if not self._repo.delete(id):
            raise NotFoundError("NearMiss", id)
        logger.info("deleted NearMiss id=%s", id)
