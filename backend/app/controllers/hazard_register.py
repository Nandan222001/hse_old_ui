"""Hazard register workflow (flow 5), on the same eight stages as every other
safety event.

    01 RECORD   a draft in event_drafts (family `hazard_register`)
    02 ASSESS   open              — logged, awaiting review
    03 RESPOND  interim_control   — temporary control while the permanent one is designed
    04 INVESTIGATE under_review   — establishing what the real control must be
    05 IMPROVE  controls_planned  — permanent controls specified, work outstanding
    06 VERIFY   pending_verification
    07 LEARN    controlled        — control confirmed effective, lesson owed
    08 CLOSE    closed

    worker/supr  POST /hazard-register/log            → open
    any          GET  /hazard-register                (register, filterable by status)
    worker       GET  /hazard-register/my-logs
    supr/mgr     POST /{id}/review                    → any status above
    supr/mgr     POST /{id}/verify-controls           → controlled | back to controls_planned
    supr/mgr     POST /{id}/close                     → closed
    auditor      GET  /hazard-register/audit-list     (hazards still being managed)
    auditor      POST /{id}/verify                    → records that it is being managed

Writes to the `hazards` register. The website's catalog reads (hazard_name / severity /
probability) are untouched; the lifecycle rides on the additive columns from migration 031.

Note this is the *standing register*, family `hazard_register`. The worker-reported
hazard is family `hazard` on `risk_reports` and runs the report workflow — two
different things that were previously pointed at the same stage mapping, which is
why every register entry resolved to no stage at all.
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.core.dependencies import CurrentUser, get_current_user
from app.controllers.workflow_common import (
    AUDITOR_ROLES,
    MANAGER_ROLES,
    ALL_ELEVATED_ROLES,
    employee_id_for,
    require_role,
    station_id_for,
)
from app.models.hazard import Hazard
from app.services import workflow_stages
from app.schemas.hazard_register import (
    HazardLog,
    HazardRegisterResponse,
    HazardReview,
    HazardVerify,
    HazardVerifyControls,
)

router = APIRouter(prefix="/hazard-register", tags=["Hazard Register"])

# Everything that is still being managed — i.e. has not reached CLOSE. The
# auditor's list and the "open" count both read this, so a hazard sitting in any
# of the new middle stages stays visible instead of silently dropping out.
OPEN_STATUSES = [
    "open", "interim_control", "under_review", "controls_planned", "pending_verification",
]
VALID_STATUSES = {
    "open",                 # 02 ASSESS
    "interim_control",      # 03 RESPOND
    "under_review",         # 04 INVESTIGATE
    "controls_planned",     # 05 IMPROVE
    "pending_verification", # 06 VERIFY
    "controlled",           # 07 LEARN
    "closed",               # 08 CLOSE
}


def _get(db: Session, hazard_id: int, org_id: Optional[int]) -> Hazard:
    row = db.query(Hazard).filter(Hazard.id == hazard_id).first()
    if not row or (org_id is not None and row.organisation_id not in (None, org_id)):
        raise HTTPException(status_code=404, detail="Hazard not found")
    return row


def _respond(row) -> HazardRegisterResponse:
    out = HazardRegisterResponse.model_validate(row)
    # Derived on the way out from register_status, never stored, so the stage
    # cannot drift from the status every existing query reads.
    st = workflow_stages.describe("hazard_register", row.register_status)
    out.stage = st.get("stage")
    out.stage_number = st.get("stage_number")
    out.stage_label = st.get("stage_label")
    out.completed_stages = st.get("completed_stages") or []
    out.total_stages = st.get("total_stages")
    return out


def _resolve_category_id(db: Session, given: Optional[int], org_id: Optional[int]) -> Optional[int]:
    """hazards.category_id is NOT NULL, but a worker logging a field hazard may not
    pick one — fall back to any category in the org so the log still succeeds."""
    if given:
        return given
    row = db.execute(
        text(
            "SELECT id FROM hazard_categories "
            "WHERE organisation_id = :org OR organisation_id IS NULL "
            "ORDER BY (organisation_id = :org) DESC LIMIT 1"
        ),
        {"org": org_id},
    ).mappings().first()
    if row:
        return row["id"]
    row = db.execute(text("SELECT id FROM hazard_categories LIMIT 1")).mappings().first()
    return row["id"] if row else None


# ══════════════════════════════════════════════════════════════════════════════
# LOG (worker / supervisor)
# ══════════════════════════════════════════════════════════════════════════════
@router.post("/log", response_model=HazardRegisterResponse, status_code=201)
def log_hazard(
    payload: HazardLog,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    now = datetime.now()
    data = payload.model_dump()
    row = Hazard(
        organisation_id=current_user.org_id,
        category_id=_resolve_category_id(db, data.get("category_id"), current_user.org_id),
        hazard_name=data.get("hazard_name"),
        severity=data.get("severity"),
        probability=data.get("probability"),
        description=data.get("description"),
        location_station_id=(
            data.get("location_station_id")
            or station_id_for(db, data.get("location"), current_user.org_id)
        ),
        controls=data.get("controls"),
        gps_latitude=data.get("gps_latitude"),
        gps_longitude=data.get("gps_longitude"),
        register_status="open",
        logged_by=employee_id_for(db, current_user.user_id),
        logged_at=now,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _respond(row)


@router.get("", response_model=List[HazardRegisterResponse])
@router.get("/", response_model=List[HazardRegisterResponse])
def list_register(
    skip: int = 0,
    limit: int = 100,
    register_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    q = db.query(Hazard).filter(Hazard.organisation_id == current_user.org_id)
    if register_status:
        q = q.filter(Hazard.register_status == register_status)
    rows = q.order_by(Hazard.id.desc()).offset(skip).limit(limit).all()
    return [_respond(r) for r in rows]


@router.get("/my-logs", response_model=List[HazardRegisterResponse])
def my_logs(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    emp_id = employee_id_for(db, current_user.user_id)
    rows = (
        db.query(Hazard)
        .filter(Hazard.organisation_id == current_user.org_id)
        .filter(Hazard.logged_by == emp_id)
        .order_by(Hazard.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_respond(r) for r in rows]


# ══════════════════════════════════════════════════════════════════════════════
# REVIEW (supervisor / manager)
# ══════════════════════════════════════════════════════════════════════════════
@router.post("/{hazard_id}/review", response_model=HazardRegisterResponse)
def review_hazard(
    hazard_id: int,
    payload: HazardReview,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    require_role(current_user.role, ALL_ELEVATED_ROLES, "review hazards")
    row = _get(db, hazard_id, current_user.org_id)
    if payload.register_status is not None:
        if payload.register_status not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status '{payload.register_status}'")
        row.register_status = payload.register_status
    if payload.review_notes is not None:
        row.review_notes = payload.review_notes
    if payload.controls is not None:
        row.controls = payload.controls
    if payload.severity is not None:
        row.severity = payload.severity
    row.reviewed_by = employee_id_for(db, current_user.user_id)
    row.reviewed_at = datetime.now()
    db.commit()
    db.refresh(row)
    return _respond(row)


@router.post("/{hazard_id}/verify-controls", response_model=HazardRegisterResponse)
def verify_controls(
    hazard_id: int,
    payload: HazardVerifyControls,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Stage 06 VERIFY — did the permanent control actually work?

    Answering no returns the hazard to IMPROVE. A control that did not hold
    means the hazard is still live, and marking it `controlled` on the strength
    of a plan rather than a check is exactly what this stage prevents.
    """
    require_role(current_user.role, ALL_ELEVATED_ROLES, "verify hazard controls")
    row = _get(db, hazard_id, current_user.org_id)

    if row.register_status not in ("pending_verification", "controls_planned"):
        raise HTTPException(
            status_code=400,
            detail="This hazard has no control awaiting verification",
        )

    row.register_status = "controlled" if payload.effective else "controls_planned"
    if payload.verification_notes is not None:
        row.review_notes = payload.verification_notes
    row.reviewed_by = employee_id_for(db, current_user.user_id)
    row.reviewed_at = datetime.now()
    db.commit()
    db.refresh(row)
    return _respond(row)


