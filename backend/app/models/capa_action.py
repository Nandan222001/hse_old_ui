from sqlalchemy import Column, Date, ForeignKey, Integer, String, Text
from app.models.base import Base


class CapaAction(Base):
    __tablename__ = "capa_actions"

    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    action_type = Column(String(100))
    description = Column(Text)
    root_cause_addressed = Column(String(255))
    responsible_person_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    due_date = Column(Date)
    status = Column(String(50))
    effectiveness_rating = Column(Integer)
