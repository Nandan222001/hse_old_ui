import json
from datetime import datetime, date, time
from typing import Any, List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.core.dependencies import get_current_user, CurrentUser

router = APIRouter(prefix="/worker", tags=["Worker Mobile App"])


# All routes here are consumed by the mobile Worker app under the "/worker" prefix.
# (Auth refresh at '/auth/employee/refresh' lives in the auth router, not here.)


def _employee_id(db: Session, user: CurrentUser):
    """Employee row id linked to the logged-in user, or None if unlinked.

    Used to scope dashboard data to the signed-in worker instead of the whole org.
    """
    return db.execute(
        text("SELECT employee_id FROM users WHERE id = :uid"),
        {"uid": user.user_id},
    ).scalar()


# ─── Tasks Endpoints ──────────────────────────────────────────────────────────

@router.get("/tasks")
def list_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
) -> dict:
    """Fetch tasks (CAPA actions) assigned to the logged-in employee."""
    # Find employee linked to this user
    user_row = db.execute(
        text("SELECT employee_id FROM users WHERE id = :uid"),
        {"uid": current_user.user_id}
    ).mappings().first()

    emp_id = user_row["employee_id"] if user_row else None
    
    # Query CAPA actions
    query_str = "SELECT * FROM capa_actions WHERE organisation_id = :org_id"
    params = {"org_id": current_user.org_id}
    
    if emp_id:
        query_str += " AND responsible_person_id = :emp_id"
        params["emp_id"] = emp_id

    if status:
        query_str += " AND status = :status"
        params["status"] = status

    rows = db.execute(text(query_str), params).mappings().all()

    # Map database capa_actions to the frontend Task interface
    items = []
    for r in rows:
        items.append({
          "id": str(r["id"]),
          "title": r["action_type"] or "Safety Compliance Action",
          "location": r["root_cause_addressed"] or "Zone B - Sector 4",
          "priority": r["status"] == "Overdue" and "high" or "medium",
          "type": "checklist",
          "status": r["status"].lower() == "completed" and "completed" or "pending",
          "due_at": r["due_date"].isoformat() if r["due_date"] else None,
          "steps": [
              { "id": "1", "title": r["description"] or "Inspect area and check compliance", "completed": r["status"].lower() == "completed" }
          ]
        })

    # No mock fallback: an empty list is the truthful per-worker result when this
    # employee has no CAPA tasks assigned. The app renders its own empty state.
    return {"success": True, "data": {"items": items, "total": len(items)}}


# NOTE: This static route MUST be declared before "/tasks/{id}", otherwise
# FastAPI matches "shift-summary" as an {id} and this handler never runs.
@router.get("/tasks/shift-summary")
def get_shift_summary(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
) -> dict:
    emp_id = _employee_id(db, current_user)
    params = {"org_id": current_user.org_id}

    # Scope CAPA tasks to the ones this worker is responsible for.
    task_where = "organisation_id = :org_id"
    if emp_id:
        task_where += " AND responsible_person_id = :emp_id"
        params["emp_id"] = emp_id

    total_capas = db.execute(
        text(f"SELECT COUNT(*) FROM capa_actions WHERE {task_where}"), params
    ).scalar() or 0

    completed_capas = db.execute(
        text(f"SELECT COUNT(*) FROM capa_actions WHERE {task_where} AND status = 'Completed'"), params
    ).scalar() or 0

    # Scope active permits to ones this worker raised or acknowledged.
    permit_where = "organisation_id = :org_id AND status = 'Active'"
    if emp_id:
        permit_where += " AND (requested_by = :emp_id OR acknowledged_by = :emp_id)"

    active_permits = db.execute(
        text(f"SELECT COUNT(*) FROM permits_to_work WHERE {permit_where}"), params
    ).scalar() or 0

    return {
        "success": True,
        "data": {
            "total_tasks": total_capas,
            "completed_tasks": completed_capas,
            "active_permits": active_permits,
        }
    }