@router.post("/{hazard_id}/close", response_model=HazardRegisterResponse)
def close_hazard(
    hazard_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Stage 08 CLOSE.

    Only from LEARN. Closing a hazard whose control was never verified is the
    failure this gate exists to prevent — the register would then claim a
    hazard is dealt with on the strength of a plan.
    """
    require_role(current_user.role, ALL_ELEVATED_ROLES, "close hazards")
    row = _get(db, hazard_id, current_user.org_id)

    if row.register_status == "closed":
        raise HTTPException(status_code=400, detail="Hazard is already closed")
    if row.register_status != "controlled":
        st = workflow_stages.describe("hazard_register", row.register_status)
        raise HTTPException(
            status_code=400,
            detail=(
                f"Hazard is at stage {st.get('stage_number')} "
                f"{st.get('stage_label') or row.register_status} and cannot be closed yet. "
                "Its controls must be planned and verified effective first."
            ),
        )

    row.register_status = "closed"
    row.reviewed_by = employee_id_for(db, current_user.user_id)
    row.reviewed_at = datetime.now()
    db.commit()
    db.refresh(row)
    return _respond(row)


# ══════════════════════════════════════════════════════════════════════════════
# AUDITOR
# ══════════════════════════════════════════════════════════════════════════════
@router.get("/audit-list", response_model=List[HazardRegisterResponse])
def auditor_audit_list(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Open / under-review hazards the auditor checks are being managed on site."""
    require_role(current_user.role, AUDITOR_ROLES | MANAGER_ROLES, "audit hazards")
    rows = (
        db.query(Hazard)
        .filter(Hazard.organisation_id == current_user.org_id)
        .filter(Hazard.register_status.in_(OPEN_STATUSES))
        .order_by(Hazard.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_respond(r) for r in rows]


@router.post("/{hazard_id}/verify", response_model=HazardRegisterResponse)
def auditor_verify(
    hazard_id: int,
    payload: HazardVerify,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    require_role(current_user.role, AUDITOR_ROLES | MANAGER_ROLES, "verify hazards")
    row = _get(db, hazard_id, current_user.org_id)
    row.auditor_verified_by = employee_id_for(db, current_user.user_id)
    row.auditor_verified_at = datetime.now()
    if payload.verification_notes is not None:
        row.verification_notes = payload.verification_notes
    db.commit()
    db.refresh(row)
    return _respond(row)


@router.get("/stats/summary")
def register_stats(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    rows = (
        db.query(Hazard.register_status)
        .filter(Hazard.organisation_id == current_user.org_id)
        .all()
    )
    counts = {}
    for (st,) in rows:
        counts[st or "unknown"] = counts.get(st or "unknown", 0) + 1
    return {
        "total": len(rows),
        "by_status": counts,
        "open": sum(counts.get(s, 0) for s in OPEN_STATUSES),
    }
