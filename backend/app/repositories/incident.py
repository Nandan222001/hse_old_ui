from typing import List
from app.repositories.base import BaseRepository
from app.models.incident import Incident


class IncidentRepository(BaseRepository[Incident]):
    model_class = Incident

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Incident]:
        return (
            self._db.query(self.model_class)
            .order_by(self.model_class.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_all_by_org(self, org_id: int, skip: int = 0, limit: int = 100) -> List[Incident]:
        return (
            self._db.query(self.model_class)
            .filter(self.model_class.organisation_id == org_id)
            .order_by(self.model_class.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
