"""Auditor workflow, on the same eight stages as every other safety event.

    01 RECORD      scheduled          — booked, not started
    02 ASSESS      in_progress        — picked up, scope confirmed
    03 RESPOND     immediate_action   — a critical finding stops the job first
    04 INVESTIGATE fieldwork          — working the checklist on site
    05 IMPROVE     findings_raised    — corrective actions owed
                   capa_open
    06 VERIFY      pending_review     — findings actioned, resolution unconfirmed
    07 LEARN       verified           — confirmed, lesson owed
    08 CLOSE       completed

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
from app.controllers.workflow_common import employee_id_for
from app.models.audit import Audit
from app.services import workflow_stages
from app.utils.logger import get_logger

logger = get_logger(__name__)
from app.schemas.audit import (
    AuditCreate,
    AuditResponse,
    AuditSubmit,
    AuditVerify,
    ChecklistItemIn,
)

router = APIRouter(prefix="/audits", tags=["Audits"])

AUDITOR_ROLES = {"auditor"}
ASSIGNER_ROLES = {"manager", "hse manager", "admin", "superadmin", "safety_manager", "safety manager", "director"}

# Default checklist questions seeded when a manager schedules an audit without
# supplying its own items, so the auditor's mobile app always has real content.
_GENERIC_TEMPLATE = [
    {"title": "PPE Compliance", "question": "Are all personnel wearing the required PPE for this area?"},
    {"title": "Housekeeping", "question": "Are walkways, exits and work areas clear of hazards and debris?"},
    {"title": "Emergency Readiness", "question": "Are fire extinguishers, alarms and exits accessible and in date?"},
    {"title": "Equipment Guarding", "question": "Are moving parts and machinery properly guarded?"},
    {"title": "Documentation", "question": "Are permits, SOPs and inspection records available and current?"},
]
_TEMPLATES_BY_TYPE = {
    "safety management system": [
        {"title": "Policy & Objectives", "question": "Is the HSE policy documented, signed and communicated?"},
        {"title": "Risk Assessments", "question": "Are current risk assessments in place for all key activities?"},
        {"title": "Training Records", "question": "Are competency and induction records complete and up to date?"},
        {"title": "Incident Management", "question": "Are incidents investigated with corrective actions closed out?"},
        {"title": "Management Review", "question": "Has a management review been conducted within the period?"},
    ],
    "fire safety": [
        {"title": "Extinguishers", "question": "Are extinguishers present, charged and inspected?"},
        {"title": "Exit Routes", "question": "Are emergency exits unobstructed and clearly signed?"},
        {"title": "Alarm System", "question": "Was the fire alarm tested and functional?"},
        {"title": "Emergency Lighting", "question": "Is emergency lighting operational on all routes?"},
    ],
}


def _template_for(checklist_type: str | None) -> list[dict]:
    key = (checklist_type or "").strip().lower()
    for k, items in _TEMPLATES_BY_TYPE.items():
        if k in key:
            return items
    return _GENERIC_TEMPLATE


def _role(user: CurrentUser) -> str:
    return (user.role or "").strip().lower()


def _owned(db: Session, audit_id: int, current_user: CurrentUser) -> Audit:
    """The audit, and only if this auditor holds it."""
    a = db.query(Audit).filter(
        Audit.id == audit_id, Audit.organisation_id == current_user.org_id
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Audit not found")
    if _role(current_user) in AUDITOR_ROLES and a.auditor_id not in (None, current_user.user_id):
        raise HTTPException(status_code=403, detail="This audit is assigned to someone else")
    return a


def _has_open_audit_capa(db: Session, audit_id: int) -> bool:
    """Any corrective action raised off this audit still outstanding?"""
    from app.models.capa_action import CapaAction

    return (
        db.query(CapaAction.id)
        .filter(CapaAction.subject_family == "audit", CapaAction.subject_id == audit_id)
        .filter(CapaAction.status != "Completed")
        .first()
        is not None
    )


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
    # Derived from `status` on the way out, never stored, so the stage cannot
    # drift from the status the rest of the system reads.
    st = workflow_stages.describe("audit", a.status)
    return AuditResponse(
        id=a.id, organisation_id=a.organisation_id, title=a.title,
        checklist_type=a.checklist_type, site_id=a.site_id, site_name=a.site_name,
        department=a.department, shift=a.shift, auditor_id=a.auditor_id, scheduled_date=a.scheduled_date,
        due_date=a.due_date, status=a.status, priority=a.priority, progress=a.progress,
        compliance_score=a.compliance_score, findings=findings, submitted_at=a.submitted_at,
        stage=st.get("stage"), stage_number=st.get("stage_number"),
        stage_label=st.get("stage_label"),
        completed_stages=st.get("completed_stages") or [],
        total_stages=st.get("total_stages"),
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

    # Seed the checklist: use supplied items, else a template for the checklist type.
    if payload.items:
        seed = [i.model_dump() for i in payload.items]
    else:
        seed = [{"title": t["title"], "question": t["question"]} for t in _template_for(payload.checklist_type)]
    for idx, it in enumerate(seed, start=1):
        it.setdefault("id", idx)
        it.setdefault("response", None)
        it.setdefault("remarks", "")
        it.setdefault("photo_attached", False)

    a = Audit(
        organisation_id=current_user.org_id,
        title=payload.title,
        checklist_type=payload.checklist_type,
        site_id=payload.site_id,
        site_name=payload.site_name,
        department=payload.department,
        shift=payload.shift,
        auditor_id=payload.auditor_id,
        scheduled_date=payload.scheduled_date,
        due_date=payload.due_date,
        status="scheduled",
        priority=payload.priority or "Med",
        progress=0,
        findings_json=json.dumps(seed),
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
    """Auditor submits the completed checklist.

    Where it lands depends on what the checklist found, which is the whole point
    of stages 03-05 existing for an audit:

      any critical finding  -> immediate_action  (03 RESPOND — stop-work, contain first)
      any failure           -> findings_raised   (05 IMPROVE — corrective actions owed)
      clean                 -> pending_review    (06 VERIFY — nothing to fix, confirm and close)

    It used to jump straight to `completed`, so an audit that found a dozen
    failures was indistinguishable from one that found none.
    """
    if _role(current_user) not in AUDITOR_ROLES:
        raise HTTPException(status_code=403, detail=f"Role '{current_user.role}' is not an auditor")
    a = db.query(Audit).filter(Audit.id == audit_id, Audit.organisation_id == current_user.org_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Audit not found")

    # A submitted checklist decides the stage, so submitting on an audit that has
    # already been verified or closed drags it back out of LEARN/CLOSE — a closed
    # audit would silently reopen as `findings_raised`, losing its close-out. The
    # other verbs are all gated; this one was not.
    if a.status in ("completed", "verified"):
        st = workflow_stages.describe("audit", a.status)
        raise HTTPException(
            status_code=400,
            detail=(
                f"Audit is at stage {st.get('stage_number')} "
                f"{st.get('stage_label') or a.status} — its findings are already signed off "
                "and the checklist cannot be resubmitted."
            ),
        )

    score = payload.compliance_score if payload.compliance_score is not None else _derive_score(payload.items)
    a.findings_json = json.dumps([i.model_dump() for i in payload.items])
    a.compliance_score = score
    if payload.shift:
        a.shift = payload.shift

    failures = [i for i in payload.items if (i.response or "").lower() == "fail"]
    if any(i.critical for i in failures):
        a.status = "immediate_action"
    elif failures:
        a.status = "findings_raised"
    else:
        a.status = "pending_review"

    a.progress = 100
    a.submitted_at = datetime.utcnow()

    # "Every non-conformance raised by an auditor becomes a CAPA with the finding
    # attached as evidence" — HSE_CAPA_Lifecycle.pdf, the six sources.
    #
    # Nothing created audit CAPAs before this, even though verify_audit refuses
    # to run while `_has_open_audit_capa` is true and `capa_open` is a valid
    # audit status. The gate was checking for records that no code path could
    # produce, so a failed audit item had no corrective action behind it.
    raised = _raise_finding_capas(db, a, failures, current_user)

    db.commit()
    db.refresh(a)
    out = _to_response(a)
    if raised:
        logger.info("Audit %s raised %s corrective action(s) from failed items", a.id, raised)
    return out


def _raise_finding_capas(db: Session, audit, failures: list, current_user) -> int:
    """One CAPA per failed checklist item, carrying the finding across.

    Per item rather than per audit because the document is explicit that each
    root cause gets its own action — an audit that fails six items has six
    things to fix, and one lumped action closes when the easiest is done.

    Critical items inherit P2 (major non-conformance), the rest P3 (minor), which
    is the trigger column of the CAPA type table read literally.
    """
    from app.models.capa_action import CapaAction
    from app.services import capa_notify
    from app.services.capa_priority import prioritise

    if not failures:
        return 0

    now = datetime.utcnow()
    raised_by = employee_id_for(db, current_user.user_id) if current_user else None
    created = 0

    for item in failures:
        label = (getattr(item, "question", None) or getattr(item, "title", None)
                 or "Checklist item")
        finding = getattr(item, "remarks", None) or ""
        critical = bool(getattr(item, "critical", False))

        # Skip an item that already produced an action, so re-submitting a
        # checklist does not duplicate the whole finding list.
        existing = (
            db.query(CapaAction.id)
            .filter(
                CapaAction.subject_family == "audit",
                CapaAction.subject_id == audit.id,
                CapaAction.root_cause_addressed == str(label)[:255],
            )
            .first()
        )
        if existing:
            continue

        prio = prioritise(
            severity_potential="high" if critical else "medium",
            systemic_risk="medium",
            capa_type="P2" if critical else "P3",
            created_at=now,
        )
        capa = CapaAction(
            organisation_id=audit.organisation_id,
            subject_family="audit",
            subject_id=audit.id,
            source="audit",
            raised_by=raised_by,
            action_type="Corrective",
            description=f"Audit finding: {label}" + (f" — {finding}" if finding else ""),
            root_cause_addressed=str(label)[:255],
            due_date=prio.due_date.date() if prio.due_date else None,
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
        db.flush()
        capa.capa_ref = f"CAPA-{capa.id:06d}"
        created += 1

    if created:
        # Unassigned on purpose: the auditor finds the non-conformance, the line
        # decides who owns fixing it. The managers get told there is a queue.
        capa_notify.notify_many(
            db,
            capa_notify.safety_managers(db, audit.organisation_id),
            org_id=audit.organisation_id,
            title=f"{created} corrective action(s) raised from an audit",
            message=(
                f"Audit #{audit.id} raised {created} non-conformance(s). "
                "Each needs an owner and a plan before work can start."
            ),
            category="capa_assigned",
            type_="warning",
        )
    return created


@router.post("/{audit_id}/start", response_model=AuditResponse)
def start_audit(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Stage 01 -> 02. The auditor picks the job up."""
    a = _owned(db, audit_id, current_user)
    if a.status not in ("scheduled", "planned", "draft"):
        raise HTTPException(status_code=400, detail="Audit is already under way")
    a.status = "in_progress"
    db.commit()
    db.refresh(a)
    return _to_response(a)


