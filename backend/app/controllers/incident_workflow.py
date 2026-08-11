"""
Role-based Incident Reporting Workflow Controller.

Flow: Worker reports → Supervisor acknowledges & investigates → Manager approves & closes.

Endpoints are role-aware: the current_user.role determines what actions are allowed.
"""
from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config.database import SessionLocal, get_db
from app.core.dependencies import get_current_user, CurrentUser
from app.models.incident import Incident
from app.models.capa_action import CapaAction
from app.models.employee import Employee
from app.services import events, statutory_reporting
from app.services.events import catalogue
from app.services.capa_priority import prioritise
from app.services.incident_severity import classify_severity
from app.schemas.incident_workflow import (
    WorkerIncidentReport,
    SupervisorAcknowledge,
    SupervisorInvestigate,
    SupervisorEscalate,
    ManagerApproveInvestigation,
    ManagerCloseIncident,
    CapaComplete,
    IncidentWorkflowResponse,
    IncidentListItem,
)

router = APIRouter(prefix="/incident-workflow", tags=["Incident Workflow"])

# ── Role constants ────────────────────────────────────────────────────────────
WORKER_ROLES = {"Worker", "Employee", "Operator", "Technician"}
SUPERVISOR_ROLES = {"Supervisor", "Site Inspector", "Safety Manager", "Safety_Manager", "Site Engineer"}
MANAGER_ROLES = {"Manager", "HSE Manager", "Admin", "Superadmin", "Safety Manager", "Safety_Manager", "Director"}
ALL_ELEVATED_ROLES = SUPERVISOR_ROLES | MANAGER_ROLES


def _get_incident(db: Session, incident_id: int, org_id: Optional[int]) -> Incident:
    """Fetch incident scoped to org."""
    q = db.query(Incident).filter(Incident.id == incident_id)
    if org_id is not None:
        q = q.filter(Incident.organisation_id == org_id)
    incident = q.first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


def _role_matches(user_role: str, allowed_roles: set) -> bool:
    """Case-insensitive role check."""
    return user_role.strip().lower() in {r.lower() for r in allowed_roles}


def _require_role(user_role: str, allowed_roles: set, action: str):
    """Raise 403 if role is not in allowed set."""
    if not _role_matches(user_role, allowed_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{user_role}' is not authorized to {action}",
        )


# ══════════════════════════════════════════════════════════════════════════════
# WF-03 · severity classification and statutory reportability
#
# Runs on submission and again on investigation, because the treatment level is
# usually confirmed by a clinician after the worker has already filed. Both
# passes write the full decision trace, so a reclassification is auditable.
# ══════════════════════════════════════════════════════════════════════════════

def _site_jurisdiction(db: Session, incident: Incident) -> tuple:
    """(jurisdiction, region) of the site this incident happened at, via its station.

    Returns (None, None) when the incident has no station, the station has no
    site, or the site has no jurisdiction configured. The statutory service
    treats a None jurisdiction as "cannot determine" rather than defaulting to a
    regulator. `region` selects the authority within a country — emirate, state
    or member state — and is optional.
    """
    if not incident.location_station_id:
        return (None, None)
    row = db.execute(
        text(
            "SELECT s.jurisdiction, s.region FROM working_stations ws "
            "JOIN sites s ON s.id = ws.site_id WHERE ws.id = :sid"
        ),
        {"sid": incident.location_station_id},
    ).first()
    return (row[0], row[1]) if row else (None, None)


def _is_recurring(db: Session, incident: Incident) -> bool:
    """WF-03 Q5 — same event type at this site within the last 12 months.

    Scoped to the station rather than the whole organisation: "at this site" is
    what the spec asks, and an org-wide match would flag almost every slip.
    Excludes the incident itself.
    """
    if not incident.incident_type or not incident.location_station_id:
        return False

    reference = incident.incident_date_time or incident.reported_at or datetime.utcnow()
    row = db.execute(
        text(
            "SELECT COUNT(*) FROM incidents "
            " WHERE organisation_id = :org "
            "   AND incident_type = :itype "
            "   AND location_station_id = :sid "
            "   AND id <> :self_id "
            "   AND incident_date_time >= :since "
            "   AND incident_date_time <= :until"
        ),
        {
            "org": incident.organisation_id,
            "itype": incident.incident_type,
            "sid": incident.location_station_id,
            "self_id": incident.id or 0,
            "since": reference - timedelta(days=365),
            "until": reference,
        },
    ).scalar()
    return bool(row and row > 0)