@router.get("/tasks/{id}")
def get_task(
    id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
) -> dict:
    # Try fetching from DB first
    if id.isdigit():
        r = db.execute(
            text("SELECT * FROM capa_actions WHERE id = :id AND organisation_id = :org_id"),
            {"id": int(id), "org_id": current_user.org_id}
        ).mappings().first()
        if r:
            task = {
                "id": str(r["id"]),
                "title": r["action_type"] or "Safety Compliance Action",
                "location": "Zone B - Sector 4",
                "priority": "high",
                "type": "checklist",
                "status": r["status"].lower() == "completed" and "completed" or "pending",
                "due_at": r["due_date"].isoformat() if r["due_date"] else None,
                "steps": [
                    { "id": "1", "title": r["description"] or "Check area compliance", "completed": r["status"].lower() == "completed" }
                ]
            }
            return {"success": True, "data": task}

    # Mock fallback
    return {
        "success": True,
        "data": {
            "id": id,
            "title": "Equipment Check: Main Excavator Hydraulics",
            "location": "Zone B - Sector 4",
            "priority": "high",
            "type": "checklist",
            "status": "pending",
            "due_at": date.today().isoformat() + "T16:00:00",
            "steps": [
                { "id": "1", "title": "Check hydraulic fluid levels", "completed": False },
                { "id": "2", "title": "Inspect high-pressure hoses for cracks", "completed": False }
            ]
        }
    }


@router.post("/tasks/{id}/complete-step")
def complete_task_step(
    id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
) -> dict:
    if id.isdigit():
        db.execute(
            text("UPDATE capa_actions SET status = 'Completed' WHERE id = :id AND organisation_id = :org_id"),
            {"id": int(id), "org_id": current_user.org_id}
        )
        db.commit()
    return {"success": True, "data": {"id": id, "status": "completed"}}


# ─── Permits Endpoints ────────────────────────────────────────────────────────

@router.get("/permits")
def list_permits(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
) -> dict:
    query_str = """
        SELECT p.*, pt.permit_type_name as permit_type_name, ws.station_name as location_name 
        FROM permits_to_work p
        LEFT JOIN permit_types pt ON p.permit_type_id = pt.id
        LEFT JOIN working_stations ws ON p.location_station_id = ws.id
        WHERE p.organisation_id = :org_id
    """
    params = {"org_id": current_user.org_id}

    # Scope to permits this worker raised or acknowledged (per-worker view).
    emp_id = _employee_id(db, current_user)
    if emp_id:
        query_str += " AND (p.requested_by = :emp_id OR p.acknowledged_by = :emp_id)"
        params["emp_id"] = emp_id

    if status:
        query_str += " AND p.status = :status"
        params["status"] = status

    rows = db.execute(text(query_str), params).mappings().all()

    items = []
    for r in rows:
        # Standardize permit types names to match frontend types
        pt_name = r["permit_type_name"] or "hot_work"
        pt_name_lower = pt_name.lower().replace(" ", "_")
        if pt_name_lower not in ["hot_work", "confined_space", "working_at_height", "electrical", "excavation"]:
            pt_name_lower = "hot_work"

        items.append({
            "id": str(r["id"]),
            "permit_ref": f"PTW-{r['id']:04d}",
            "permit_type": pt_name_lower,
            "work_location": r["location_name"] or "Zone B - Sector 4",
            "start_datetime": r["validity_start"].isoformat() if r["validity_start"] else date.today().isoformat() + "T08:00:00",
            "end_datetime": r["validity_end"].isoformat() if r["validity_end"] else date.today().isoformat() + "T16:00:00",
            "work_description": r["work_description"] or "",
            "status": r["status"].lower() if r["status"] else "pending_approval",
            "requested_by": "Alex Safety",
            "created_at": r["date_issued"].isoformat() if r["date_issued"] else date.today().isoformat(),
            "safety_gear": {
                "hard_hat": True,
                "gloves": True,
                "eye_protection": True,
                "respirator": False
            }
        })

    return {"success": True, "data": {"items": items, "total": len(items)}}


