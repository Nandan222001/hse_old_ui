from sqlalchemy.orm import Session
from app.repositories.hazard_category import HazardCategoryRepository
from app.schemas.hazard_category import HazardCategoryCreate, HazardCategoryUpdate
from app.core.exceptions import NotFoundError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class HazardCategoryService:
    def __init__(self, db: Session) -> None:
        self._repo = HazardCategoryRepository(db)

    def list(self, skip: int = 0, limit: int = 100):
        logger.debug("list HazardCategory skip=%s limit=%s", skip, limit)
        return self._repo.get_all(skip=skip, limit=limit)

    def get(self, id: int):
        item = self._repo.get_by_id(id)
        if item is None:
            raise NotFoundError("HazardCategory", id)
        return item

    def create(self, payload: HazardCategoryCreate):
        logger.info("create HazardCategory")
        return self._repo.create(payload.model_dump())

    def update(self, id: int, payload: HazardCategoryUpdate):
        item = self._repo.update(id, payload.model_dump(exclude_unset=True))
        if item is None:
            raise NotFoundError("HazardCategory", id)
        logger.info("updated HazardCategory id=%s", id)
        return item

    def delete(self, id: int) -> None:
        if not self._repo.delete(id):
            raise NotFoundError("HazardCategory", id)
        logger.info("deleted HazardCategory id=%s", id)
