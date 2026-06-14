from sqlalchemy.orm import Session
from app.repositories.permit_to_work import PermitToWorkRepository
from app.schemas.permit_to_work import PermitToWorkCreate, PermitToWorkUpdate
from app.core.exceptions import NotFoundError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class PermitToWorkService:
    def __init__(self, db: Session) -> None:
        self._repo = PermitToWorkRepository(db)

    def list(self, skip: int = 0, limit: int = 100):
        logger.debug("list PermitToWork skip=%s limit=%s", skip, limit)
        return self._repo.get_all(skip=skip, limit=limit)

    def get(self, id: int):
        item = self._repo.get_by_id(id)
        if item is None:
            raise NotFoundError("PermitToWork", id)
        return item

    def create(self, payload: PermitToWorkCreate):
        logger.info("create PermitToWork")
        return self._repo.create(payload.model_dump())

    def update(self, id: int, payload: PermitToWorkUpdate):
        item = self._repo.update(id, payload.model_dump(exclude_unset=True))
        if item is None:
            raise NotFoundError("PermitToWork", id)
        logger.info("updated PermitToWork id=%s", id)
        return item

    def delete(self, id: int) -> None:
        if not self._repo.delete(id):
            raise NotFoundError("PermitToWork", id)
        logger.info("deleted PermitToWork id=%s", id)
