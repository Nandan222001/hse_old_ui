from datetime import date, datetime
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.capa_action import CapaAction
from app.models.employee import Employee
from app.models.incident import Incident
from app.models.near_miss import NearMiss
from app.models.permit_to_work import PermitToWork
from app.models.permit_type import PermitType
from app.models.site import Site
from app.models.working_station import WorkingStation

router = APIRouter(prefix="/analytics", tags=["Analytics"])

MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
RCA_COLORS = ["#4F8C2F", "#F5C116", "#F59E0B", "#2F3A4F", "#607D8B"]
CAUSE_COLORS = ["#8BC34A", "#FFC107", "#607D8B", "#2F3A4F", "#E91E63"]


@router.get("/violations-summary")
def get_violations_summary(months: int = 10, db: Session = Depends(get_db)):
    today = date.today()

    # Incidents by type
    by_type_rows = (
        db.query(Incident.incident_type, func.count(Incident.id).label("cnt"))
        .filter(Incident.incident_type.isnot(None))
        .group_by(Incident.incident_type)
        .order_by(func.count(Incident.id).desc())
        .limit(7)
        .all()
    )
    by_type = [{"label": r.incident_type, "value": r.cnt} for r in by_type_rows]

    # Incidents by location (working station)
    by_location_rows = (
        db.query(WorkingStation.station_name, func.count(Incident.id).label("cnt"))
        .join(Incident, Incident.location_station_id == WorkingStation.id)
        .group_by(WorkingStation.station_name)
        .order_by(func.count(Incident.id).desc())
        .limit(7)
        .all()
    )
    by_location = [{"label": r.station_name, "value": r.cnt} for r in by_location_rows]

    # Incidents by root cause category
    by_root_cause_rows = (
        db.query(Incident.root_cause_category, func.count(Incident.id).label("cnt"))
        .filter(Incident.root_cause_category.isnot(None))
        .group_by(Incident.root_cause_category)
        .order_by(func.count(Incident.id).desc())
        .limit(5)
        .all()
    )
    by_root_cause = [
        {"name": r.root_cause_category, "value": r.cnt, "color": RCA_COLORS[i % len(RCA_COLORS)]}
        for i, r in enumerate(by_root_cause_rows)
    ]
    cause_data = [
        {"name": r.root_cause_category, "value": r.cnt, "color": CAUSE_COLORS[i % len(CAUSE_COLORS)]}
        for i, r in enumerate(by_root_cause_rows[:3])
    ]

    # Monthly incident trend
    monthly_rows = (
        db.query(
            func.year(Incident.incident_date_time).label("yr"),
            func.month(Incident.incident_date_time).label("mo"),
            func.count(Incident.id).label("cnt"),
        )
        .filter(Incident.incident_date_time.isnot(None))
        .group_by("yr", "mo")
        .order_by("yr", "mo")
        .all()
    )
    monthly_trend = [
        {"month": MONTH_NAMES[int(r.mo) - 1], "value": r.cnt}
        for r in monthly_rows[-months:]
    ]

    # Monthly near miss trend
    nm_rows = (
        db.query(
            func.year(NearMiss.event_date_time).label("yr"),
            func.month(NearMiss.event_date_time).label("mo"),
            func.count(NearMiss.id).label("cnt"),
        )
        .filter(NearMiss.event_date_time.isnot(None))
        .group_by("yr", "mo")
        .order_by("yr", "mo")
        .all()
    )
    near_miss_monthly = [
        {"month": MONTH_NAMES[int(r.mo) - 1], "value": r.cnt}
        for r in nm_rows[-months:]
    ]

    # Downtime by incident type (sum days_away)
    downtime_rows = (
        db.query(Incident.incident_type, func.sum(Incident.days_away).label("total"))
        .filter(Incident.days_away.isnot(None), Incident.incident_type.isnot(None))
        .group_by(Incident.incident_type)
        .order_by(func.sum(Incident.days_away).asc())
        .limit(5)
        .all()
    )
    downtime_by_type = [
        {"label": r.incident_type, "value": float(r.total) if r.total else 0}
        for r in downtime_rows
    ]

    # Open CAPA action descriptions
    open_capa = (
        db.query(CapaAction)
        .filter(CapaAction.status != "Completed")
        .order_by(CapaAction.due_date.asc().nulls_last())
        .limit(4)
        .all()
    )
    open_capa_items = [
        f"{c.description or c.action_type or 'CAPA'} (#{c.id})"
        for c in open_capa
    ]

    # Severity mix by month (last 5 distinct months with data)
    sev_rows = (
        db.query(
            func.year(Incident.incident_date_time).label("yr"),
            func.month(Incident.incident_date_time).label("mo"),
            func.lower(Incident.severity).label("sev"),
            func.count(Incident.id).label("cnt"),
        )
        .filter(Incident.incident_date_time.isnot(None), Incident.severity.isnot(None))
        .group_by("yr", "mo", "sev")
        .order_by("yr", "mo")
        .all()
    )
    months_map: dict = {}
    for r in sev_rows:
        key = f"{int(r.yr)}-{int(r.mo):02d}"
        label = MONTH_NAMES[int(r.mo) - 1]
        if key not in months_map:
            months_map[key] = {"label": label, "critical": 0, "high": 0, "medium": 0, "low": 0}
        s = str(r.sev).lower()
        if "critical" in s:
            months_map[key]["critical"] += r.cnt
        elif "high" in s or "significant" in s:
            months_map[key]["high"] += r.cnt
        elif "medium" in s or "moderate" in s:
            months_map[key]["medium"] += r.cnt
        else:
            months_map[key]["low"] += r.cnt
    severity_mix = list(months_map.values())[-5:]

    return {
        "by_type": by_type,
        "by_location": by_location,
        "by_root_cause": by_root_cause,
        "cause_data": cause_data,
        "monthly_trend": monthly_trend,
        "near_miss_monthly": near_miss_monthly,
        "downtime_by_type": downtime_by_type,
        "open_capa_items": open_capa_items,
        "severity_mix": severity_mix,
    }


