"""
Role-based Incident Reporting Workflow Controller.

Flow: Worker reports → Supervisor acknowledges & investigates → Manager approves & closes.

Endpoints are role-aware: the current_user.role determines what actions are allowed.
"""
from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.core.dependencies import get_current_user, CurrentUser
from app.models.incident import Incident
from app.models.capa_action import CapaAction
from app.models.employee import Employee
from app.schemas.incident_workflow import (
    WorkerIncidentReport,
    SupervisorAcknowledge,
    SupervisorInvestigate,
    SupervisorEscalate,
    ManagerApproveInvestigation,
    ManagerCloseIncident,
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
    )
    db.add(incident)
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

    # Auto-create CAPA if details provided
    if payload.capa_description:
        capa = CapaAction(
            organisation_id=current_user.org_id,
            incident_id=incident.id,
            action_type="Corrective",
            description=payload.capa_description,
            root_cause_addressed=payload.root_cause,
            responsible_person_id=payload.capa_responsible_person_id,
            due_date=payload.capa_due_date,
            status="Open",
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

    db.commit()
    db.refresh(incident)
    return incident


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
