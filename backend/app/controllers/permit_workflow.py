"""Permit to Work workflow (flow 6): Worker → Supervisor → Manager → Auditor.

    worker    POST /permit-workflow/request            → requested
    worker    GET  /permit-workflow/my-permits
    supr      GET  /permit-workflow/pending-review      (requested)
    supr      POST /{id}/acknowledge                    → acknowledged
    mgr       GET  /permit-workflow/manager-queue       (requested | acknowledged)
    mgr       POST /{id}/approve                        → approved   (status='Active')
    mgr       POST /{id}/reject                         → rejected   (status='Rejected')
    mgr       GET  /permit-workflow/active              (monitoring)
    auditor   GET  /permit-workflow/audit-list          (active permits to verify)
    auditor   POST /{id}/verify                         → records on-site verification

Writes to permits_to_work. The website's dashboard counts status='Active', so approval
sets BOTH workflow_status='approved' and status='Active'; nothing else touches status.
"""
from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.core.dependencies import CurrentUser, get_current_user
from app.controllers.workflow_common import (
    AUDITOR_ROLES,
    MANAGER_ROLES,
    SUPERVISOR_ROLES,
    ALL_ELEVATED_ROLES,
    employee_id_for,
    require_role,
    station_id_for,
)
from app.models.permit_to_work import PermitToWork
from app.schemas.permit_workflow import (
    PermitAcknowledge,
    PermitApprove,
    PermitListItem,
    PermitReject,
    PermitRequest,
    PermitClose,
    PermitVerify,
    PermitWorkflowResponse,
)

router = APIRouter(prefix="/permit-workflow", tags=["Permit Workflow"])

SUPERVISOR_QUEUE = ["requested"]
MANAGER_QUEUE = ["requested", "acknowledged"]


def _permit_ref(row) -> str:
    return f"PTW-{row.id:04d}"


def _get(db: Session, permit_id: int, org_id: Optional[int]) -> PermitToWork:
    q = db.query(PermitToWork).filter(PermitToWork.id == permit_id)
    row = q.first()
    if not row or (org_id is not None and row.organisation_id not in (None, org_id)):
        raise HTTPException(status_code=404, detail="Permit not found")
    return row


def _resolve_permit_type_id(db: Session, data: dict, org_id: Optional[int]) -> Optional[int]:
    if data.get("permit_type_id"):
        return data["permit_type_id"]
    name = data.get("permit_type")
    if name:
        row = db.execute(
            text("SELECT id FROM permit_types WHERE permit_type_name LIKE :n LIMIT 1"),
            {"n": f"%{name.replace('_', ' ')}%"},
        ).mappings().first()
        if row:
            return row["id"]
    row = db.execute(text("SELECT id FROM permit_types LIMIT 1")).mappings().first()
    return row["id"] if row else None


def _respond(row) -> PermitWorkflowResponse:
    return PermitWorkflowResponse(
        id=row.id,
        permit_ref=_permit_ref(row),
        permit_type_id=row.permit_type_id,
        workflow_status=row.workflow_status,
        status=row.status,
        work_description=row.work_description,
        location_station_id=row.location_station_id,
        duration_requested_hours=row.duration_requested_hours,
        number_of_workers=row.number_of_workers,
        validity_start=row.validity_start,
        validity_end=row.validity_end,
        requested_by=row.requested_by,
        requested_at=row.requested_at,
        acknowledged_by=row.acknowledged_by,
        acknowledged_at=row.acknowledged_at,
        supervisor_notes=row.supervisor_notes,
        approved_by=row.approved_by,
        approved_at=row.approved_at,
        rejected_at=row.rejected_at,
        rejection_reason=row.rejection_reason,
        auditor_verified_by=row.auditor_verified_by,
        auditor_verified_at=row.auditor_verified_at,
        verification_result=row.verification_result,
        verification_notes=row.verification_notes,
    )


def _list(rows) -> List[PermitListItem]:
    return [
        PermitListItem(
            id=r.id,
            permit_ref=_permit_ref(r),
            permit_type_id=r.permit_type_id,
            workflow_status=r.workflow_status,
            status=r.status,
            work_description=r.work_description,
            location_station_id=r.location_station_id,
            requested_by=r.requested_by,
            requested_at=r.requested_at,
            validity_end=r.validity_end,
        )
        for r in rows
    ]