@router.get("/permits-summary")
def get_permits_summary(db: Session = Depends(get_db)):
    # Active permit count
    active_count = db.query(PermitToWork).filter(PermitToWork.status == "Active").count()
    total_workers = db.query(func.sum(PermitToWork.number_of_workers)).filter(
        PermitToWork.status == "Active"
    ).scalar() or 0

    # Permit counts by type for radar chart
    by_type_rows = (
        db.query(PermitType.permit_type_name, func.count(PermitToWork.id).label("cnt"))
        .join(PermitToWork, PermitToWork.permit_type_id == PermitType.id)
        .filter(PermitToWork.status == "Active")
        .group_by(PermitType.permit_type_name)
        .order_by(func.count(PermitToWork.id).desc())
        .limit(6)
        .all()
    )
    max_count = max((r.cnt for r in by_type_rows), default=1)
    risk_work_data = [
        {"subject": r.permit_type_name, "A": round((r.cnt / max_count) * 100)}
        for r in by_type_rows
    ]

    # Incidents where permit was active (violations)
    viol_rows = (
        db.query(Incident, WorkingStation)
        .outerjoin(WorkingStation, Incident.location_station_id == WorkingStation.id)
        .filter(Incident.permit_active == True)  # noqa: E712
        .order_by(Incident.incident_date_time.desc())
        .limit(5)
        .all()
    )
    permit_violations = [
        {
            "text": f"{ws.station_name if ws else 'Site'}: {inc.incident_type or 'Incident'}",
            "time": inc.incident_date_time.strftime("%I:%M %p") if inc.incident_date_time else "N/A",
        }
        for inc, ws in viol_rows
    ]

    # Active permits with details
    active_rows = (
        db.query(PermitToWork, PermitType, WorkingStation)
        .outerjoin(PermitType, PermitToWork.permit_type_id == PermitType.id)
        .outerjoin(WorkingStation, PermitToWork.location_station_id == WorkingStation.id)
        .filter(PermitToWork.status == "Active")
        .order_by(PermitToWork.validity_end.asc().nulls_last())
        .limit(10)
        .all()
    )

    def fmt_expiry(end_dt) -> str:
        if not end_dt:
            return "N/A"
        now = datetime.now()
        if hasattr(end_dt, "hour"):
            diff_secs = (end_dt - now).total_seconds()
        else:
            diff_secs = (datetime.combine(end_dt, datetime.min.time()) - now).total_seconds()
        if diff_secs < 0:
            return "Expired"
        hrs, rem = divmod(int(diff_secs), 3600)
        mins = rem // 60
        return f"{hrs}h {mins}m"

    active_work_rows = [
        {
            "id": f"PTW-{ptw.id:04d}",
            "type": pt.permit_type_name if pt else "Unknown",
            "contractor": f"{ptw.number_of_workers or 0} workers",
            "location": ws.station_name if ws else f"Station {ptw.location_station_id}",
            "status": ptw.status,
            "expiry": fmt_expiry(ptw.validity_end),
        }
        for ptw, pt, ws in active_rows
    ]

    timeline_colors = ["#D64545", "#C14B4B", "#E8B441", "#42A5C6", "#5070C9"]
    expiry_timeline = [
        {
            "label": f"{row['id']} ({row['expiry']})",
            "left": max(2, i * 12),
            "width": min(30 + i * 8, 60),
            "color": timeline_colors[i % len(timeline_colors)],
            "rightText": row["expiry"],
        }
        for i, row in enumerate(active_work_rows[:5])
    ]

    return {
        "active_permits": active_count,
        "total_workers_on_site": int(total_workers),
        "risk_work_data": risk_work_data,
        "permit_violations": permit_violations,
        "active_work_rows": active_work_rows,
        "expiry_timeline": expiry_timeline,
    }