@router.post("/permits")
def create_permit(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
) -> dict:
    data = payload.get("data", payload)
    
    # Look up permit type id or default
    pt_name = data.get("permit_type", "hot_work").replace("_", " ")
    pt_id = db.execute(
        text("SELECT id FROM permit_types WHERE permit_type_name LIKE :name LIMIT 1"),
        {"name": f"%{pt_name}%"}
    ).scalar() or 1

    # Look up location id or default
    loc_name = data.get("work_location", "Zone B - Sector 4")
    loc_id = db.execute(
        text("SELECT id FROM working_stations WHERE station_name LIKE :name LIMIT 1"),
        {"name": f"%{loc_name}%"}
    ).scalar() or 1

    # The worker raising the permit — stamped so it enters the permit workflow
    # (supervisor queue) as a proper `requested` entry, not an orphaned row.
    requester_emp_id = db.execute(
        text("SELECT employee_id FROM users WHERE id = :uid"),
        {"uid": current_user.user_id},
    ).scalar()

    # Insert into permits_to_work
    db.execute(
        text("""
            INSERT INTO permits_to_work (
                organisation_id, permit_type_id, date_issued, time_issued,
                location_station_id, work_description, duration_requested_hours,
                validity_start, validity_end, status,
                workflow_status, requested_by, requested_at, issued_by
            ) VALUES (
                :org_id, :permit_type_id, :date_issued, :time_issued,
                :location_station_id, :work_description, :duration,
                :validity_start, :validity_end, :status,
                'requested', :requested_by, :requested_at, :requested_by
            )
        """),
        {
            "org_id": current_user.org_id,
            "permit_type_id": pt_id,
            "date_issued": date.today(),
            "time_issued": time(8, 0),
            "location_station_id": loc_id,
            "work_description": data.get("work_description", ""),
            "duration": data.get("duration_hours", 8),
            "validity_start": datetime.fromisoformat(data.get("start_datetime").replace("Z", "")) if data.get("start_datetime") else datetime.now(),
            "validity_end": datetime.fromisoformat(data.get("end_datetime").replace("Z", "")) if data.get("end_datetime") else datetime.now(),
            "status": "pending_approval",
            "requested_by": requester_emp_id,
            "requested_at": datetime.now(),
        }
    )
    db.commit()

    new_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar()

    created_permit = {
        "id": str(new_id),
        "permit_ref": f"PTW-{new_id:04d}",
        "permit_type": data.get("permit_type", "hot_work"),
        "work_location": data.get("work_location", "Zone B - Sector 4"),
        "start_datetime": data.get("start_datetime", date.today().isoformat() + "T08:00:00"),
        "end_datetime": data.get("end_datetime", date.today().isoformat() + "T16:00:00"),
        "work_description": data.get("work_description", ""),
        "status": "pending_approval",
        "requested_by": "Alex Safety",
        "created_at": date.today().isoformat(),
        "safety_gear": data.get("safety_gear", {
            "hard_hat": True,
            "gloves": True,
            "eye_protection": True,
            "respirator": False
        })
    }

    return {"success": True, "data": created_permit}


@router.post("/permits/{id}/acknowledge")
def acknowledge_permit(
    id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
) -> dict:
    if id.isdigit():
        db.execute(
            text("UPDATE permits_to_work SET status = 'Active' WHERE id = :id AND organisation_id = :org_id"),
            {"id": int(id), "org_id": current_user.org_id}
        )
        db.commit()
    return {"success": True, "data": {"id": id, "status": "active"}}


# ─── Incidents Endpoints ──────────────────────────────────────────────────────

@router.post("/incidents")
def report_incident(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
) -> dict:
    data = payload.get("data", payload)
    
    # Find employee linked to this user
    user_row = db.execute(
        text("SELECT employee_id FROM users WHERE id = :uid"),
        {"uid": current_user.user_id}
    ).mappings().first()

    emp_id = user_row["employee_id"] if user_row else None
    
    import json
    # Resolve working station id by name
    loc_name = data.get("location", "Heavy Assembly Station 1")
    loc_row = db.execute(
        text("SELECT id FROM working_stations WHERE station_name = :name AND organisation_id = :org_id"),
        {"name": loc_name, "org_id": current_user.org_id}
    ).mappings().first()
    loc_id = loc_row["id"] if loc_row else 1

    # Save to incidents table
    db.execute(
        text("""
            INSERT INTO incidents (
                organisation_id, report_date, incident_date_time, location_station_id, incident_type,
                severity, description, immediate_cause, anyone_injured, injured_person_name,
                evidence_json, investigation_status, reported_by, workflow_status
            ) VALUES (
                :org_id, :report_date, :incident_date_time, :loc_id, :incident_type,
                :severity, :description, :immediate_cause, :anyone_injured, :injured_person_name,
                :evidence_json, :investigation_status, :reported_by, :workflow_status
            )
        """),
        {
            "org_id": current_user.org_id,
            "report_date": date.today(),
            "incident_date_time": datetime.now(),
            "loc_id": loc_id,
            "incident_type": data.get("incident_type", "injury"),
            "severity": data.get("severity", "medium"),
            "description": data.get("description", ""),
            "immediate_cause": data.get("reason", ""),
            "anyone_injured": data.get("anyone_injured", "No"),
            "injured_person_name": data.get("injured_person_name", None),
            "evidence_json": json.dumps(data.get("photos", [])),
            "investigation_status": "open",
            "reported_by": emp_id,
            "workflow_status": "reported"
        }
    )
    db.commit()
    new_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar()
    
    return {"success": True, "data": {"id": str(new_id), "status": "submitted"}}


