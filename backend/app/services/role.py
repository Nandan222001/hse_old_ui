from sqlalchemy.orm import Session
from app.repositories.role import RoleRepository
from app.schemas.role import RoleCreate, RoleUpdate
from app.core.exceptions import NotFoundError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class RoleService:
    def __init__(self, db: Session) -> None:
        self._repo = RoleRepository(db)

    def list(self, skip: int = 0, limit: int = 100):
        logger.debug("list Role skip=%s limit=%s", skip, limit)
        return self._repo.get_all(skip=skip, limit=limit)

    def get(self, id: int):
        item = self._repo.get_by_id(id)
        if item is None:
            raise NotFoundError("Role", id)
        return item

    def create(self, payload: RoleCreate):
        logger.info("create Role")
        return self._repo.create(payload.model_dump())

    def update(self, id: int, payload: RoleUpdate):
        item = self._repo.update(id, payload.model_dump(exclude_unset=True))
        if item is None:
            raise NotFoundError("Role", id)
        logger.info("updated Role id=%s", id)
        return item

    def delete(self, id: int) -> None:
        if not self._repo.delete(id):
            raise NotFoundError("Role", id)
        logger.info("deleted Role id=%s", id)