@router.get("/risk-summary")
def get_risk_summary(db: Session = Depends(get_db)):
    today = date.today()

    # Zone risk — incidents grouped by site
    zone_rows = (
        db.query(Site.site_name, func.count(Incident.id).label("cnt"))
        .join(WorkingStation, WorkingStation.site_id == Site.id)
        .join(Incident, Incident.location_station_id == WorkingStation.id)
        .group_by(Site.site_name)
        .order_by(func.count(Incident.id).desc())
        .limit(5)
        .all()
    )
    zone_risk = [{"zone": r.site_name, "value": r.cnt} for r in zone_rows]

    # CAPA open tasks
    capa_rows = (
        db.query(CapaAction, Employee)
        .outerjoin(Employee, CapaAction.responsible_person_id == Employee.id)
        .filter(CapaAction.status != "Completed")
        .order_by(CapaAction.due_date.asc().nulls_last())
        .limit(5)
        .all()
    )

    def capa_status_label(c: CapaAction) -> str:
        if not c.due_date:
            return "Pending (Yellow)"
        days = (c.due_date - today).days
        if days < 0:
            return "Overdue (Red)"
        if days <= 3:
            return "In Progress (Amber)"
        return "Pending (Yellow)"

    task_rows = [
        {
            "id": f"T-{c.id:03d}",
            "desc": c.description or c.action_type or "CAPA Action",
            "owner": emp.full_name if emp else "Unassigned",
            "due": c.due_date.strftime("%b %d, %Y") if c.due_date else "No Date",
            "status": capa_status_label(c),
        }
        for c, emp in capa_rows
    ]

    # Aging buckets for all open CAPA
    def aging_label(due_date) -> str:
        if not due_date:
            return ">90 Days"
        days_over = (today - due_date).days
        if days_over <= 30:
            return "0-30 Days"
        if days_over <= 60:
            return "31-60 Days"
        if days_over <= 90:
            return "61-90 Days"
        return ">90 Days"

    all_open = db.query(CapaAction).filter(CapaAction.status != "Completed").all()
    bucket_labels = ["0-30 Days", "31-60 Days", "61-90 Days", ">90 Days"]
    buckets: dict = {b: {"bucket": b, "low": 0, "medium": 0, "high": 0, "critical": 0, "line": 0} for b in bucket_labels}
    for c in all_open:
        bk = aging_label(c.due_date)
        buckets[bk]["line"] += 1
        if c.due_date:
            over = (today - c.due_date).days
            if over > 60:
                buckets[bk]["critical"] += 1
            elif over > 30:
                buckets[bk]["high"] += 1
            elif over > 0:
                buckets[bk]["medium"] += 1
            else:
                buckets[bk]["low"] += 1
        else:
            buckets[bk]["medium"] += 1
    aging_bars = list(buckets.values())

    # KPIs
    capa_total = db.query(CapaAction).count()
    capa_done = db.query(CapaAction).filter(CapaAction.status == "Completed").count()
    effectiveness = round((capa_done / capa_total * 100) if capa_total else 0)
    open_count = db.query(CapaAction).filter(CapaAction.status != "Completed").count()
    overdue_count = db.query(CapaAction).filter(
        CapaAction.status != "Completed",
        CapaAction.due_date < today,
        CapaAction.due_date.isnot(None),
    ).count()

    return {
        "zone_risk": zone_risk,
        "task_rows": task_rows,
        "aging_bars": aging_bars,
        "kpis": {
            "control_effectiveness": f"{effectiveness}%",
            "unverified_controls": open_count,
            "risk_escalations": overdue_count,
        },
    }