def _apply_severity_and_statutory(
    db: Session,
    incident: Incident,
    *,
    treatment_level: Optional[str] = None,
    dangerous_occurrence: Optional[bool] = None,
    worst_case_fatal: Optional[bool] = None,
    days_away: Optional[int] = None,
    occupational_disease: bool = False,
    loss_of_consciousness: bool = False,
) -> None:
    """Classify the incident P1-P5 and draft any statutory obligation.

    Mutates `incident` in place. The caller commits. Any argument left as None
    falls back to what is already stored, so the investigation pass can supply
    only what it newly learned without clearing the reporter's answers.
    """
    if treatment_level is None:
        treatment_level = incident.treatment_level
    if dangerous_occurrence is None:
        dangerous_occurrence = bool(incident.dangerous_occurrence)
    if worst_case_fatal is None:
        worst_case_fatal = bool(incident.worst_case_fatal)
    if days_away is None:
        days_away = incident.days_away

    injured = str(incident.anyone_injured or "No").strip().lower() in ("yes", "true", "1")

    severity = classify_severity(
        anyone_injured=injured,
        treatment_level=treatment_level,
        days_away=days_away,
        dangerous_occurrence=bool(dangerous_occurrence),
        worst_case_fatal=bool(worst_case_fatal),
        recurring_event_type=_is_recurring(db, incident),
    )

    incident.treatment_level = treatment_level
    incident.dangerous_occurrence = int(bool(dangerous_occurrence))
    incident.worst_case_fatal = int(bool(worst_case_fatal))
    incident.severity_priority = severity.priority
    incident.severity_label = severity.label
    incident.is_hipo = int(severity.is_hipo)
    incident.is_recurring_pattern = int(severity.is_recurring)
    incident.requires_systemic_rca = int(severity.requires_systemic_rca)
    incident.severity_trace = severity.explanation
    incident.severity_classified_at = datetime.utcnow()
    incident.min_investigator = severity.min_investigator

    # Investigation SLA runs from when the incident occurred, not from when it
    # was classified — a late-classified incident does not get a longer clock.
    clock_start = incident.incident_date_time or incident.reported_at or datetime.utcnow()
    incident.investigation_due_at = (
        clock_start + timedelta(days=severity.investigation_days)
        if severity.investigation_days is not None else None
    )

    # ── Appendix A ───────────────────────────────────────────────────────────
    jurisdiction, region = _site_jurisdiction(db, incident)
    level = (treatment_level or "").strip().lower()

    result = statutory_reporting.evaluate(
        jurisdiction,
        incident_at=clock_start,
        fatality=(severity.priority == "P1" or level == "fatality"),
        injury_type=incident.injured_body_part or incident.incident_type,
        days_away=days_away,
        dangerous_occurrence=bool(dangerous_occurrence),
        hospitalised=(level == "hospitalisation"),
        hospitalised_over_24h=(level == "hospitalisation"),
        medical_treatment=(level in ("medical_treatment", "hospitalisation")),
        loss_of_consciousness=loss_of_consciousness,
        occupational_disease=occupational_disease,
        region=region,
    )

    incident.statutory_reportable = int(result.reportable)
    incident.statutory_jurisdiction = jurisdiction
    incident.statutory_summary = result.explanation[:500] if result.explanation else None
    incident.statutory_due_at = result.earliest_due_at
    most_urgent = result.most_urgent
    incident.statutory_regulator = most_urgent.regulator if most_urgent else None
    incident.statutory_obligations = [
        {
            "jurisdiction": o.jurisdiction,
            "regulator": o.regulator,
            "legal_basis": o.legal_basis,
            "event": o.event,
            "criteria": o.criteria,
            "notify_within_hours": o.notify_within_hours,
            "due_at": o.due_at.isoformat() if o.due_at else None,
            "written_due_at": o.written_due_at.isoformat() if o.written_due_at else None,
            "requires_human_authorisation": o.requires_human_authorisation,
            "encoded": o.encoded,
        }
        for o in result.obligations
    ] or None


