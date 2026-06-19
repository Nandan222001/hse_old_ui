from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from app.models.base import Base


class NearMiss(Base):
    __tablename__ = "near_misses"

    organisation_id = Column(Integer, ForeignKey("organisation.id"), nullable=True, index=True)
    report_date = Column(Date)
    event_date_time = Column(DateTime)
    location_station_id = Column(Integer, ForeignKey("working_stations.id"), nullable=True)
    description = Column(Text)
    potential_consequence = Column(String(255))
    hazard_id = Column(Integer, ForeignKey("hazards.id"), nullable=True)
    underlying_cause = Column(String(255))
    control_failure = Column(String(10))
    reported_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    capa_escalation = Column(String(10))
