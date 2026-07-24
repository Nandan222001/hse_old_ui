"""Auditor workflow — schedule audits (manager) and submit findings (auditor).

Data written here is org-scoped, so a submitted audit surfaces in the web
Compliance section exactly like the other roles' mobile submissions.
"""
import json
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.core.dependencies import get_current_user, CurrentUser
from app.models.audit import Audit
from app.schemas.audit import AuditCreate, AuditSubmit, AuditResponse, ChecklistItemIn

router = APIRouter(prefix="/audits", tags=["Audits"])

AUDITOR_ROLES = {"auditor"}
ASSIGNER_ROLES = {"manager", "hse manager", "admin", "superadmin", "safety_manager", "safety manager", "director"}


def _role(user: CurrentUser) -> str:
    return (user.role or "").strip().lower()


def _derive_score(items: List[ChecklistItemIn]) -> int:
    """Compliance % = passes / (passes + fails); 'na' rows are excluded."""
    considered = [i for i in items if (i.response or "").lower() in ("pass", "fail")]
    if not considered:
        return 0
    passes = sum(1 for i in considered if (i.response or "").lower() == "pass")
    return round(passes / len(considered) * 100)


def _to_response(a: Audit) -> AuditResponse:
    findings = []
    if a.findings_json:
        try:
            findings = [ChecklistItemIn(**it) for it in json.loads(a.findings_json)]
        except Exception:
            findings = []
    return AuditResponse(
        id=a.id, organisation_id=a.organisation_id, title=a.title,
        checklist_type=a.checklist_type, site_id=a.site_id, site_name=a.site_name,
        department=a.department, auditor_id=a.auditor_id, scheduled_date=a.scheduled_date,
        due_date=a.due_date, status=a.status, priority=a.priority, progress=a.progress,
        compliance_score=a.compliance_score, findings=findings, submitted_at=a.submitted_at,
    )


@router.get("/", response_model=List[AuditResponse])
def list_audits(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Auditors see the audits assigned to them; managers/admins see all org audits."""
    q = db.query(Audit).filter(Audit.organisation_id == current_user.org_id)
    if _role(current_user) in AUDITOR_ROLES:
        q = q.filter(Audit.auditor_id == current_user.user_id)
    return [_to_response(a) for a in q.order_by(Audit.due_date.asc(), Audit.id.desc()).all()]


@router.get("/{audit_id}", response_model=AuditResponse)
def get_audit(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    a = db.query(Audit).filter(Audit.id == audit_id, Audit.organisation_id == current_user.org_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Audit not found")
    return _to_response(a)


@router.post("/", response_model=AuditResponse, status_code=status.HTTP_201_CREATED)
def create_audit(
    payload: AuditCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Manager/admin schedules an audit and assigns it to an auditor."""
    if _role(current_user) not in ASSIGNER_ROLES:
        raise HTTPException(status_code=403, detail=f"Role '{current_user.role}' cannot schedule audits")
    a = Audit(
        organisation_id=current_user.org_id,
        title=payload.title,
        checklist_type=payload.checklist_type,
        site_id=payload.site_id,
        site_name=payload.site_name,
        department=payload.department,
        auditor_id=payload.auditor_id,
        scheduled_date=payload.scheduled_date,
        due_date=payload.due_date,
        status="scheduled",
        priority=payload.priority or "Med",
        progress=0,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return _to_response(a)


@router.post("/{audit_id}/submit", response_model=AuditResponse)
def submit_audit(
    audit_id: int,
    payload: AuditSubmit,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Auditor submits the completed checklist → status=completed, compliance_score set."""
    if _role(current_user) not in AUDITOR_ROLES:
        raise HTTPException(status_code=403, detail=f"Role '{current_user.role}' is not an auditor")
    a = db.query(Audit).filter(Audit.id == audit_id, Audit.organisation_id == current_user.org_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Audit not found")

    score = payload.compliance_score if payload.compliance_score is not None else _derive_score(payload.items)
    a.findings_json = json.dumps([i.model_dump() for i in payload.items])
    a.compliance_score = score
    a.status = "completed"
    a.progress = 100
    a.submitted_at = datetime.utcnow()
    db.commit()
    db.refresh(a)
    return _to_response(a)
