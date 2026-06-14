from sqlalchemy.orm import Session
from app.repositories.policy import PolicyRepository
from app.schemas.policy import PolicyCreate, PolicyUpdate
from app.core.exceptions import NotFoundError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class PolicyService:
    def __init__(self, db: Session) -> None:
        self._repo = PolicyRepository(db)

    def list(self, skip: int = 0, limit: int = 100):
        logger.debug("list Policy skip=%s limit=%s", skip, limit)
        return self._repo.get_all(skip=skip, limit=limit)

    def get(self, id: int):
        item = self._repo.get_by_id(id)
        if item is None:
            raise NotFoundError("Policy", id)
        return item

    def create(self, payload: PolicyCreate):
        logger.info("create Policy")
        return self._repo.create(payload.model_dump())

    def update(self, id: int, payload: PolicyUpdate):
        item = self._repo.update(id, payload.model_dump(exclude_unset=True))
        if item is None:
            raise NotFoundError("Policy", id)
        logger.info("updated Policy id=%s", id)
        return item

    def delete(self, id: int) -> None:
        if not self._repo.delete(id):
            raise NotFoundError("Policy", id)
        logger.info("deleted Policy id=%s", id)
