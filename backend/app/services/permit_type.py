from sqlalchemy.orm import Session
from app.repositories.permit_type import PermitTypeRepository
from app.schemas.permit_type import PermitTypeCreate, PermitTypeUpdate
from app.core.exceptions import NotFoundError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class PermitTypeService:
    def __init__(self, db: Session) -> None:
        self._repo = PermitTypeRepository(db)

    def list(self, skip: int = 0, limit: int = 100):
        logger.debug("list PermitType skip=%s limit=%s", skip, limit)
        return self._repo.get_all(skip=skip, limit=limit)

    def get(self, id: int):
        item = self._repo.get_by_id(id)
        if item is None:
            raise NotFoundError("PermitType", id)
        return item

    def create(self, payload: PermitTypeCreate):
        logger.info("create PermitType")
        return self._repo.create(payload.model_dump())

    def update(self, id: int, payload: PermitTypeUpdate):
        item = self._repo.update(id, payload.model_dump(exclude_unset=True))
        if item is None:
            raise NotFoundError("PermitType", id)
        logger.info("updated PermitType id=%s", id)
        return item

    def delete(self, id: int) -> None:
        if not self._repo.delete(id):
            raise NotFoundError("PermitType", id)
        logger.info("deleted PermitType id=%s", id)
