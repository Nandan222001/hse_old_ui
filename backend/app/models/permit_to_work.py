from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text, Time
from app.models.base import Base


class PermitToWork(Base):
    __tablename__ = "permits_to_work"

    organisation_id = Column(Integer, ForeignKey("organisation.id"), nullable=True, index=True)
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

    # ── Worker → Supervisor → Manager → Auditor workflow (migration 031) ──────
    # `status` above stays the website's field (it counts status='Active'); the app
    # state machine rides on workflow_status and only flips status to 'Active' on
    # manager approval.
    workflow_status = Column(String(50), default="requested")
    requested_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    requested_at = Column(DateTime, nullable=True)
    acknowledged_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    supervisor_notes = Column(Text, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    auditor_verified_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    auditor_verified_at = Column(DateTime, nullable=True)
    verification_result = Column(String(50), nullable=True)  # valid | invalid | not_displayed
    verification_notes = Column(Text, nullable=True)
