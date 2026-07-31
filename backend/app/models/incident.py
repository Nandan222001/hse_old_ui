from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.mysql import JSON
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

    # ── Workflow Status ───────────────────────────────────────────────────────
    # reported | acknowledged | under_investigation | escalated | pending_approval | closed
    workflow_status = Column(String(50), default="reported")

    # ── Assignment & Escalation ───────────────────────────────────────────────
    assigned_supervisor_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    escalated_to_manager_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    escalation_reason = Column(Text, nullable=True)

    # ── SLA Timestamps ────────────────────────────────────────────────────────
    reported_at = Column(DateTime, nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    investigation_started_at = Column(DateTime, nullable=True)
    investigation_completed_at = Column(DateTime, nullable=True)
    escalated_at = Column(DateTime, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)

    # ── Manager Closure Fields ────────────────────────────────────────────────
    closure_notes = Column(Text, nullable=True)
    regulatory_notified = Column(String(10), default="No")
    lessons_learned = Column(Text, nullable=True)
    communicated_to_teams = Column(String(10), default="No")
    manager_signature = Column(String(255), nullable=True)

    # ── Worker Report Extra Fields ────────────────────────────────────────────
    anyone_injured = Column(String(10), default="No")
    injured_person_name = Column(String(255), nullable=True)
    injured_body_part = Column(String(255), nullable=True)
    hazard_still_present = Column(String(10), default="No")
    witnesses_json = Column(JSON, nullable=True)
    evidence_json = Column(JSON, nullable=True)
    gps_latitude = Column(Numeric(10, 8), nullable=True)
    gps_longitude = Column(Numeric(11, 8), nullable=True)

    # ── Supervisor Investigation Fields ───────────────────────────────────────
    five_why_analysis = Column(JSON, nullable=True)
    immediate_actions_taken = Column(Text, nullable=True)
    supervisor_signature = Column(String(255), nullable=True)
    severity_classification = Column(String(50), nullable=True)  # LTI | MTI | First Aid | Near Miss
    # Auditor close-out review — mirrors the same trio on permits_to_work and hazards.
    auditor_verified_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    auditor_verified_at = Column(DateTime, nullable=True)
    verification_notes = Column(Text, nullable=True)
