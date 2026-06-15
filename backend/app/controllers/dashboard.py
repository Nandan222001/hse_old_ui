from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.capa_action import CapaAction
from app.models.employee import Employee
from app.models.hazard import Hazard
from app.models.hazard_category import HazardCategory
from app.models.incident import Incident
from app.models.near_miss import NearMiss
from app.models.permit_to_work import PermitToWork
from app.models.permit_type import PermitType
from app.models.safety_walk import SafetyWalk
from app.models.site import Site
from app.models.working_station import WorkingStation

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    today = date.today()

    total_incidents = db.query(Incident).count()
    open_capa_actions = db.query(CapaAction).filter(CapaAction.status != "Completed").count()
    overdue_capa = db.query(CapaAction).filter(
        CapaAction.status != "Completed",
        CapaAction.due_date < today,
        CapaAction.due_date.isnot(None),
    ).count()
    active_permits = db.query(PermitToWork).filter(PermitToWork.status == "Active").count()
    total_employees = db.query(Employee).count()
    total_sites = db.query(Site).count()
    near_misses_count = db.query(NearMiss).count()
    safety_walks_count = db.query(SafetyWalk).count()

    avg_compliance = db.query(func.avg(SafetyWalk.compliance_rating)).scalar()
    avg_housekeeping = db.query(func.avg(SafetyWalk.housekeeping_rating)).scalar()

    critical_incidents = db.query(Incident).filter(
        func.lower(Incident.severity).in_(["critical", "significant"])
    ).count()

    capa_completed = db.query(CapaAction).filter(CapaAction.status == "Completed").count()
    capa_total = db.query(CapaAction).count()
    capa_completion_rate = round((capa_completed / capa_total * 100) if capa_total else 0, 1)

    return {
        "total_incidents": total_incidents,
        "open_capa_actions": open_capa_actions,
        "overdue_capa": overdue_capa,
        "active_permits": active_permits,
        "total_employees": total_employees,
        "total_sites": total_sites,
        "near_misses_count": near_misses_count,
        "safety_walks_count": safety_walks_count,
        "avg_compliance_rating": round(float(avg_compliance), 1) if avg_compliance else 0,
        "avg_housekeeping_rating": round(float(avg_housekeeping), 1) if avg_housekeeping else 0,
        "critical_incidents": critical_incidents,
        "capa_completion_rate": capa_completion_rate,
    }


@router.get("/capa-actions")
def get_ranked_capa_actions(limit: int = 10, db: Session = Depends(get_db)):
    today = date.today()
    rows = (
        db.query(CapaAction, Employee)
        .outerjoin(Employee, CapaAction.responsible_person_id == Employee.id)
        .filter(CapaAction.status != "Completed")
        .order_by(case((CapaAction.due_date.is_(None), 1), else_=0), CapaAction.due_date.asc())
        .limit(limit)
        .all()
    )
    result = []
    for capa, emp in rows:
        days_until_due = None
        is_overdue = False
        if capa.due_date:
            delta = (capa.due_date - today).days
            days_until_due = delta
            is_overdue = delta < 0
        result.append({
            "id": capa.id,
            "description": capa.description,
            "action_type": capa.action_type,
            "root_cause_addressed": capa.root_cause_addressed,
            "status": capa.status,
            "due_date": capa.due_date.isoformat() if capa.due_date else None,
            "days_until_due": days_until_due,
            "is_overdue": is_overdue,
            "incident_id": capa.incident_id,
            "assignee": emp.full_name if emp else "Unassigned",
            "priority": "High" if is_overdue else ("Medium" if days_until_due is not None and days_until_due <= 7 else "Low"),
        })
    return result


@router.get("/overdue-capa")
def get_overdue_capa(limit: int = 10, db: Session = Depends(get_db)):
    today = date.today()
    rows = (
        db.query(CapaAction)
        .filter(
            CapaAction.status != "Completed",
            CapaAction.due_date < today,
            CapaAction.due_date.isnot(None),
        )
        .order_by(CapaAction.due_date.asc())
        .limit(limit)
        .all()
    )
    result = []
    for c in rows:
        days_overdue = (today - c.due_date).days if c.due_date else 0
        result.append({
            "id": c.id,
            "incident_id": c.incident_id,
            "description": c.description,
            "action_type": c.action_type,
            "status": c.status,
            "due_date": c.due_date.isoformat() if c.due_date else None,
            "days_overdue": days_overdue,
            "label": f"Incident #{c.incident_id} - {c.action_type or 'Action'} - {days_overdue} Day{'s' if days_overdue != 1 else ''} Overdue",
        })
    return result


@router.get("/incidents-by-category")
def get_incidents_by_category(db: Session = Depends(get_db)):
    rows = (
        db.query(
            HazardCategory.category_name,
            func.count(Incident.id).label("count"),
        )
        .outerjoin(Hazard, Hazard.category_id == HazardCategory.id)
        .outerjoin(Incident, Incident.hazard_id == Hazard.id)
        .group_by(HazardCategory.category_name)
        .order_by(func.count(Incident.id).desc())
        .limit(8)
        .all()
    )
    return [{"name": r.category_name, "data": r.count, "intelligence": max(0, r.count - 5)} for r in rows]


