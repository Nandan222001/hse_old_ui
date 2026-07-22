"""Hazard register workflow (flow 5): log → review → auditor verification.

    worker/supr  POST /hazard-register/log         → open
    any          GET  /hazard-register             (register, filterable by status)
    worker       GET  /hazard-register/my-logs
    supr/mgr     POST /{id}/review                 → under_review | controlled | closed
    auditor      GET  /hazard-register/audit-list  (open / under_review hazards)
    auditor      POST /{id}/verify                 → records that it is being managed

Writes to the `hazards` register. The website's catalog reads (hazard_name / severity /
probability) are untouched; the lifecycle rides on the additive columns from migration 031.
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
from app.schemas.hazard_register import (
    HazardLog,
    HazardRegisterResponse,
    HazardReview,
    HazardVerify,
)

router = APIRouter(prefix="/hazard-register", tags=["Hazard Register"])

OPEN_STATUSES = ["open", "under_review"]
VALID_STATUSES = {"open", "under_review", "controlled", "closed"}


def _get(db: Session, hazard_id: int, org_id: Optional[int]) -> Hazard:
    row = db.query(Hazard).filter(Hazard.id == hazard_id).first()
    if not row or (org_id is not None and row.organisation_id not in (None, org_id)):
        raise HTTPException(status_code=404, detail="Hazard not found")
    return row


def _respond(row) -> HazardRegisterResponse:
    return HazardRegisterResponse.model_validate(row)


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
