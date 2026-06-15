"""
Full checklist controller — templates, submissions, items, logs.
Replaces the stub endpoints in stubs.py.
"""
import json
import uuid as _uuid
from datetime import datetime, timedelta
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config.database import get_db

router = APIRouter(prefix="/checklists", tags=["Checklists"])

# ─── helpers ─────────────────────────────────────────────────────────────────

def _actor(request: Request):
    email = request.headers.get("X-User-Email", "")
    role  = request.headers.get("X-User-Role", "Admin")
    return email, role


def _tmpl(db: Session, checklist_type: str) -> dict:
    row = db.execute(
        text("SELECT * FROM checklist_templates WHERE checklist_type = :t AND is_active = 1"),
        {"t": checklist_type},
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail=f"Template '{checklist_type}' not found")
    return dict(row)


def _sub(db: Session, submission_uuid: str) -> dict:
    row = db.execute(
        text("SELECT * FROM checklist_submissions WHERE submission_uuid = :u"),
        {"u": submission_uuid},
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Submission not found")
    return dict(row)


def _fmt_tmpl(row: dict) -> dict:
    return {
        "checklist_type": row["checklist_type"],
        "display_name":   row["display_name"],
        "submitter_roles": json.loads(row["submitter_roles"]),
        "validator_roles": json.loads(row["validator_roles"]),
        "items":           json.loads(row["items_json"]),
        "item_count":      len(json.loads(row["items_json"])),
        "ui":   json.loads(row["ui_json"])  if row.get("ui_json")  else None,
        "sla":  json.loads(row["sla_json"]) if row.get("sla_json") else None,
    }


def _fmt_sub(row: dict) -> dict:
    return {
        "submission_uuid":      row["submission_uuid"],
        "checklist_type":       row["checklist_type"],
        "site_id":              row.get("site_id"),
        "zone_id":              row.get("zone_id"),
        "shift_name":           row.get("shift_name"),
        "checklist_date":       str(row["checklist_date"]),
        "submitted_by_email":   row.get("submitted_by_email", ""),
        "submitted_by_role":    row.get("submitted_by_role", ""),
        "status":               row["status"],
        "created_at":           str(row["created_at"]),
        "updated_at":           str(row["updated_at"]),
        "submit_due_at":        str(row["submit_due_at"]) if row.get("submit_due_at") else None,
        "validate_due_at":      str(row["validate_due_at"]) if row.get("validate_due_at") else None,
        "submit_sla_breached":  row.get("submit_sla_breached", 0),
        "validate_sla_breached":row.get("validate_sla_breached", 0),
        "validation_decision":  row.get("validation_decision"),
        "validation_notes":     row.get("validation_notes"),
    }


# ─── templates ───────────────────────────────────────────────────────────────

@router.get("/templates")
def list_templates(db: Session = Depends(get_db)) -> list:
    rows = db.execute(
        text("SELECT * FROM checklist_templates WHERE is_active = 1 ORDER BY display_name")
    ).mappings().all()
    return [_fmt_tmpl(dict(r)) for r in rows]


@router.post("/templates/bootstrap")
def bootstrap_templates(db: Session = Depends(get_db)) -> dict:
    """Seed the six default HSE checklist templates."""
    templates = _default_templates()
    counts: dict[str, int] = {}
    for t in templates:
        existing = db.execute(
            text("SELECT id FROM checklist_templates WHERE checklist_type = :t"),
            {"t": t["checklist_type"]},
        ).first()
        if existing:
            counts[t["checklist_type"]] = 0
            continue
        db.execute(text("""
            INSERT INTO checklist_templates
                (checklist_type, display_name, submitter_roles, validator_roles,
                 items_json, ui_json, sla_json)
            VALUES (:ct, :dn, :sr, :vr, :ij, :uj, :sj)
        """), {
            "ct": t["checklist_type"],
            "dn": t["display_name"],
            "sr": json.dumps(t["submitter_roles"]),
            "vr": json.dumps(t["validator_roles"]),
            "ij": json.dumps(t["items"]),
            "uj": json.dumps(t.get("ui")) if t.get("ui") else None,
            "sj": json.dumps(t.get("sla")) if t.get("sla") else None,
        })
        counts[t["checklist_type"]] = len(t["items"])
    db.commit()
    return {"status": "ok", "message": "Templates bootstrapped", "counts": counts}


# ─── submissions ──────────────────────────────────────────────────────────────

@router.get("/submissions")
def list_submissions(
    limit: int = 20,
    checklist_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
) -> list:
    where = "WHERE 1=1"
    params: dict[str, Any] = {"limit": limit}
    if checklist_type:
        where += " AND checklist_type = :ct"
        params["ct"] = checklist_type
    if status:
        where += " AND status = :st"
        params["st"] = status
    rows = db.execute(
        text(f"SELECT * FROM checklist_submissions {where} ORDER BY created_at DESC LIMIT :limit"),
        params,
    ).mappings().all()
    return [_fmt_sub(dict(r)) for r in rows]


@router.post("/submissions", status_code=status.HTTP_201_CREATED)
def create_submission(request: Request, payload: dict, db: Session = Depends(get_db)) -> dict:
    checklist_type = payload.get("checklist_type", "")
    tmpl = _tmpl(db, checklist_type)
    items = json.loads(tmpl["items_json"])
    sla   = json.loads(tmpl["sla_json"]) if tmpl.get("sla_json") else {}

    sub_uuid = str(_uuid.uuid4())
    now  = datetime.utcnow()
    cdate = payload.get("checklist_date") or now.date().isoformat()
    actor_email, actor_role = _actor(request)

    submit_sla_h = sla.get("draft_submission_sla_hours", 24) if sla else 24
    submit_due = now + timedelta(hours=submit_sla_h)

    db.execute(text("""
        INSERT INTO checklist_submissions
            (submission_uuid, checklist_type, site_id, zone_id, shift_name,
             checklist_date, submitted_by_email, submitted_by_role, status, submit_due_at)
        VALUES (:u, :ct, :si, :zi, :sh, :cd, :em, :ro, 'draft', :sd)
    """), {
        "u": sub_uuid, "ct": checklist_type,
        "si": payload.get("site_id"), "zi": payload.get("zone_id"),
        "sh": payload.get("shift_name"),
        "cd": cdate, "em": actor_email, "ro": actor_role, "sd": submit_due,
    })

    # Copy template items into submission items
    for item in items:
        db.execute(text("""
            INSERT INTO checklist_submission_items
                (submission_uuid, item_no, section_name, item_text, is_required)
            VALUES (:u, :no, :sn, :it, :ir)
        """), {
            "u": sub_uuid, "no": item["item_no"],
            "sn": item["section_name"], "it": item["item_text"],
            "ir": 1 if item.get("is_required") else 0,
        })

    # Log creation
    db.execute(text("""
        INSERT INTO checklist_logs (submission_uuid, action_type, actor_email, actor_role, to_status)
        VALUES (:u, 'created', :em, :ro, 'draft')
    """), {"u": sub_uuid, "em": actor_email, "ro": actor_role})

    db.commit()
    return {"submission_uuid": sub_uuid, "status": "draft", "submit_due_at": str(submit_due)}


@router.get("/submissions/{submission_uuid}")
def get_submission(submission_uuid: str, db: Session = Depends(get_db)) -> dict:
    sub  = _sub(db, submission_uuid)
    tmpl = _tmpl(db, sub["checklist_type"])

    items = db.execute(
        text("SELECT * FROM checklist_submission_items WHERE submission_uuid = :u ORDER BY item_no"),
        {"u": submission_uuid},
    ).mappings().all()

    logs = db.execute(
        text("SELECT * FROM checklist_logs WHERE submission_uuid = :u ORDER BY created_at"),
        {"u": submission_uuid},
    ).mappings().all()

    def _fmt_item(r: dict) -> dict:
        return {
            "item_no":         r["item_no"],
            "section_name":    r["section_name"],
            "item_text":       r["item_text"],
            "is_required":     r["is_required"],
            "response_value":  r.get("response_value"),
            "remark":          r.get("remark"),
            "evidence_json":   r.get("evidence_json"),
            "updated_by_email":r.get("updated_by_email"),
            "updated_by_role": r.get("updated_by_role"),
            "updated_at":      str(r["updated_at"]) if r.get("updated_at") else None,
        }

    def _fmt_log(r: dict) -> dict:
        return {
            "action_type": r["action_type"],
            "actor_email": r.get("actor_email", ""),
            "actor_role":  r.get("actor_role", ""),
            "from_status": r.get("from_status"),
            "to_status":   r.get("to_status"),
            "notes":       r.get("notes"),
            "created_at":  str(r["created_at"]),
        }

    return {
        "submission": _fmt_sub(sub),
        "template": {
            "checklist_type":  tmpl["checklist_type"],
            "display_name":    tmpl["display_name"],
            "submitter_roles": json.loads(tmpl["submitter_roles"]),
            "validator_roles": json.loads(tmpl["validator_roles"]),
            "ui":  json.loads(tmpl["ui_json"])  if tmpl.get("ui_json")  else None,
            "sla": json.loads(tmpl["sla_json"]) if tmpl.get("sla_json") else None,
        },
        "items": [_fmt_item(dict(r)) for r in items],
        "logs":  [_fmt_log(dict(r))  for r in logs],
    }


@router.put("/submissions/{submission_uuid}/items")
def save_items(submission_uuid: str, request: Request, payload: dict, db: Session = Depends(get_db)) -> dict:
    sub = _sub(db, submission_uuid)
    if sub["status"] != "draft":
        raise HTTPException(status_code=400, detail="Only draft submissions can be edited")

    actor_email, actor_role = _actor(request)
    items = payload.get("items", [])
    now = datetime.utcnow()

    for item in items:
        db.execute(text("""
            UPDATE checklist_submission_items
            SET response_value = :rv, remark = :rm,
                updated_by_email = :em, updated_by_role = :ro, updated_at = :ua
            WHERE submission_uuid = :u AND item_no = :no
        """), {
            "rv": item.get("response_value"), "rm": item.get("remark"),
            "em": actor_email, "ro": actor_role, "ua": now,
            "u": submission_uuid, "no": item["item_no"],
        })
    db.commit()
    return {"status": "saved", "updated_items": len(items)}


@router.post("/submissions/{submission_uuid}/submit")
def submit_submission(submission_uuid: str, request: Request, db: Session = Depends(get_db)) -> dict:
    sub = _sub(db, submission_uuid)
    if sub["status"] != "draft":
        raise HTTPException(status_code=400, detail="Only draft submissions can be submitted")

    actor_email, actor_role = _actor(request)
    tmpl = _tmpl(db, sub["checklist_type"])
    sla = json.loads(tmpl["sla_json"]) if tmpl.get("sla_json") else {}
    validate_sla_h = sla.get("validation_sla_hours", 48) if sla else 48
    validate_due = datetime.utcnow() + timedelta(hours=validate_sla_h)

    db.execute(text("""
        UPDATE checklist_submissions
        SET status = 'submitted', validate_due_at = :vd, updated_at = :ua
        WHERE submission_uuid = :u
    """), {"vd": validate_due, "ua": datetime.utcnow(), "u": submission_uuid})

    db.execute(text("""
        INSERT INTO checklist_logs (submission_uuid, action_type, actor_email, actor_role, from_status, to_status)
        VALUES (:u, 'submitted', :em, :ro, 'draft', 'submitted')
    """), {"u": submission_uuid, "em": actor_email, "ro": actor_role})

    db.commit()
    return {"status": "submitted", "submission_uuid": submission_uuid}


@router.post("/submissions/{submission_uuid}/validate")
def validate_submission(submission_uuid: str, request: Request, payload: dict, db: Session = Depends(get_db)) -> dict:
    sub = _sub(db, submission_uuid)
    if sub["status"] != "submitted":
        raise HTTPException(status_code=400, detail="Only submitted checklists can be validated")

    decision = payload.get("decision", "approved")
    if decision not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="decision must be 'approved' or 'rejected'")

    actor_email, actor_role = _actor(request)
    new_status = "validated" if decision == "approved" else "rejected"
    notes = payload.get("notes")

    db.execute(text("""
        UPDATE checklist_submissions
        SET status = :ns, validation_decision = :vd, validation_notes = :vn, updated_at = :ua
        WHERE submission_uuid = :u
    """), {
        "ns": new_status, "vd": decision, "vn": notes,
        "ua": datetime.utcnow(), "u": submission_uuid,
    })

    db.execute(text("""
        INSERT INTO checklist_logs
            (submission_uuid, action_type, actor_email, actor_role, from_status, to_status, notes)
        VALUES (:u, :at, :em, :ro, 'submitted', :ns, :no)
    """), {
        "u": submission_uuid, "at": f"validation_{decision}",
        "em": actor_email, "ro": actor_role, "ns": new_status, "no": notes,
    })

    db.commit()
    return {"status": new_status, "submission_uuid": submission_uuid}


