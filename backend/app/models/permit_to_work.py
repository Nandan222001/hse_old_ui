from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text, Time
from app.models.base import Base


class PermitToWork(Base):
    __tablename__ = "permits_to_work"

    permit_type_id = Column(Integer, ForeignKey("permit_types.id"))
    date_issued = Column(Date, nullable=False)
    time_issued = Column(Time)
    location_station_id = Column(Integer, ForeignKey("working_stations.id"), nullable=True)
    work_description = Column(Text)
    duration_requested_hours = Column(Integer)
    issued_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    approved_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    validity_start = Column(DateTime)
    validity_end = Column(DateTime)
    work_start_actual = Column(DateTime)
    work_end_actual = Column(DateTime)
    number_of_workers = Column(Integer)
    status = Column(String(50))
    deviation_reported = Column(String(10))
    incident_occurred = Column(String(10))