# ══════════════════════════════════════════════════════════════════════════════
# WORKER
# ══════════════════════════════════════════════════════════════════════════════
@router.post("/request", response_model=PermitWorkflowResponse, status_code=201)
def worker_request_permit(
    payload: PermitRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    now = datetime.now()
    data = payload.model_dump()
    emp_id = employee_id_for(db, current_user.user_id)

    row = PermitToWork(
        organisation_id=current_user.org_id,
        permit_type_id=_resolve_permit_type_id(db, data, current_user.org_id),
        date_issued=data.get("date_issued") or date.today(),
        time_issued=data.get("time_issued"),
        location_station_id=(
            data.get("location_station_id")
            or station_id_for(db, data.get("location"), current_user.org_id)
        ),
        work_description=data.get("work_description"),
        duration_requested_hours=data.get("duration_requested_hours"),
        number_of_workers=data.get("number_of_workers"),
        validity_start=data.get("validity_start"),
        validity_end=data.get("validity_end"),
        issued_by=emp_id,
        status="Pending",
        workflow_status="requested",
        requested_by=emp_id,
        requested_at=now,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _respond(row)


@router.get("/my-permits", response_model=List[PermitListItem])
def worker_my_permits(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    emp_id = employee_id_for(db, current_user.user_id)
    rows = (
        db.query(PermitToWork)
        .filter(PermitToWork.organisation_id == current_user.org_id)
        .filter(PermitToWork.requested_by == emp_id)
        .order_by(PermitToWork.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return _list(rows)


# ══════════════════════════════════════════════════════════════════════════════
# SUPERVISOR
# ══════════════════════════════════════════════════════════════════════════════
@router.get("/pending-review", response_model=List[PermitListItem])
def supervisor_pending_review(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    require_role(current_user.role, ALL_ELEVATED_ROLES, "view pending permits")
    rows = (
        db.query(PermitToWork)
        .filter(PermitToWork.organisation_id == current_user.org_id)
        .filter(PermitToWork.workflow_status.in_(SUPERVISOR_QUEUE))
        .order_by(PermitToWork.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return _list(rows)


@router.post("/{permit_id}/acknowledge", response_model=PermitWorkflowResponse)
def supervisor_acknowledge(
    permit_id: int,
    payload: PermitAcknowledge,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    require_role(current_user.role, ALL_ELEVATED_ROLES, "acknowledge permits")
    row = _get(db, permit_id, current_user.org_id)
    row.workflow_status = "acknowledged"
    row.acknowledged_at = datetime.now()
    row.acknowledged_by = employee_id_for(db, current_user.user_id)
    if payload.supervisor_notes is not None:
        row.supervisor_notes = payload.supervisor_notes
    db.commit()
    db.refresh(row)
    return _respond(row)


# ══════════════════════════════════════════════════════════════════════════════
# MANAGER
# ══════════════════════════════════════════════════════════════════════════════
@router.get("/manager-queue", response_model=List[PermitListItem])
def manager_queue(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    require_role(current_user.role, MANAGER_ROLES, "view the permit manager queue")
    rows = (
        db.query(PermitToWork)
        .filter(PermitToWork.organisation_id == current_user.org_id)
        .filter(PermitToWork.workflow_status.in_(MANAGER_QUEUE))
        .order_by(PermitToWork.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return _list(rows)


@router.post("/{permit_id}/approve", response_model=PermitWorkflowResponse)
def manager_approve(
    permit_id: int,
    payload: PermitApprove,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    require_role(current_user.role, MANAGER_ROLES, "approve permits")
    row = _get(db, permit_id, current_user.org_id)
    row.workflow_status = "approved"
    row.status = "Active"  # website dashboard counts active permits by this field
    row.approved_at = datetime.now()
    row.approved_by = employee_id_for(db, current_user.user_id)
    if payload.validity_start is not None:
        row.validity_start = payload.validity_start
    if payload.validity_end is not None:
        row.validity_end = payload.validity_end
    db.commit()
    db.refresh(row)
    return _respond(row)


@router.post("/{permit_id}/reject", response_model=PermitWorkflowResponse)
def manager_reject(
    permit_id: int,
    payload: PermitReject,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    require_role(current_user.role, MANAGER_ROLES, "reject permits")
    row = _get(db, permit_id, current_user.org_id)
    row.workflow_status = "rejected"
    row.status = "Rejected"
    row.rejected_at = datetime.now()
    row.rejection_reason = payload.rejection_reason
    db.commit()
    db.refresh(row)
    return _respond(row)


@router.get("/active", response_model=List[PermitListItem])
def active_permits(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Approved / active permits — the manager's monitoring view."""
    require_role(current_user.role, ALL_ELEVATED_ROLES, "monitor active permits")
    rows = (
        db.query(PermitToWork)
        .filter(PermitToWork.organisation_id == current_user.org_id)
        .filter(PermitToWork.workflow_status == "approved")
        .order_by(PermitToWork.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return _list(rows)


# ══════════════════════════════════════════════════════════════════════════════
# AUDITOR
# ══════════════════════════════════════════════════════════════════════════════
@router.get("/audit-list", response_model=List[PermitListItem])
def auditor_audit_list(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Active permits the auditor checks are valid and physically displayed on site."""
    require_role(current_user.role, AUDITOR_ROLES | MANAGER_ROLES, "audit permits")
    rows = (
        db.query(PermitToWork)
        .filter(PermitToWork.organisation_id == current_user.org_id)
        .filter(PermitToWork.workflow_status == "approved")
        .order_by(PermitToWork.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return _list(rows)


@router.post("/{permit_id}/verify", response_model=PermitWorkflowResponse)
def auditor_verify(
    permit_id: int,
    payload: PermitVerify,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    require_role(current_user.role, AUDITOR_ROLES | MANAGER_ROLES, "verify permits")
    row = _get(db, permit_id, current_user.org_id)
    row.auditor_verified_by = employee_id_for(db, current_user.user_id)
    row.auditor_verified_at = datetime.now()
    row.verification_result = payload.verification_result
    if payload.verification_notes is not None:
        row.verification_notes = payload.verification_notes
    db.commit()
    db.refresh(row)
    return _respond(row)


@router.post("/{permit_id}/close", response_model=PermitWorkflowResponse)
def supervisor_close(
    permit_id: int,
    payload: PermitClose,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Closes out a permit at end of work. Sets status='Closed', which is what the
    PTW Compliance Rate counts as "properly closed", and records whether the work
    deviated from the permit (drives LOTO Compliance % and Permit Deviation Rate).
    """
    require_role(current_user.role, SUPERVISOR_ROLES | MANAGER_ROLES, "close permits")
    row = _get(db, permit_id, current_user.org_id)

    def _yes_no(value: str) -> str:
        return "Yes" if str(value or "").strip().lower() in ("yes", "true", "1") else "No"

    row.status = "Closed"
    row.workflow_status = "closed"
    row.deviation_reported = _yes_no(payload.deviation_reported)
    row.incident_occurred = _yes_no(payload.incident_occurred)
    row.work_start_actual = payload.work_start_actual or row.work_start_actual
    # Falling back to "now" means a closed permit always has an end time for the
    # duration analytics, even if the supervisor did not type one in.
    row.work_end_actual = payload.work_end_actual or row.work_end_actual or datetime.now()
    if payload.supervisor_notes is not None:
        row.supervisor_notes = payload.supervisor_notes

    db.commit()
    db.refresh(row)
    return _respond(row)


# ══════════════════════════════════════════════════════════════════════════════
# SHARED
# ══════════════════════════════════════════════════════════════════════════════
@router.get("/stats/summary")
def permit_stats(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    rows = (
        db.query(PermitToWork.workflow_status)
        .filter(PermitToWork.organisation_id == current_user.org_id)
        .all()
    )
    counts = {}
    for (st,) in rows:
        counts[st or "unknown"] = counts.get(st or "unknown", 0) + 1
    return {
        "total": len(rows),
        "by_status": counts,
        "pending_supervisor": sum(counts.get(s, 0) for s in SUPERVISOR_QUEUE),
        "pending_manager": sum(counts.get(s, 0) for s in MANAGER_QUEUE),
        "active": counts.get("approved", 0),
    }


@router.get("/{permit_id}", response_model=PermitWorkflowResponse)
def get_permit(
    permit_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return _respond(_get(db, permit_id, current_user.org_id))
