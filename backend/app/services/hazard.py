from sqlalchemy.orm import Session
from app.repositories.hazard import HazardRepository
from app.schemas.hazard import HazardCreate, HazardUpdate
from app.core.exceptions import NotFoundError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class HazardService:
    def __init__(self, db: Session) -> None:
        self._repo = HazardRepository(db)

    def list(self, skip: int = 0, limit: int = 100):
        logger.debug("list Hazard skip=%s limit=%s", skip, limit)
        return self._repo.get_all(skip=skip, limit=limit)

    def get(self, id: int):
        item = self._repo.get_by_id(id)
        if item is None:
            raise NotFoundError("Hazard", id)
        return item

    def create(self, payload: HazardCreate):
        logger.info("create Hazard")
        return self._repo.create(payload.model_dump())

    def update(self, id: int, payload: HazardUpdate):
        item = self._repo.update(id, payload.model_dump(exclude_unset=True))
        if item is None:
            raise NotFoundError("Hazard", id)
        logger.info("updated Hazard id=%s", id)
        return item

    def delete(self, id: int) -> None:
        if not self._repo.delete(id):
            raise NotFoundError("Hazard", id)
        logger.info("deleted Hazard id=%s", id)
