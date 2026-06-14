from sqlalchemy.orm import Session
from app.repositories.employee import EmployeeRepository
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from app.core.exceptions import NotFoundError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class EmployeeService:
    def __init__(self, db: Session) -> None:
        self._repo = EmployeeRepository(db)

    def list(self, skip: int = 0, limit: int = 100):
        logger.debug("list Employee skip=%s limit=%s", skip, limit)
        return self._repo.get_all(skip=skip, limit=limit)

    def get(self, id: int):
        item = self._repo.get_by_id(id)
        if item is None:
            raise NotFoundError("Employee", id)
        return item

    def create(self, payload: EmployeeCreate):
        logger.info("create Employee")
        return self._repo.create(payload.model_dump())

    def update(self, id: int, payload: EmployeeUpdate):
        item = self._repo.update(id, payload.model_dump(exclude_unset=True))
        if item is None:
            raise NotFoundError("Employee", id)
        logger.info("updated Employee id=%s", id)
        return item

    def delete(self, id: int) -> None:
        if not self._repo.delete(id):
            raise NotFoundError("Employee", id)
        logger.info("deleted Employee id=%s", id)