# ─── default templates ────────────────────────────────────────────────────────

def _default_templates() -> list[dict]:
    all_roles = ["Admin", "HSE Manager", "Safety Manager", "Supervisor", "Site Inspector", "Site Engineer", "Auditor"]
    admin_validator = ["Admin", "HSE Manager"]

    return [
        {
            "checklist_type": "daily_safety_walk",
            "display_name":   "Daily Safety Walk",
            "submitter_roles": ["Admin", "Site Inspector", "Safety Manager", "Supervisor"],
            "validator_roles": admin_validator,
            "ui":  {"form_title": "Daily Safety Walk Inspection", "short_label": "Safety Walk", "version_tag": "v1.0"},
            "sla": {"draft_submission_sla_hours": 12, "validation_sla_hours": 24},
            "items": [
                {"section_name": "PPE & Clothing",       "item_no": 1,  "item_text": "All workers in the area are wearing appropriate hard hats",            "is_required": True},
                {"section_name": "PPE & Clothing",       "item_no": 2,  "item_text": "High-visibility vests are worn by all personnel on site",              "is_required": True},
                {"section_name": "PPE & Clothing",       "item_no": 3,  "item_text": "Safety footwear (steel toe-cap) is worn by all workers",               "is_required": True},
                {"section_name": "PPE & Clothing",       "item_no": 4,  "item_text": "Appropriate gloves are available and being used where required",        "is_required": False},
                {"section_name": "PPE & Clothing",       "item_no": 5,  "item_text": "Eye protection is worn in designated zones",                           "is_required": False},
                {"section_name": "Housekeeping",         "item_no": 6,  "item_text": "Walkways and emergency exits are clear of obstructions",                "is_required": True},
                {"section_name": "Housekeeping",         "item_no": 7,  "item_text": "Waste materials are disposed of in correct containers",                 "is_required": False},
                {"section_name": "Housekeeping",         "item_no": 8,  "item_text": "Spillage kits are in place and accessible",                            "is_required": False},
                {"section_name": "Fire Safety",          "item_no": 9,  "item_text": "Fire extinguishers are present, charged and accessible",               "is_required": True},
                {"section_name": "Fire Safety",          "item_no": 10, "item_text": "Fire assembly point is clearly marked and unobstructed",                "is_required": True},
                {"section_name": "Fire Safety",          "item_no": 11, "item_text": "No smoking in designated non-smoking areas",                           "is_required": False},
                {"section_name": "Hazard Signage",       "item_no": 12, "item_text": "All hazard warning signs are visible and in good condition",            "is_required": True},
                {"section_name": "Hazard Signage",       "item_no": 13, "item_text": "Restricted access zones are clearly demarcated",                       "is_required": True},
                {"section_name": "Emergency Equipment",  "item_no": 14, "item_text": "First aid kit is fully stocked and accessible",                        "is_required": True},
                {"section_name": "Emergency Equipment",  "item_no": 15, "item_text": "Emergency contact numbers are posted in visible locations",             "is_required": False},
            ],
        },
        {
            "checklist_type": "ppe_compliance_audit",
            "display_name":   "PPE Compliance Audit",
            "submitter_roles": ["Admin", "Site Inspector", "Safety Manager", "Supervisor", "Auditor"],
            "validator_roles": admin_validator,
            "ui":  {"form_title": "PPE Compliance Audit", "short_label": "PPE Audit", "version_tag": "v1.0"},
            "sla": {"draft_submission_sla_hours": 8, "validation_sla_hours": 24},
            "items": [
                {"section_name": "Head Protection",      "item_no": 1,  "item_text": "EN397 hard hats present for all workers in mandatory zones",            "is_required": True},
                {"section_name": "Head Protection",      "item_no": 2,  "item_text": "Hard hats are free from damage, cracks or degradation",                 "is_required": True},
                {"section_name": "Eye & Face",           "item_no": 3,  "item_text": "Safety glasses / goggles available in grinding and chemical zones",      "is_required": True},
                {"section_name": "Eye & Face",           "item_no": 4,  "item_text": "Face shields are available for chemical handling tasks",                 "is_required": False},
                {"section_name": "Hearing Protection",   "item_no": 5,  "item_text": "Ear defenders or plugs available in areas exceeding 85 dB",              "is_required": True},
                {"section_name": "Hand Protection",      "item_no": 6,  "item_text": "Cut-resistant gloves available for sheet metal work",                   "is_required": True},
                {"section_name": "Hand Protection",      "item_no": 7,  "item_text": "Chemical-resistant gloves available at chemical storage areas",          "is_required": True},
                {"section_name": "Foot Protection",      "item_no": 8,  "item_text": "Steel toe-cap boots (S3) worn by all workers on production floor",       "is_required": True},
                {"section_name": "Body Protection",      "item_no": 9,  "item_text": "Hi-vis vest EN ISO 20471 Class 2 worn outdoors and in vehicle zones",    "is_required": True},
                {"section_name": "Body Protection",      "item_no": 10, "item_text": "Flame-retardant clothing worn by workers performing hot work",           "is_required": False},
                {"section_name": "Fall Protection",      "item_no": 11, "item_text": "Full-body harness available and inspected for WAH tasks",               "is_required": True},
                {"section_name": "Fall Protection",      "item_no": 12, "item_text": "Harnesses have valid inspection date tag (within 6 months)",             "is_required": True},
                {"section_name": "Respiratory",          "item_no": 13, "item_text": "Respiratory protection available in chemical and dust areas",             "is_required": False},
                {"section_name": "Respiratory",          "item_no": 14, "item_text": "RPE fit-test records available for assigned users",                     "is_required": False},
            ],
        },
        {
            "checklist_type": "hot_work_pre_task",
            "display_name":   "Hot Work Pre-Task Checklist",
            "submitter_roles": ["Admin", "Supervisor", "Site Engineer", "Safety Manager"],
            "validator_roles": admin_validator,
            "ui":  {"form_title": "Hot Work Pre-Task Safety Check", "short_label": "Hot Work", "version_tag": "v1.0"},
            "sla": {"draft_submission_sla_hours": 4, "validation_sla_hours": 8},
            "items": [
                {"section_name": "Permit",               "item_no": 1,  "item_text": "Valid Hot Work Permit is displayed at the work location",               "is_required": True},
                {"section_name": "Permit",               "item_no": 2,  "item_text": "Permit validity period has been confirmed and not expired",              "is_required": True},
                {"section_name": "Area Preparation",     "item_no": 3,  "item_text": "All combustible materials removed or shielded within 5m radius",         "is_required": True},
                {"section_name": "Area Preparation",     "item_no": 4,  "item_text": "Drains and openings are covered to prevent sparks entering",             "is_required": True},
                {"section_name": "Area Preparation",     "item_no": 5,  "item_text": "Adjacent areas on opposite side of barrier checked for combustibles",    "is_required": False},
                {"section_name": "Fire Prevention",      "item_no": 6,  "item_text": "CO2 or dry powder extinguisher (min 9kg) positioned at work site",       "is_required": True},
                {"section_name": "Fire Prevention",      "item_no": 7,  "item_text": "Fire watch operative assigned and briefed on duties",                    "is_required": True},
                {"section_name": "Fire Prevention",      "item_no": 8,  "item_text": "Fire watch to continue for minimum 30 minutes after work completion",    "is_required": True},
                {"section_name": "Atmosphere Check",     "item_no": 9,  "item_text": "Atmosphere tested for flammable gases — result recorded (LEL < 5%)",     "is_required": True},
                {"section_name": "Atmosphere Check",     "item_no": 10, "item_text": "Ventilation is adequate to remove fumes and maintain safe atmosphere",   "is_required": True},
                {"section_name": "Operator PPE",         "item_no": 11, "item_text": "Welder wearing flame-retardant overalls, gloves, shield and footwear",   "is_required": True},
                {"section_name": "Operator PPE",         "item_no": 12, "item_text": "No synthetic clothing under FR overalls",                               "is_required": False},
                {"section_name": "Close-out",            "item_no": 13, "item_text": "All equipment isolated and made safe on completion",                    "is_required": True},
                {"section_name": "Close-out",            "item_no": 14, "item_text": "Permit signed off and filed after work completion",                     "is_required": True},
            ],
        },
        {
            "checklist_type": "working_at_height",
            "display_name":   "Working at Height Checklist",
            "submitter_roles": ["Admin", "Supervisor", "Site Engineer", "Site Inspector", "Safety Manager"],
            "validator_roles": admin_validator,
            "ui":  {"form_title": "Working at Height Pre-Task Check", "short_label": "WAH Check", "version_tag": "v1.0"},
            "sla": {"draft_submission_sla_hours": 4, "validation_sla_hours": 12},
            "items": [
                {"section_name": "Permit & Planning",    "item_no": 1,  "item_text": "WAH Permit to Work is valid and displayed at the work location",         "is_required": True},
                {"section_name": "Permit & Planning",    "item_no": 2,  "item_text": "Method statement / risk assessment reviewed by all operatives",           "is_required": True},
                {"section_name": "Scaffold & Access",    "item_no": 3,  "item_text": "Scaffold has current inspection tag (inspected within 7 days)",           "is_required": True},
                {"section_name": "Scaffold & Access",    "item_no": 4,  "item_text": "All scaffold boards are fully supported with no overhang gaps",           "is_required": True},
                {"section_name": "Scaffold & Access",    "item_no": 5,  "item_text": "Guard rails (min 950mm), mid-rails and toe-boards fitted",                "is_required": True},
                {"section_name": "Scaffold & Access",    "item_no": 6,  "item_text": "Ladder secured and extending 1m above landing point",                    "is_required": False},
                {"section_name": "Fall Protection",      "item_no": 7,  "item_text": "Full-body harness worn and connected to rated anchor point",              "is_required": True},
                {"section_name": "Fall Protection",      "item_no": 8,  "item_text": "Lanyard / PFPE has been inspected and is in-date",                       "is_required": True},
                {"section_name": "Fall Protection",      "item_no": 9,  "item_text": "Fall rescue plan communicated to all on site",                           "is_required": True},
                {"section_name": "Exclusion Zone",       "item_no": 10, "item_text": "Exclusion zone below work area is barriered and signed",                  "is_required": True},
                {"section_name": "Exclusion Zone",       "item_no": 11, "item_text": "Banksman / spotter present if overhead work near traffic or public",      "is_required": False},
                {"section_name": "Weather & Environment","item_no": 12, "item_text": "Wind speed checked — work suspended if > 15m/s (Force 7)",                "is_required": True},
                {"section_name": "Weather & Environment","item_no": 13, "item_text": "Surfaces checked for ice, wet or slippery conditions",                    "is_required": True},
                {"section_name": "Tools & Equipment",    "item_no": 14, "item_text": "All tools tethered or contained to prevent dropped objects",              "is_required": True},
                {"section_name": "Tools & Equipment",    "item_no": 15, "item_text": "No loose materials stored at height — secured or removed before work",    "is_required": False},
            ],
        },
        {
            "checklist_type": "confined_space_entry",
            "display_name":   "Confined Space Entry Checklist",
            "submitter_roles": ["Admin", "Supervisor", "Site Engineer", "Safety Manager"],
            "validator_roles": admin_validator,
            "ui":  {"form_title": "Confined Space Entry Check", "short_label": "Confined Space", "version_tag": "v1.0"},
            "sla": {"draft_submission_sla_hours": 2, "validation_sla_hours": 8},
            "items": [
                {"section_name": "Permit",               "item_no": 1,  "item_text": "Confined Space Entry Permit is signed and displayed",                    "is_required": True},
                {"section_name": "Permit",               "item_no": 2,  "item_text": "All entrants and standby named on the permit",                           "is_required": True},
                {"section_name": "Atmosphere Testing",   "item_no": 3,  "item_text": "Oxygen level tested: 19.5%–23.5% (safe range)",                          "is_required": True},
                {"section_name": "Atmosphere Testing",   "item_no": 4,  "item_text": "Flammable gas/vapour tested: < 5% LEL",                                  "is_required": True},
                {"section_name": "Atmosphere Testing",   "item_no": 5,  "item_text": "Toxic gases (CO, H2S) tested — results within safe limits",               "is_required": True},
                {"section_name": "Atmosphere Testing",   "item_no": 6,  "item_text": "Continuous gas monitoring in use for the duration of entry",              "is_required": True},
                {"section_name": "Isolation",            "item_no": 7,  "item_text": "All pipework and services isolated with blanks or spades — LOTO applied", "is_required": True},
                {"section_name": "Isolation",            "item_no": 8,  "item_text": "Mechanical agitators / mixing equipment locked out",                     "is_required": True},
                {"section_name": "Rescue",               "item_no": 9,  "item_text": "Rescue harness and retrieval line rigged before entry",                  "is_required": True},
                {"section_name": "Rescue",               "item_no": 10, "item_text": "Trained standby man positioned at entry point for full duration",         "is_required": True},
                {"section_name": "Rescue",               "item_no": 11, "item_text": "Emergency services / on-site first aider informed and on standby",        "is_required": True},
                {"section_name": "Ventilation & Comms",  "item_no": 12, "item_text": "Forced ventilation equipment operating prior to entry",                   "is_required": True},
                {"section_name": "Ventilation & Comms",  "item_no": 13, "item_text": "Two-way communication between entrant and standby confirmed working",     "is_required": True},
                {"section_name": "PPE",                  "item_no": 14, "item_text": "Entrant wearing full-body harness, hard hat and appropriate RPE",         "is_required": True},
                {"section_name": "PPE",                  "item_no": 15, "item_text": "Intrinsically safe lighting used inside confined space",                  "is_required": True},
            ],
        },
        {
            "checklist_type": "end_of_shift_handover",
            "display_name":   "End of Shift Handover",
            "submitter_roles": ["Admin", "Supervisor", "Safety Manager", "HSE Manager"],
            "validator_roles": admin_validator,
            "ui":  {"form_title": "End of Shift Safety Handover", "short_label": "Shift Handover", "version_tag": "v1.0"},
            "sla": {"draft_submission_sla_hours": 1, "validation_sla_hours": 12},
            "items": [
                {"section_name": "Incidents & Near Misses","item_no": 1,  "item_text": "All incidents and near misses reported and logged in the system",       "is_required": True},
                {"section_name": "Incidents & Near Misses","item_no": 2,  "item_text": "Immediate corrective actions taken for any incidents documented",       "is_required": True},
                {"section_name": "Permits",              "item_no": 3,  "item_text": "All open permits checked — expired permits cancelled and filed",          "is_required": True},
                {"section_name": "Permits",              "item_no": 4,  "item_text": "Incoming supervisor briefed on all active permits for next shift",        "is_required": True},
                {"section_name": "Equipment",            "item_no": 5,  "item_text": "All machinery and equipment made safe or isolated before shift end",      "is_required": True},
                {"section_name": "Equipment",            "item_no": 6,  "item_text": "Any defective equipment tagged out and maintenance informed",             "is_required": False},
                {"section_name": "Housekeeping",         "item_no": 7,  "item_text": "Work area clean and tidy — waste removed to designated points",           "is_required": False},
                {"section_name": "Housekeeping",         "item_no": 8,  "item_text": "Chemicals and hazardous materials stored securely in correct locations",  "is_required": True},
                {"section_name": "Personnel",            "item_no": 9,  "item_text": "All workers accounted for — headcount completed",                        "is_required": True},
                {"section_name": "Personnel",            "item_no": 10, "item_text": "Incoming shift supervisor briefed on outstanding hazards or risks",       "is_required": True},
                {"section_name": "Communication",        "item_no": 11, "item_text": "All CAPA actions updated with progress in the system",                   "is_required": False},
                {"section_name": "Communication",        "item_no": 12, "item_text": "Safety observations from this shift logged and forwarded",                "is_required": False},
            ],
        },
    ]