@router.post("/{audit_id}/fieldwork", response_model=AuditResponse)
def begin_fieldwork(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Stage 02/03 -> 04. On site, working the checklist.

    Reachable from `immediate_action` too: once the stop-work finding has been
    contained, the audit carries on rather than starting again.
    """
    a = _owned(db, audit_id, current_user)
    if a.status not in ("in_progress", "immediate_action"):
        raise HTTPException(
            status_code=400, detail="Audit must be in progress before fieldwork begins"
        )
    a.status = "fieldwork"
    db.commit()
    db.refresh(a)
    return _to_response(a)


@router.post("/{audit_id}/verify", response_model=AuditResponse)
def verify_audit(
    audit_id: int,
    payload: AuditVerify,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Stage 06 VERIFY — confirm the findings were actually resolved.

    Answering no returns the audit to IMPROVE. Findings that were not really
    closed out are the thing an audit trail is supposed to catch, so signing
    them off unverified would defeat the exercise.
    """
    a = db.query(Audit).filter(
        Audit.id == audit_id, Audit.organisation_id == current_user.org_id
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Audit not found")
    if a.status not in ("pending_review", "capa_open", "findings_raised"):
        raise HTTPException(
            status_code=400, detail="Audit has no findings awaiting verification"
        )
    if _has_open_audit_capa(db, a.id):
        raise HTTPException(
            status_code=400,
            detail="Corrective actions are still open — they must be completed before verification",
        )

    a.status = "verified" if payload.effective else "findings_raised"
    db.commit()
    db.refresh(a)
    return _to_response(a)


@router.post("/{audit_id}/close", response_model=AuditResponse)
def close_audit(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Stage 08 CLOSE. Only from LEARN — an audit closed with its findings
    unverified would record compliance that was never actually confirmed."""
    a = db.query(Audit).filter(
        Audit.id == audit_id, Audit.organisation_id == current_user.org_id
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Audit not found")
    if a.status == "completed":
        raise HTTPException(status_code=400, detail="Audit is already closed")
    if a.status != "verified":
        st = workflow_stages.describe("audit", a.status)
        raise HTTPException(
            status_code=400,
            detail=(
                f"Audit is at stage {st.get('stage_number')} "
                f"{st.get('stage_label') or a.status} and cannot be closed yet. "
                "Its findings must be actioned and verified first."
            ),
        )
    a.status = "completed"
    db.commit()
    db.refresh(a)
    return _to_response(a)