# ══════════════════════════════════════════════════════════════════════════════
# WORKER ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/report", response_model=IncidentWorkflowResponse, status_code=status.HTTP_201_CREATED)
def worker_report_incident(
    payload: WorkerIncidentReport,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Worker submits a new incident report. Auto-notifies supervisor."""
    now = datetime.utcnow()

    # Find the employee record for the reporter (by user email → employee match)
    reporter_employee = (
        db.query(Employee)
        .filter(Employee.organisation_id == current_user.org_id)
        .filter(Employee.full_name.ilike(f"%{current_user.username}%"))
        .first()
    )

    # Find supervisor to auto-assign (reporter's manager or any supervisor in org)
    supervisor_id = None
    if reporter_employee and reporter_employee.manager_id:
        supervisor_id = reporter_employee.manager_id
    else:
        # Fallback: find any supervisor-role employee in the org
        from app.models.role import Role
        sup_employee = (
            db.query(Employee)
            .join(Role, Employee.role_id == Role.id)
            .filter(Employee.organisation_id == current_user.org_id)
            .filter(Role.role_name.in_(["Supervisor", "Site Inspector", "Safety Manager"]))
            .filter(Employee.active_status == "Active")
            .first()
        )
        if sup_employee:
            supervisor_id = sup_employee.id

    incident = Incident(
        organisation_id=current_user.org_id,
        report_date=now.date(),
        incident_date_time=payload.incident_date_time,
        location_station_id=payload.location_station_id,
        incident_type=payload.incident_type,
        severity=payload.severity,
        description=payload.description,
        number_persons_involved=payload.number_persons_involved,
        reported_by=reporter_employee.id if reporter_employee else None,
        anyone_injured=payload.anyone_injured,
        injured_person_name=payload.injured_person_name,
        injured_body_part=payload.injured_body_part,
        hazard_still_present=payload.hazard_still_present,
        witnesses_json=payload.witnesses_json,
        evidence_json=payload.evidence_json,
        gps_latitude=payload.gps_latitude,
        gps_longitude=payload.gps_longitude,
        # Workflow fields
        workflow_status="reported",
        reported_at=now,
        assigned_supervisor_id=supervisor_id,
        investigation_status="Pending",
        capa_generated="No",
        days_away=payload.days_away,
    )
    db.add(incident)
    # Flush rather than commit so the incident has an id — the recurrence lookup
    # excludes the incident itself, and without an id it would match nothing.
    db.flush()

    _apply_severity_and_statutory(
        db, incident,
        treatment_level=payload.treatment_level,
        dangerous_occurrence=payload.dangerous_occurrence,
        worst_case_fatal=payload.worst_case_fatal,
        days_away=payload.days_away,
    )

    db.commit()
    db.refresh(incident)
    return incident


@router.get("/my-reports", response_model=List[IncidentListItem])
def worker_my_reports(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Worker sees only their own reported incidents."""
    # Resolve the reporter's employee id via the users table (the same id that
    # POST /worker/incidents stamps as reported_by). The old name-match lookup
    # (full_name ILIKE username) never matched, so this always returned [].
    reporter_emp_id = db.execute(
        text("SELECT employee_id FROM users WHERE id = :uid"),
        {"uid": current_user.user_id},
    ).scalar()
    if not reporter_emp_id:
        return []

    rows = (
        db.query(Incident)
        .filter(Incident.organisation_id == current_user.org_id)
        .filter(Incident.reported_by == reporter_emp_id)
        .order_by(Incident.reported_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return rows


# ══════════════════════════════════════════════════════════════════════════════
# SUPERVISOR ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/pending-review", response_model=List[IncidentListItem])
def supervisor_pending_review(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Supervisor sees incidents assigned to them (reported or acknowledged status)."""
    _require_role(current_user.role, ALL_ELEVATED_ROLES, "view pending incidents")

    rows = (
        db.query(Incident)
        .filter(Incident.organisation_id == current_user.org_id)
        .filter(Incident.workflow_status.in_(["reported", "acknowledged", "under_investigation"]))
        .order_by(Incident.reported_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return rows


@router.post("/{incident_id}/acknowledge", response_model=IncidentWorkflowResponse)
def supervisor_acknowledge(
    incident_id: int,
    payload: SupervisorAcknowledge,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Supervisor acknowledges the incident (30 min SLA target)."""
    _require_role(current_user.role, ALL_ELEVATED_ROLES, "acknowledge incidents")
    incident = _get_incident(db, incident_id, current_user.org_id)

    if incident.workflow_status not in ("reported",):
        raise HTTPException(status_code=400, detail="Incident is not in 'reported' status")

    now = datetime.utcnow()
    incident.workflow_status = "acknowledged"
    incident.acknowledged_at = now
    incident.investigation_status = "Acknowledged"

    db.commit()
    db.refresh(incident)
    return incident


@router.post("/{incident_id}/investigate", response_model=IncidentWorkflowResponse)
def supervisor_investigate(
    incident_id: int,
    payload: SupervisorInvestigate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Supervisor submits investigation results (root cause, 5-Why, CAPA)."""
    _require_role(current_user.role, ALL_ELEVATED_ROLES, "investigate incidents")
    incident = _get_incident(db, incident_id, current_user.org_id)

    if incident.workflow_status not in ("acknowledged", "reported", "under_investigation"):
        raise HTTPException(status_code=400, detail="Incident cannot be investigated in current status")

    now = datetime.utcnow()

    # If first time investigation starts
    if not incident.investigation_started_at:
        incident.investigation_started_at = now

    incident.root_cause = payload.root_cause
    incident.five_why_analysis = payload.five_why_analysis
    incident.immediate_cause = payload.immediate_cause
    incident.immediate_actions_taken = payload.immediate_actions_taken
    incident.root_cause_category = payload.root_cause_category
    incident.severity_classification = payload.severity_classification
    incident.days_away = payload.days_away
    incident.investigation_completed_at = now
    incident.investigation_status = "Completed"
    incident.supervisor_signature = current_user.email

    # Re-run the decision tree with what the investigation established. This is
    # where P1-P5 usually settles: the reporter rarely knows the treatment level
    # or whether the worst case was fatal.
    _apply_severity_and_statutory(
        db, incident,
        treatment_level=payload.treatment_level,
        dangerous_occurrence=payload.dangerous_occurrence,
        worst_case_fatal=payload.worst_case_fatal,
        days_away=payload.days_away,
        occupational_disease=payload.occupational_disease,
        loss_of_consciousness=payload.loss_of_consciousness,
    )

    # Auto-create CAPA if details provided
    if payload.capa_description:
        # WF-04: the CAPA inherits its type from the incident's P1-P5 severity,
        # which sets the deadline. The matrix score needs severity potential and
        # systemic risk, which the supervisor supplies — without them the CAPA
        # still gets a type and due date, just no priority band.
        prio = prioritise(
            severity_potential=payload.capa_severity_potential,
            systemic_risk=payload.capa_systemic_risk,
            capa_type=payload.capa_type,
            incident_priority=incident.severity_priority,
            created_at=now,
        )
        capa = CapaAction(
            organisation_id=current_user.org_id,
            incident_id=incident.id,
            action_type="Corrective",
            description=payload.capa_description,
            root_cause_addressed=payload.root_cause,
            responsible_person_id=payload.capa_responsible_person_id,
            # An explicitly supplied due date wins — a supervisor who sets one
            # has a reason. Otherwise WF-04's rule computes it.
            due_date=payload.capa_due_date or (prio.due_date.date() if prio.due_date else None),
            status="Open",
            severity_potential=prio.severity_potential,
            systemic_risk=prio.systemic_risk,
            priority_score=prio.priority_score,
            priority_band=prio.priority_band,
            capa_type=prio.capa_type,
            capa_type_label=prio.capa_type_label,
            target_hours=prio.target_hours,
            evidence_required=prio.evidence_required,
            priority_explanation=prio.explanation,
        )
        db.add(capa)
        incident.capa_generated = "Yes"

    # Handle escalation
    if payload.escalate:
        incident.workflow_status = "escalated"
        incident.escalation_reason = payload.escalation_reason
        incident.escalated_at = now
        # Find manager to escalate to
        if not incident.escalated_to_manager_id:
            from app.models.role import Role
            mgr = (
                db.query(Employee)
                .join(Role, Employee.role_id == Role.id)
                .filter(Employee.organisation_id == current_user.org_id)
                .filter(Role.role_name.in_(["Manager", "HSE Manager"]))
                .filter(Employee.active_status == "Active")
                .first()
            )
            if mgr:
                incident.escalated_to_manager_id = mgr.id
    else:
        incident.workflow_status = "pending_approval"

    db.commit()
    db.refresh(incident)
    return incident


@router.post("/{incident_id}/escalate", response_model=IncidentWorkflowResponse)
def supervisor_escalate(
    incident_id: int,
    payload: SupervisorEscalate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Supervisor explicitly escalates incident to manager."""
    _require_role(current_user.role, ALL_ELEVATED_ROLES, "escalate incidents")
    incident = _get_incident(db, incident_id, current_user.org_id)

    if incident.workflow_status in ("closed",):
        raise HTTPException(status_code=400, detail="Cannot escalate a closed incident")

    now = datetime.utcnow()
    incident.workflow_status = "escalated"
    incident.escalation_reason = payload.escalation_reason
    incident.escalated_at = now

    if payload.escalated_to_manager_id:
        incident.escalated_to_manager_id = payload.escalated_to_manager_id
    elif not incident.escalated_to_manager_id:
        from app.models.role import Role
        mgr = (
            db.query(Employee)
            .join(Role, Employee.role_id == Role.id)
            .filter(Employee.organisation_id == current_user.org_id)
            .filter(Role.role_name.in_(["Manager", "HSE Manager"]))
            .filter(Employee.active_status == "Active")
            .first()
        )
        if mgr:
            incident.escalated_to_manager_id = mgr.id

    db.commit()
    db.refresh(incident)
    return incident


# ══════════════════════════════════════════════════════════════════════════════
# MANAGER ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/manager-queue", response_model=List[IncidentListItem])
def manager_queue(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Manager sees escalated and pending_approval incidents."""
    _require_role(current_user.role, MANAGER_ROLES, "view manager queue")

    rows = (
        db.query(Incident)
        .filter(Incident.organisation_id == current_user.org_id)
        .filter(Incident.workflow_status.in_(["escalated", "pending_approval"]))
        # MySQL has no NULLS LAST; a DESC sort already orders NULLs last there.
        .order_by(Incident.escalated_at.desc(), Incident.reported_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return rows


@router.post("/{incident_id}/approve-investigation", response_model=IncidentWorkflowResponse)
def manager_approve_investigation(
    incident_id: int,
    payload: ManagerApproveInvestigation,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Manager approves or rejects the investigation."""
    _require_role(current_user.role, MANAGER_ROLES, "approve investigations")
    incident = _get_incident(db, incident_id, current_user.org_id)

    if incident.workflow_status not in ("pending_approval", "escalated"):
        raise HTTPException(status_code=400, detail="Incident is not awaiting manager approval")

    if payload.decision not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Decision must be 'approved' or 'rejected'")

    now = datetime.utcnow()

    if payload.decision == "approved":
        incident.approved_at = now
        incident.workflow_status = "pending_approval"  # Ready for closure
        incident.investigation_status = "Approved"
    else:
        # Send back to supervisor for re-investigation
        incident.workflow_status = "under_investigation"
        incident.investigation_status = "Rejected - Redo"
        incident.investigation_completed_at = None

    db.commit()
    db.refresh(incident)
    return incident


@router.post("/{incident_id}/close", response_model=IncidentWorkflowResponse)
def manager_close_incident(
    incident_id: int,
    payload: ManagerCloseIncident,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Manager formally closes the incident."""
    _require_role(current_user.role, MANAGER_ROLES, "close incidents")
    incident = _get_incident(db, incident_id, current_user.org_id)

    if incident.workflow_status == "closed":
        raise HTTPException(status_code=400, detail="Incident is already closed")

    now = datetime.utcnow()
    incident.workflow_status = "closed"
    incident.closed_at = now
    incident.closure_notes = payload.closure_notes
    incident.regulatory_notified = payload.regulatory_notified
    incident.lessons_learned = payload.lessons_learned
    incident.communicated_to_teams = payload.communicated_to_teams
    incident.manager_signature = current_user.email
    incident.investigation_status = "Closed"

    # ── Stage 08 CLOSE · "update everything" ─────────────────────────────────
    # The event goes in this transaction (outbox): if the close rolls back, so
    # does the intent to cascade. Handlers run after the commit, on their own
    # sessions — a failing downstream consumer must never undo the closure.
    event_id = events.publish(
        db, catalogue.INCIDENT_CLOSED,
        organisation_id=incident.organisation_id,
        subject_family="incident", subject_id=incident.id,
        user_id=current_user.user_id,
        payload={
            "reference": f"INC-{incident.id}",
            "hazard_id": incident.hazard_id,
            "location_station_id": incident.location_station_id,
            "priority": incident.severity_priority,
            "is_hipo": bool(incident.is_hipo),
            "root_cause": incident.root_cause,
            "root_cause_category": incident.root_cause_category,
            "lessons_learned": incident.lessons_learned,
            "involved_employee_id": incident.reported_by,
            "reported_by": incident.reported_by,
        },
    )

    db.commit()
    db.refresh(incident)

    events.dispatch(SessionLocal, event_id)
    return incident


# ══════════════════════════════════════════════════════════════════════════════
# APPENDIX A · statutory notification queue
#
# The platform drafts the obligation. A human authorises it. Appendix A is
# explicit: "All regulatory submissions remain subject to human review and
# authorisation." Nothing here submits to a regulator — recording the
# authorisation is the whole job.
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/statutory/queue")
def statutory_queue(
    include_authorised: bool = Query(False, description="Include already-authorised notifications"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Incidents with an outstanding statutory notification, most urgent first."""
    _require_role(current_user.role, ALL_ELEVATED_ROLES, "view the statutory notification queue")

    q = (
        db.query(Incident)
        .filter(Incident.organisation_id == current_user.org_id)
        .filter(Incident.statutory_reportable == 1)
    )
    if not include_authorised:
        q = q.filter(Incident.statutory_authorised_at.is_(None))

    rows = q.order_by(Incident.statutory_due_at.asc()).limit(200).all()
    now = datetime.utcnow()

    return [
        {
            "id": r.id,
            "reference": f"INC-{r.id}",
            "incident_type": r.incident_type,
            "severity_priority": r.severity_priority,
            "severity_label": r.severity_label,
            "is_hipo": bool(r.is_hipo),
            "jurisdiction": r.statutory_jurisdiction,
            "regulator": r.statutory_regulator,
            "summary": r.statutory_summary,
            "obligations": r.statutory_obligations,
            "due_at": r.statutory_due_at.isoformat() if r.statutory_due_at else None,
            "overdue": bool(r.statutory_due_at and r.statutory_due_at < now and not r.statutory_authorised_at),
            "authorised_at": r.statutory_authorised_at.isoformat() if r.statutory_authorised_at else None,
            "reference_number": r.statutory_reference,
        }
        for r in rows
    ]


@router.post("/{incident_id}/statutory/authorise")
def authorise_statutory_notification(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Record that a manager authorised the statutory notification.

    `statutory_reference` is the regulator's own reference (an HSE RIDDOR case
    number, an OSHA report id) and is captured so the audit trail links our
    record to theirs.
    """
    _require_role(current_user.role, MANAGER_ROLES, "authorise statutory notifications")
    incident = _get_incident(db, incident_id, current_user.org_id)

    if not incident.statutory_reportable:
        raise HTTPException(
            status_code=400,
            detail="This incident has no statutory notification to authorise",
        )
    if incident.statutory_authorised_at:
        raise HTTPException(status_code=400, detail="Statutory notification already authorised")

    emp_id = db.execute(
        text("SELECT employee_id FROM users WHERE id = :uid"), {"uid": current_user.user_id}
    ).scalar()

    incident.statutory_authorised_by = emp_id
    incident.statutory_authorised_at = datetime.utcnow()
    incident.statutory_reference = (payload or {}).get("statutory_reference")
    # Keeps the manager-facing closure flag consistent with the audit record.
    incident.regulatory_notified = "Yes"

    db.commit()
    db.refresh(incident)
    return {
        "success": True,
        "data": {
            "id": incident.id,
            "statutory_authorised_at": incident.statutory_authorised_at.isoformat(),
            "statutory_authorised_by": incident.statutory_authorised_by,
            "statutory_reference": incident.statutory_reference,
        },
    }


# ══════════════════════════════════════════════════════════════════════════════
# SHARED / OVERVIEW ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/all", response_model=List[IncidentListItem])
def list_all_workflow_incidents(
    skip: int = 0,
    limit: int = 100,
    workflow_status: Optional[str] = Query(None, description="Filter by status"),
    severity: Optional[str] = Query(None),
    incident_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """List all incidents for the org with optional filters. Available to all authenticated users."""
    q = db.query(Incident).filter(Incident.organisation_id == current_user.org_id)

    if workflow_status:
        q = q.filter(Incident.workflow_status == workflow_status)
    if severity:
        q = q.filter(Incident.severity == severity)
    if incident_type:
        q = q.filter(Incident.incident_type == incident_type)

    rows = q.order_by(Incident.reported_at.desc(), Incident.created_at.desc()).offset(skip).limit(limit).all()
    return rows


# ══════════════════════════════════════════════════════════════════════════════
# AUDITOR — close-out review
# ══════════════════════════════════════════════════════════════════════════════
@router.get("/audit-list")
def auditor_closeout_list(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Incidents the auditor validates close-out on: investigation finished or the
    incident already closed. Returns the completeness signals the spec asks the
    auditor to check rather than making them open each record.
    """
    rows = (
        db.query(Incident)
        .filter(
            Incident.organisation_id == current_user.org_id,
            Incident.workflow_status.in_(["closed", "approved", "investigated"]),
        )
        .order_by(Incident.closed_at.desc(), Incident.id.desc())
        .limit(100)
        .all()
    )

    return [
        {
            "id": r.id,
            "reference": f"INC-{r.id}",
            "incident_type": r.incident_type,
            "severity": r.severity,
            "workflow_status": r.workflow_status,
            # Completeness checks the auditor signs against
            "investigation_status": r.investigation_status,
            "has_five_why": bool(r.five_why_analysis),
            "closure_notes": r.closure_notes,
            "lessons_learned": r.lessons_learned,
            "communicated_to_teams": r.communicated_to_teams,
            "manager_signature": r.manager_signature,
            "closed_at": r.closed_at.isoformat() if r.closed_at else None,
            "auditor_verified_at": r.auditor_verified_at.isoformat() if r.auditor_verified_at else None,
            "verification_notes": r.verification_notes,
        }
        for r in rows
    ]


@router.post("/{incident_id}/verify")
def auditor_verify_closeout(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Auditor sign-off note on an incident close-out."""
    incident = _get_incident(db, incident_id, current_user.org_id)

    emp_id = db.execute(
        text("SELECT employee_id FROM users WHERE id = :uid"), {"uid": current_user.user_id}
    ).scalar()

    incident.auditor_verified_by = emp_id
    incident.auditor_verified_at = datetime.now()
    incident.verification_notes = (payload or {}).get("verification_notes")
    db.commit()
    db.refresh(incident)

    return {
        "success": True,
        "data": {
            "id": incident.id,
            "auditor_verified_at": incident.auditor_verified_at.isoformat(),
            "verification_notes": incident.verification_notes,
        },
    }


@router.get("/{incident_id}", response_model=IncidentWorkflowResponse)
def get_incident_detail(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get full incident detail with all workflow fields."""
    incident = _get_incident(db, incident_id, current_user.org_id)
    return incident


@router.get("/stats/summary")
def workflow_stats(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Quick summary counts per workflow status for dashboard widgets."""
    from sqlalchemy import func

    org_id = current_user.org_id
    rows = (
        db.query(Incident.workflow_status, func.count(Incident.id))
        .filter(Incident.organisation_id == org_id)
        .group_by(Incident.workflow_status)
        .all()
    )
    counts = {status: count for status, count in rows}
    return {
        "reported": counts.get("reported", 0),
        "acknowledged": counts.get("acknowledged", 0),
        "under_investigation": counts.get("under_investigation", 0),
        "escalated": counts.get("escalated", 0),
        "pending_approval": counts.get("pending_approval", 0),
        "closed": counts.get("closed", 0),
        "total": sum(counts.values()),
    }


# ══════════════════════════════════════════════════════════════════════════════
# CAPA — mobile completion
# CAPA actions are auto-created above when a supervisor's investigation includes
# a capa_description, but nothing else in the app ever moves them past "Open".
# The website's CAPA Closure Rate can only change through this endpoint.
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/capa/my-actions")
def my_capa_actions(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """CAPA actions assigned to the current user (or all open ones for a supervisor/manager)."""
    emp_id = db.execute(
        text("SELECT employee_id FROM users WHERE id = :uid"), {"uid": current_user.user_id}
    ).scalar()

    q = db.query(CapaAction).filter(CapaAction.organisation_id == current_user.org_id)
    if _role_matches(current_user.role, ALL_ELEVATED_ROLES):
        q = q.filter(CapaAction.status != "Completed")
    else:
        q = q.filter(CapaAction.responsible_person_id == emp_id, CapaAction.status != "Completed")
    rows = q.order_by(CapaAction.id.desc()).limit(100).all()
    return [
        {
            "id": c.id,
            "incident_id": c.incident_id,
            "action_type": c.action_type,
            "description": c.description,
            "responsible_person_id": c.responsible_person_id,
            "due_date": c.due_date.isoformat() if c.due_date else None,
            "status": c.status,
        }
        for c in rows
    ]


@router.post("/capa/{capa_id}/complete")
def complete_capa_action(
    capa_id: int,
    payload: CapaComplete,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Marks a CAPA action done — the responsible person, or a supervisor/manager, may close it."""
    capa = db.query(CapaAction).filter(
        CapaAction.id == capa_id, CapaAction.organisation_id == current_user.org_id
    ).first()
    if not capa:
        raise HTTPException(status_code=404, detail="CAPA action not found")

    emp_id = db.execute(
        text("SELECT employee_id FROM users WHERE id = :uid"), {"uid": current_user.user_id}
    ).scalar()
    is_owner = emp_id is not None and capa.responsible_person_id == emp_id
    if not is_owner and not _role_matches(current_user.role, ALL_ELEVATED_ROLES):
        raise HTTPException(status_code=403, detail="Not authorized to close this CAPA action")

    capa.status = "Completed"
    if payload.effectiveness_rating is not None:
        capa.effectiveness_rating = payload.effectiveness_rating
    db.commit()
    db.refresh(capa)
    return {
        "id": capa.id,
        "status": capa.status,
        "effectiveness_rating": capa.effectiveness_rating,
    }
