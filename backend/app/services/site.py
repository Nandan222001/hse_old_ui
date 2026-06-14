from sqlalchemy.orm import Session
from app.repositories.site import SiteRepository
from app.schemas.site import SiteCreate, SiteUpdate
from app.core.exceptions import NotFoundError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class SiteService:
    def __init__(self, db: Session) -> None:
        self._repo = SiteRepository(db)

    def list(self, skip: int = 0, limit: int = 100):
        logger.debug("list Site skip=%s limit=%s", skip, limit)
        return self._repo.get_all(skip=skip, limit=limit)

    def get(self, id: int):
        item = self._repo.get_by_id(id)
        if item is None:
            raise NotFoundError("Site", id)
        return item

    def create(self, payload: SiteCreate):
        logger.info("create Site")
        return self._repo.create(payload.model_dump())

    def update(self, id: int, payload: SiteUpdate):
        item = self._repo.update(id, payload.model_dump(exclude_unset=True))
        if item is None:
            raise NotFoundError("Site", id)
        logger.info("updated Site id=%s", id)
        return item

    def delete(self, id: int) -> None:
        if not self._repo.delete(id):
            raise NotFoundError("Site", id)
        logger.info("deleted Site id=%s", id)
