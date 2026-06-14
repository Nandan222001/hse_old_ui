from sqlalchemy.orm import Session
from app.repositories.department import DepartmentRepository
from app.schemas.department import DepartmentCreate, DepartmentUpdate
from app.core.exceptions import NotFoundError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class DepartmentService:
    def __init__(self, db: Session) -> None:
        self._repo = DepartmentRepository(db)

    def list(self, skip: int = 0, limit: int = 100):
        logger.debug("list Department skip=%s limit=%s", skip, limit)
        return self._repo.get_all(skip=skip, limit=limit)

    def get(self, id: int):
        item = self._repo.get_by_id(id)
        if item is None:
            raise NotFoundError("Department", id)
        return item

    def create(self, payload: DepartmentCreate):
        logger.info("create Department")
        return self._repo.create(payload.model_dump())

    def update(self, id: int, payload: DepartmentUpdate):
        item = self._repo.update(id, payload.model_dump(exclude_unset=True))
        if item is None:
            raise NotFoundError("Department", id)
        logger.info("updated Department id=%s", id)
        return item

    def delete(self, id: int) -> None:
        if not self._repo.delete(id):
            raise NotFoundError("Department", id)
        logger.info("deleted Department id=%s", id)
