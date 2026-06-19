from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from app.models.base import Base


class Incident(Base):
    __tablename__ = "incidents"

    organisation_id = Column(Integer, ForeignKey("organisation.id"), nullable=True, index=True)
    report_date = Column(Date)
    incident_date_time = Column(DateTime)
    location_station_id = Column(Integer, ForeignKey("working_stations.id"), nullable=True)
    incident_type = Column(String(100))
    severity = Column(String(50))
    number_persons_involved = Column(Integer)
    description = Column(Text)
    immediate_cause = Column(String(255))
    root_cause = Column(String(255))
    hazard_id = Column(Integer, ForeignKey("hazards.id"), nullable=True)
    permit_active = Column(String(10))
    control_failure = Column(String(10))
    reported_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    investigation_status = Column(String(50))
    capa_generated = Column(String(10))
    days_away = Column(Integer)
    root_cause_category = Column(String(100))
