from app.repositories.base import BaseRepository
from app.models.incident import Incident


class IncidentRepository(BaseRepository[Incident]):
    model_class = Incident