@router.get("/incidents")
def list_driver_incidents(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
) -> dict:
    # Query all incidents for this organisation, ordered by ID desc
    rows = db.execute(
        text("""
            SELECT i.*, ws.station_name as location_name 
            FROM incidents i 
            LEFT JOIN working_stations ws ON i.location_station_id = ws.id 
            WHERE i.organisation_id = :org_id 
            ORDER BY i.id DESC
        """),
        {"org_id": current_user.org_id}
    ).mappings().all()
    
    items = []
    for r in rows:
        items.append({
            "id": str(r["id"]),
            "incident_type": r["incident_type"] or "injury",
            "severity": r["severity"] or "medium",
            "description": r["description"] or "",
            "location": r["location_name"] or "Zone B - Sector 4",
            "status": r["workflow_status"] or "reported",
            "created_at": r["created_at"].isoformat() if r["created_at"] else datetime.now().isoformat(),
            "incident_ref": f"INC-{r['id']}"
        })
        
    return {"success": True, "data": {"items": items, "total": len(items)}}


# ─── Checklists Endpoints ─────────────────────────────────────────────────────

@router.get("/checklists")
def list_checklists() -> dict:
    # Return checklists matching the templates
    return {"success": True, "data": {"items": []}}


@router.post("/checklists/{id}/submit")
def submit_checklist(id: str, payload: dict) -> dict:
    return {"success": True, "data": {"submission_id": "sub_check_" + id, "status": "success"}}


# ─── Notifications Endpoints ──────────────────────────────────────────────────

@router.get("/notifications")
def list_notifications(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
) -> dict:
    rows = db.execute(
        text("SELECT * FROM notifications WHERE organisation_id = :org_id ORDER BY id DESC LIMIT 20"),
        {"org_id": current_user.org_id}
    ).mappings().all()

    items = []
    for r in rows:
        items.append({
            "id": str(r["id"]),
            "title": r["title"] or "Safety Notification",
            "message": r["message"] or "",
            "type": r["type"].lower() if r["type"] else "info",
            "read": str(r["status"] or "").lower() in ("read", "seen"),
            "created_at": r["created_at"].isoformat() if r["created_at"] else datetime.now().isoformat()
        })

    if not items:
        items = [
            {
                "id": "n1",
                "title": "New Work Permit Approved",
                "message": "Permit for Welding in Maintenance Bay 4 has been approved.",
                "type": "success",
                "read": False,
                "created_at": datetime.now().isoformat()
            }
        ]

    return {"success": True, "data": {"items": items, "total": len(items)}}


# ─── Training Endpoints ────────────────────────────────────────────────────────

@router.get("/training")
def list_training(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
) -> dict:
    rows = db.execute(
        text("SELECT * FROM training_programs WHERE organisation_id = :org_id"),
        {"org_id": current_user.org_id}
    ).mappings().all()

    items = []
    for r in rows:
        # training_programs has no free-text description column; build a short
        # subtitle from frequency + certification so the UI has something real.
        parts = [str(r["frequency"]) if r["frequency"] else None,
                 f"Certification: {r['certification']}" if r["certification"] else None]
        description = " • ".join([p for p in parts if p])
        estimated_minutes = int(float(r["duration_hours"]) * 60) if r["duration_hours"] else 15
        items.append({
            "id": str(r["id"]),
            "title": r["training_name"] or "Safety Module",
            "description": description,
            "estimated_minutes": estimated_minutes,
            "xp_reward": 50,
            "is_mandatory": True,
            "status": "pending"
        })

    if not items:
        items = [
            {
                "id": "tr1",
                "title": "Heat Stress Prevention",
                "description": "Essential safety protocols for working in high-temperature environments.",
                "estimated_minutes": 15,
                "xp_reward": 50,
                "is_mandatory": True,
                "status": "pending"
            }
        ]

    return {"success": True, "data": {"items": items, "total": len(items)}}