@router.get("/incidents-by-severity")
def get_incidents_by_severity(db: Session = Depends(get_db)):
    rows = (
        db.query(Incident.severity, func.count(Incident.id).label("count"))
        .filter(Incident.severity.isnot(None))
        .group_by(Incident.severity)
        .all()
    )
    return [{"severity": r.severity, "count": r.count} for r in rows]


@router.get("/compliance-trend")
def get_compliance_trend(days: int = 30, db: Session = Depends(get_db)):
    cutoff = date.today() - timedelta(days=days)
    rows = (
        db.query(
            func.date(SafetyWalk.inspection_date_time).label("day"),
            func.avg(SafetyWalk.compliance_rating).label("avg_score"),
        )
        .filter(SafetyWalk.inspection_date_time.isnot(None))
        .filter(func.date(SafetyWalk.inspection_date_time) >= cutoff)
        .group_by(func.date(SafetyWalk.inspection_date_time))
        .order_by(func.date(SafetyWalk.inspection_date_time).asc())
        .all()
    )
    return [
        {"date": str(r.day), "score": round(float(r.avg_score) * 20, 1) if r.avg_score else 0}
        for r in rows
    ]


@router.get("/safety-walks-recent")
def get_safety_walks_recent(limit: int = 5, db: Session = Depends(get_db)):
    rows = (
        db.query(SafetyWalk, WorkingStation, Employee)
        .outerjoin(WorkingStation, SafetyWalk.location_station_id == WorkingStation.id)
        .outerjoin(Employee, SafetyWalk.inspector_id == Employee.id)
        .order_by(SafetyWalk.inspection_date_time.desc())
        .limit(limit)
        .all()
    )
    result = []
    for sw, ws, emp in rows:
        result.append({
            "id": sw.id,
            "inspection_date_time": sw.inspection_date_time.isoformat() if sw.inspection_date_time else None,
            "location": ws.station_name if ws else f"Station {sw.location_station_id}",
            "inspector": emp.full_name if emp else "Unknown",
            "inspection_type": sw.inspection_type,
            "issues_found": sw.issues_found or 0,
            "critical_issues": sw.critical_issues or 0,
            "compliance_rating": sw.compliance_rating,
            "follow_up_required": sw.follow_up_required,
            "priority": "Critical" if (sw.critical_issues or 0) > 0 else ("High" if (sw.issues_found or 0) > 2 else "Medium"),
        })
    return result


@router.get("/near-misses-recent")
def get_near_misses_recent(limit: int = 5, db: Session = Depends(get_db)):
    rows = (
        db.query(NearMiss, WorkingStation, Employee)
        .outerjoin(WorkingStation, NearMiss.location_station_id == WorkingStation.id)
        .outerjoin(Employee, NearMiss.reported_by == Employee.id)
        .order_by(NearMiss.event_date_time.desc())
        .limit(limit)
        .all()
    )
    result = []
    for nm, ws, emp in rows:
        result.append({
            "id": nm.id,
            "report_date": nm.report_date.isoformat() if nm.report_date else None,
            "event_date_time": nm.event_date_time.isoformat() if nm.event_date_time else None,
            "location": ws.station_name if ws else f"Station {nm.location_station_id}",
            "description": nm.description,
            "potential_consequence": nm.potential_consequence,
            "underlying_cause": nm.underlying_cause,
            "reporter": emp.full_name if emp else "Unknown",
            "capa_escalation": nm.capa_escalation,
            "severity": "High" if nm.potential_consequence and "fatal" in (nm.potential_consequence or "").lower() else "Medium",
        })
    return result


@router.get("/permits-active")
def get_active_permits(limit: int = 10, db: Session = Depends(get_db)):
    rows = (
        db.query(PermitToWork, PermitType, WorkingStation)
        .outerjoin(PermitType, PermitToWork.permit_type_id == PermitType.id)
        .outerjoin(WorkingStation, PermitToWork.location_station_id == WorkingStation.id)
        .filter(PermitToWork.status == "Active")
        .order_by(PermitToWork.validity_end.asc())
        .limit(limit)
        .all()
    )
    result = []
    for ptw, pt, ws in rows:
        result.append({
            "id": ptw.id,
            "permit_ref": f"PTW-{ptw.id:04d}",
            "permit_type": pt.permit_type_name if pt else "Unknown",
            "location": ws.station_name if ws else f"Station {ptw.location_station_id}",
            "work_description": ptw.work_description,
            "number_of_workers": ptw.number_of_workers,
            "validity_start": ptw.validity_start.isoformat() if ptw.validity_start else None,
            "validity_end": ptw.validity_end.isoformat() if ptw.validity_end else None,
            "status": ptw.status,
        })
    return result
