from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from app.models.base import Base


class Hazard(Base):
    __tablename__ = "hazards"

    organisation_id = Column(Integer, ForeignKey("organisation.id"), nullable=True, index=True)
    category_id = Column(Integer, ForeignKey("hazard_categories.id"))
    hazard_name = Column(String(255), nullable=False)
    severity = Column(String(50))
    probability = Column(String(50))

    # ── Hazard register lifecycle (migration 031) ────────────────────────────
    # Additive: the website reads hazard_name/severity/probability as catalog data;
    # these columns let a worker log a field hazard and carry it through control.
    #
    # register_status carries all eight stages as of migration 066 — see
    # workflow_stages.HAZARD_REGISTER_STATUS_STAGE for the mapping:
    #   open → interim_control → under_review → controls_planned →
    #   pending_verification → controlled → closed
    register_status = Column(String(50), default="open")
    description = Column(Text, nullable=True)
    location_station_id = Column(Integer, ForeignKey("working_stations.id"), nullable=True)
    logged_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    logged_at = Column(DateTime, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(Text, nullable=True)
    controls = Column(Text, nullable=True)
    auditor_verified_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    auditor_verified_at = Column(DateTime, nullable=True)
    verification_notes = Column(Text, nullable=True)
    gps_latitude = Column(String(32), nullable=True)
    gps_longitude = Column(String(32), nullable=True)

    # ── Stage 02 ASSESS (migration 066) ──────────────────────────────────────
    # `severity` above is the reporter's impression and drives nothing.
    # `assessed_priority` is what ranks this hazard against every other event
    # family on the unified queue.
    assessed_priority = Column(String(4), nullable=True)      # P1..P5
    assessed_label = Column(String(60), nullable=True)
    risk_score = Column(Integer, nullable=True)               # severity × probability, 1-25
    assessed_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    assessed_at = Column(DateTime, nullable=True)
    response_due_at = Column(DateTime, nullable=True)

    # ── Stage 03 RESPOND ─────────────────────────────────────────────────────
    # Deliberately separate from `controls`, which holds the permanent measure.
    # One column for both would make "barriered off" indistinguishable from
    # "guard fitted".
    interim_control = Column(Text, nullable=True)
    interim_control_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    interim_control_at = Column(DateTime, nullable=True)
    work_stopped = Column(Integer, default=0)

    # ── Stage 04 INVESTIGATE ─────────────────────────────────────────────────
    review_started_at = Column(DateTime, nullable=True)
    root_cause = Column(String(255), nullable=True)
    persons_exposed = Column(Integer, nullable=True)

    # ── Stage 05 IMPROVE ─────────────────────────────────────────────────────
    planned_controls = Column(Text, nullable=True)
    control_hierarchy = Column(String(40), nullable=True)
    control_owner_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    control_due_date = Column(Date, nullable=True)
    controls_planned_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    controls_planned_at = Column(DateTime, nullable=True)

    # ── Stage 06 VERIFY ──────────────────────────────────────────────────────
    # The in-workflow check that the control held. Kept apart from the auditor
    # trio above, which is post-closure assurance and gates nothing.
    controls_verified_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    controls_verified_at = Column(DateTime, nullable=True)
    control_verification_notes = Column(Text, nullable=True)
    verification_failures = Column(Integer, default=0)

    # ── Stage 07 LEARN · 08 CLOSE ────────────────────────────────────────────
    lessons_learned = Column(Text, nullable=True)
    lesson_captured_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    lesson_captured_at = Column(DateTime, nullable=True)
    closure_notes = Column(Text, nullable=True)
    closed_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    closed_at = Column(DateTime, nullable=True)
