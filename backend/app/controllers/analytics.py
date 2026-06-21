from datetime import date, datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import case, func, or_
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.core.dependencies import get_current_user, CurrentUser
from app.models.capa_action import CapaAction
from app.models.employee import Employee
from app.models.hazard import Hazard
from app.models.hazard_category import HazardCategory
from app.models.incident import Incident
from app.models.near_miss import NearMiss
from app.models.permit_to_work import PermitToWork
from app.models.permit_type import PermitType
from app.models.policy import Policy
from app.models.safety_walk import SafetyWalk
from app.models.site import Site
from app.models.working_station import WorkingStation

router = APIRouter(prefix="/analytics", tags=["Analytics"])

MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
RCA_COLORS = ["#4F8C2F", "#F5C116", "#F59E0B", "#2F3A4F", "#607D8B"]
CAUSE_COLORS = ["#8BC34A", "#FFC107", "#607D8B", "#2F3A4F", "#E91E63"]


def _org_filter(query, model, org_id):
    """Filter by org_id only. NULL organisation rows are not tenant data."""
    if org_id is not None:
        return query.filter(model.organisation_id == org_id)
    return query


@router.get("/violations-summary")
def get_violations_summary(months: int = 10, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    today = date.today()
    org_id = current_user.org_id

    by_type_rows = (
        _org_filter(
            db.query(Incident.incident_type, func.count(Incident.id).label("cnt"))
            .filter(Incident.incident_type.isnot(None)),
            Incident, org_id,
        )
        .group_by(Incident.incident_type)
        .order_by(func.count(Incident.id).desc())
        .limit(7)
        .all()
    )
    by_type = [{"label": r.incident_type, "value": r.cnt} for r in by_type_rows]

    by_location_rows = (
        db.query(WorkingStation.station_name, func.count(Incident.id).label("cnt"))
        .join(Incident, Incident.location_station_id == WorkingStation.id)
        .filter(Incident.organisation_id == org_id if org_id is not None else True)
        .group_by(WorkingStation.station_name)
        .order_by(func.count(Incident.id).desc())
        .limit(7)
        .all()
    )
    by_location = [{"label": r.station_name, "value": r.cnt} for r in by_location_rows]

    by_root_cause_rows = (
        _org_filter(
            db.query(Incident.root_cause_category, func.count(Incident.id).label("cnt"))
            .filter(Incident.root_cause_category.isnot(None)),
            Incident, org_id,
        )
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

    monthly_rows = (
        _org_filter(
            db.query(
                func.year(Incident.incident_date_time).label("yr"),
                func.month(Incident.incident_date_time).label("mo"),
                func.count(Incident.id).label("cnt"),
            ).filter(Incident.incident_date_time.isnot(None)),
            Incident, org_id,
        )
        .group_by("yr", "mo")
        .order_by("yr", "mo")
        .all()
    )
    monthly_trend = [
        {"month": MONTH_NAMES[int(r.mo) - 1], "value": r.cnt}
        for r in monthly_rows[-months:]
    ]

    nm_rows = (
        _org_filter(
            db.query(
                func.year(NearMiss.event_date_time).label("yr"),
                func.month(NearMiss.event_date_time).label("mo"),
                func.count(NearMiss.id).label("cnt"),
            ).filter(NearMiss.event_date_time.isnot(None)),
            NearMiss, org_id,
        )
        .group_by("yr", "mo")
        .order_by("yr", "mo")
        .all()
    )
    near_miss_monthly = [
        {"month": MONTH_NAMES[int(r.mo) - 1], "value": r.cnt}
        for r in nm_rows[-months:]
    ]

    downtime_rows = (
        _org_filter(
            db.query(Incident.incident_type, func.sum(Incident.days_away).label("total"))
            .filter(Incident.days_away.isnot(None), Incident.incident_type.isnot(None)),
            Incident, org_id,
        )
        .group_by(Incident.incident_type)
        .order_by(func.sum(Incident.days_away).asc())
        .limit(5)
        .all()
    )
    downtime_by_type = [
        {"label": r.incident_type, "value": float(r.total) if r.total else 0}
        for r in downtime_rows
    ]

    open_capa = (
        _org_filter(
            db.query(CapaAction).filter(CapaAction.status != "Completed"),
            CapaAction, org_id,
        )
        .order_by(case((CapaAction.due_date.is_(None), 1), else_=0), CapaAction.due_date.asc())
        .limit(4)
        .all()
    )
    open_capa_items = [
        f"{c.description or c.action_type or 'CAPA'} (#{c.id})"
        for c in open_capa
    ]

    sev_rows = (
        _org_filter(
            db.query(
                func.year(Incident.incident_date_time).label("yr"),
                func.month(Incident.incident_date_time).label("mo"),
                func.lower(Incident.severity).label("sev"),
                func.count(Incident.id).label("cnt"),
            ).filter(Incident.incident_date_time.isnot(None), Incident.severity.isnot(None)),
            Incident, org_id,
        )
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
        bucket = _rca_priority(r.sev).lower()
        months_map[key][bucket] += r.cnt
    severity_mix = list(months_map.values())[-5:]

    # Injury cause (immediate_cause column — closest proxy to body-part/injury cause)
    injury_cat_rows = (
        _org_filter(
            db.query(Incident.immediate_cause, func.count(Incident.id).label("cnt"))
            .filter(Incident.immediate_cause.isnot(None)),
            Incident, org_id,
        )
        .group_by(Incident.immediate_cause)
        .order_by(func.count(Incident.id).desc())
        .limit(7)
        .all()
    )
    injury_category = [{"label": r.immediate_cause, "value": r.cnt} for r in injury_cat_rows]

    # Person involved — group by employment_type of the employee who reported
    person_rows = (
        db.query(Employee.employment_type, func.count(Incident.id).label("cnt"))
        .join(Incident, Incident.reported_by == Employee.id)
        .filter(
            Employee.employment_type.isnot(None),
            *([Incident.organisation_id == org_id] if org_id is not None else []),
        )
        .group_by(Employee.employment_type)
        .order_by(func.count(Incident.id).desc())
        .limit(6)
        .all()
    )
    person_involved = [{"label": r.employment_type, "value": r.cnt} for r in person_rows]

    # Injury type — root_cause column describes how the injury happened
    injury_type_rows = (
        _org_filter(
            db.query(Incident.root_cause, func.count(Incident.id).label("cnt"))
            .filter(Incident.root_cause.isnot(None)),
            Incident, org_id,
        )
        .group_by(Incident.root_cause)
        .order_by(func.count(Incident.id).desc())
        .limit(7)
        .all()
    )
    injury_type = [{"label": r.root_cause, "value": r.cnt} for r in injury_type_rows]

    # Key learnings — latest incident descriptions (first sentence, max 120 chars)
    learning_rows = (
        _org_filter(
            db.query(Incident.description)
            .filter(Incident.description.isnot(None)),
            Incident, org_id,
        )
        .order_by(Incident.id.desc())
        .limit(6)
        .all()
    )
    key_learnings = [
        (r.description.split(".")[0].strip()[:120] or r.description[:120])
        for r in learning_rows
        if r.description
    ]

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
        "injury_category": injury_category,
        "person_involved": person_involved,
        "injury_type": injury_type,
        "key_learnings": key_learnings,
    }


@router.get("/permits-summary")
def get_permits_summary(db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    org_id = current_user.org_id

    active_count = _org_filter(
        db.query(PermitToWork).filter(PermitToWork.status == "Active"),
        PermitToWork, org_id,
    ).count()

    total_workers = _org_filter(
        db.query(func.sum(PermitToWork.number_of_workers)).filter(PermitToWork.status == "Active"),
        PermitToWork, org_id,
    ).scalar() or 0

    by_type_rows = (
        db.query(PermitType.permit_type_name, func.count(PermitToWork.id).label("cnt"))
        .join(PermitToWork, PermitToWork.permit_type_id == PermitType.id)
        .filter(
            PermitToWork.status == "Active",
            *([PermitToWork.organisation_id == org_id] if org_id is not None else []),
        )
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

    viol_rows = (
        db.query(Incident, WorkingStation)
        .outerjoin(WorkingStation, Incident.location_station_id == WorkingStation.id)
        .filter(
            Incident.permit_active == "Yes",
            *([Incident.organisation_id == org_id] if org_id is not None else []),
        )
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

    active_rows = (
        db.query(PermitToWork, PermitType, WorkingStation)
        .outerjoin(PermitType, PermitToWork.permit_type_id == PermitType.id)
        .outerjoin(WorkingStation, PermitToWork.location_station_id == WorkingStation.id)
        .filter(
            PermitToWork.status == "Active",
            *([PermitToWork.organisation_id == org_id] if org_id is not None else []),
        )
        .order_by(case((PermitToWork.validity_end.is_(None), 1), else_=0), PermitToWork.validity_end.asc())
        .limit(10)
        .all()
    )

    def fmt_expiry(end_dt) -> str:
        if not end_dt:
            return "N/A"
        return end_dt.strftime("%b %d, %H:%M") if hasattr(end_dt, "hour") else end_dt.strftime("%b %d, %Y")

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

    work_exposure_hours = int(
        _org_filter(
            db.query(func.sum(PermitToWork.duration_requested_hours * PermitToWork.number_of_workers))
            .filter(PermitToWork.status == "Active"),
            PermitToWork, org_id,
        ).scalar() or 0
    )

    total_permits = _org_filter(db.query(PermitToWork), PermitToWork, org_id).count()
    compliant_permits = _org_filter(
        db.query(PermitToWork).filter(
            PermitToWork.deviation_reported != "Yes", PermitToWork.incident_occurred != "Yes"
        ),
        PermitToWork, org_id,
    ).count()
    permit_compliance_pct = round(compliant_permits / total_permits * 100, 1) if total_permits else 0

    is_contractor = func.lower(Employee.employment_type).like("%contract%")
    contractor_q = db.query(Employee).filter(is_contractor)
    if org_id is not None:
        contractor_q = contractor_q.filter(Employee.organisation_id == org_id)
    contractor_employee_ids = [e.id for e in contractor_q.all()]

    contractor_permit_filter = or_(
        PermitToWork.issued_by.in_(contractor_employee_ids),
        PermitToWork.approved_by.in_(contractor_employee_ids),
    ) if contractor_employee_ids else None
    if contractor_permit_filter is not None:
        contractor_total = _org_filter(
            db.query(PermitToWork).filter(contractor_permit_filter), PermitToWork, org_id
        ).count()
        contractor_compliant = _org_filter(
            db.query(PermitToWork).filter(
                contractor_permit_filter,
                PermitToWork.deviation_reported != "Yes",
                PermitToWork.incident_occurred != "Yes",
            ),
            PermitToWork, org_id,
        ).count()
    else:
        contractor_total = contractor_compliant = 0
    contractor_compliant_pct = round(contractor_compliant / contractor_total * 100) if contractor_total else 0
    contractor_non_compliant_pct = 100 - contractor_compliant_pct if contractor_total else 0

    deviation_rows = (
        db.query(PermitToWork, PermitType)
        .outerjoin(PermitType, PermitToWork.permit_type_id == PermitType.id)
        .filter(
            PermitToWork.status == "Active",
            PermitToWork.deviation_reported == "Yes",
            *([PermitToWork.organisation_id == org_id] if org_id is not None else []),
        )
        .order_by(case((PermitToWork.validity_end.is_(None), 1), else_=0), PermitToWork.validity_end.asc())
        .limit(4)
        .all()
    )
    missing_controls = [
        f"{ptw.work_description or (pt.permit_type_name if pt else 'Work')} — Deviation Reported (PTW-{ptw.id:04d})"
        for ptw, pt in deviation_rows
    ]

    type_status_rows = (
        db.query(PermitType.permit_type_name, PermitToWork.status, func.count(PermitToWork.id))
        .join(PermitToWork, PermitToWork.permit_type_id == PermitType.id)
        .filter(*([PermitToWork.organisation_id == org_id] if org_id is not None else []))
        .group_by(PermitType.permit_type_name, PermitToWork.status)
        .all()
    )
    by_type_status: dict[str, dict[str, int]] = {}
    for type_name, status_val, cnt in type_status_rows:
        by_type_status.setdefault(type_name, {})[status_val or "Unknown"] = cnt
    work_by_type = []
    for type_name, status_counts in sorted(by_type_status.items(), key=lambda kv: -sum(kv[1].values()))[:6]:
        total_for_type = sum(status_counts.values()) or 1
        work_by_type.append({
            "name": type_name,
            "active": round(status_counts.get("Active", 0) / total_for_type * 100),
            "closed": round(status_counts.get("Closed", 0) / total_for_type * 100),
            "expired": round(status_counts.get("Expired", 0) / total_for_type * 100),
        })

    return {
        "active_permits": active_count,
        "total_workers_on_site": int(total_workers),
        "risk_work_data": risk_work_data,
        "permit_violations": permit_violations,
        "active_work_rows": active_work_rows,
        "expiry_timeline": expiry_timeline,
        "work_exposure_hours": work_exposure_hours,
        "permit_compliance_pct": permit_compliance_pct,
        "missing_controls": missing_controls,
        "work_by_type": work_by_type,
        "contractor_compliant_pct": contractor_compliant_pct,
        "contractor_non_compliant_pct": contractor_non_compliant_pct,
    }


@router.get("/residual-risk-trend")
def get_residual_risk_trend(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    org_id = current_user.org_id

    latest_dt = _org_filter(db.query(func.max(Incident.incident_date_time)), Incident, org_id).scalar()
    anchor = latest_dt.date() if latest_dt else date.today()

    def _severity_weight(sev: str) -> int:
        s = (sev or "").lower()
        if "significant" in s:
            return 5
        if "lost time" in s or "major" in s:
            return 4
        if "serious" in s:
            return 3
        if "moderate" in s:
            return 2
        return 1

    quarter_days = 91
    raw_scores = []
    for i in range(3, -1, -1):
        q_end = anchor - timedelta(days=i * quarter_days)
        q_start = q_end - timedelta(days=quarter_days)
        rows = _org_filter(
            db.query(Incident.severity).filter(
                Incident.incident_date_time.isnot(None),
                Incident.incident_date_time >= q_start,
                Incident.incident_date_time < q_end,
            ),
            Incident, org_id,
        ).all()
        raw_scores.append(sum(_severity_weight(sev) for (sev,) in rows))

    max_raw = max(raw_scores) if any(raw_scores) else 1
    return [
        {"q": f"Q{i + 1}", "risk": round(score / max_raw * 100) if max_raw else 0}
        for i, score in enumerate(raw_scores)
    ]


@router.get("/risk-matrix")
def get_risk_matrix(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    org_id = current_user.org_id

    def _sev_row(sev: str) -> int | None:
        s = (sev or "").lower()
        if "fatal" in s or "catastrophic" in s:
            return 0
        if "significant" in s:
            return 1
        if "serious" in s or ("moderate" in s and "high" not in s):
            return 2
        if "low" in s or "minor" in s:
            return 3
        if "negligible" in s:
            return 4
        return None

    def _prob_col(prob: str) -> int | None:
        p = (prob or "").lower()
        if "frequent" in p or "likely" in p:
            return 0
        if "probable" in p:
            return 1
        if "possible" in p or "occasional" in p:
            return 2
        if "unlikely" in p or "remote" in p:
            return 3
        if "rare" in p or "improbable" in p:
            return 4
        return None

    hazards = _org_filter(
        db.query(Hazard.severity, Hazard.probability), Hazard, org_id
    ).all()

    counts = [[0] * 5 for _ in range(5)]
    for sev, prob in hazards:
        r = _sev_row(sev or "")
        c = _prob_col(prob or "")
        if r is not None and c is not None:
            counts[r][c] += 1

    return {"counts": counts}


@router.get("/risk-summary")
def get_risk_summary(db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    today = date.today()
    org_id = current_user.org_id

    zone_rows = (
        db.query(Site.site_name, func.count(Incident.id).label("cnt"))
        .join(WorkingStation, WorkingStation.site_id == Site.id)
        .join(Incident, Incident.location_station_id == WorkingStation.id)
        .filter(*([Incident.organisation_id == org_id] if org_id is not None else []))
        .group_by(Site.site_name)
        .order_by(func.count(Incident.id).desc())
        .limit(5)
        .all()
    )
    zone_risk = [{"zone": r.site_name, "value": r.cnt} for r in zone_rows]

    capa_rows = (
        _org_filter(
            db.query(CapaAction, Employee)
            .outerjoin(Employee, CapaAction.responsible_person_id == Employee.id)
            .filter(CapaAction.status != "Completed"),
            CapaAction, org_id,
        )
        .order_by(case((CapaAction.due_date.is_(None), 1), else_=0), CapaAction.due_date.asc())
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

    all_open = _org_filter(
        db.query(CapaAction).filter(CapaAction.status != "Completed"),
        CapaAction, org_id,
    ).all()
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

    capa_total = _org_filter(db.query(CapaAction), CapaAction, org_id).count()
    capa_done = _org_filter(
        db.query(CapaAction).filter(CapaAction.status == "Completed"), CapaAction, org_id
    ).count()
    effectiveness = round((capa_done / capa_total * 100) if capa_total else 0)
    open_count = _org_filter(
        db.query(CapaAction).filter(CapaAction.status != "Completed"), CapaAction, org_id
    ).count()
    overdue_count = _org_filter(
        db.query(CapaAction).filter(
            CapaAction.status != "Completed",
            CapaAction.due_date < today,
            CapaAction.due_date.isnot(None),
        ),
        CapaAction, org_id,
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


def _rca_status(investigation_status: Optional[str]) -> str:
    s = (investigation_status or "").lower()
    if "complete" in s or "closed" in s:
        return "Closed"
    if "progress" in s:
        return "In Progress"
    return "Pending"


def _rca_priority(severity: Optional[str]) -> str:
    s = (severity or "").lower()
    if "critical" in s or "significant" in s or "fatal" in s:
        return "Critical"
    if "high" in s or "major" in s or "lost time" in s:
        return "High"
    if "medium" in s or "moderate" in s or "serious" in s:
        return "Medium"
    return "Low"


@router.get("/root-cause-analysis")
def get_root_cause_analysis(
    status: Optional[str] = None,
    site_id: Optional[str] = None,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    org_id = current_user.org_id

    rows = (
        _org_filter(
            db.query(Incident, WorkingStation, Site, Employee)
            .outerjoin(WorkingStation, Incident.location_station_id == WorkingStation.id)
            .outerjoin(Site, WorkingStation.site_id == Site.id)
            .outerjoin(Employee, Incident.reported_by == Employee.id),
            Incident, org_id,
        )
        .order_by(Incident.id.desc())
        .limit(limit)
        .all()
    )

    incident_ids = [inc.id for inc, _, _, _ in rows]
    capa_rows = (
        _org_filter(
            db.query(CapaAction).filter(CapaAction.incident_id.in_(incident_ids)),
            CapaAction, org_id,
        ).all()
        if incident_ids
        else []
    )
    capa_by_incident: dict[int, list[CapaAction]] = {}
    for c in capa_rows:
        capa_by_incident.setdefault(c.incident_id, []).append(c)

    results = []
    for inc, ws, site, emp in rows:
        rca_status = _rca_status(inc.investigation_status)
        capas = capa_by_incident.get(inc.id, [])
        preventive = [c.description for c in capas if c.description and "prevent" in (c.action_type or "").lower()]
        corrective = [c.description for c in capas if c.description and c.description not in preventive]

        completion_date = None
        if rca_status == "Closed":
            completed_due_dates = [c.due_date for c in capas if c.due_date and (c.status or "").lower() == "completed"]
            any_due_dates = [c.due_date for c in capas if c.due_date]
            if completed_due_dates:
                completion_date = max(completed_due_dates)
            elif any_due_dates:
                completion_date = max(any_due_dates)

        start_date = ""
        if inc.incident_date_time:
            start_date = inc.incident_date_time.date().isoformat()
        elif inc.report_date:
            start_date = inc.report_date.isoformat()

        results.append({
            "RCA_ID": f"RCA-{inc.id:04d}",
            "Incident_ID": f"INC-{inc.id:05d}",
            "Incident_Type": inc.incident_type or "Unknown",
            "Site_ID": site.site_name if site else "—",
            "Zone_ID": ws.zone_classification if ws else "—",
            "Conducted_By": emp.full_name if emp else "Unknown",
            "Start_Date": start_date,
            "Completion_Date": completion_date.isoformat() if completion_date else "",
            "Root_Causes": inc.root_cause or inc.root_cause_category or "Under investigation",
            "Contributing_Factors": inc.immediate_cause or "—",
            "Corrective_Actions": "; ".join(corrective) if corrective else "—",
            "Preventive_Measures": "; ".join(preventive) if preventive else "—",
            "Status": rca_status,
            "Priority": _rca_priority(inc.severity),
        })

    if status:
        results = [r for r in results if r["Status"] == status]
    if site_id:
        results = [r for r in results if r["Site_ID"] == site_id]

    return results


@router.get("/compliance-summary")
def get_compliance_summary(db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    org_id = current_user.org_id

    total_permits = _org_filter(db.query(PermitToWork), PermitToWork, org_id).count()
    compliant_permits = _org_filter(
        db.query(PermitToWork).filter(
            PermitToWork.deviation_reported != "Yes", PermitToWork.incident_occurred != "Yes"
        ),
        PermitToWork, org_id,
    ).count()
    permit_compliance_pct = round(compliant_permits / total_permits * 100) if total_permits else 0

    total_policies = _org_filter(db.query(Policy), Policy, org_id).count()
    current_policies = _org_filter(
        db.query(Policy).filter(Policy.status == "Current"), Policy, org_id
    ).count()
    policy_review_pct = round(current_policies / total_policies * 100) if total_policies else 0

    distinct_policy_categories = _org_filter(
        db.query(func.count(func.distinct(Policy.category))), Policy, org_id
    ).scalar() or 0
    distinct_hazard_categories = (
        db.query(func.count(func.distinct(HazardCategory.category_name))).scalar() or 0
    )
    legal_register_pct = (
        min(100, round(distinct_policy_categories / distinct_hazard_categories * 100))
        if distinct_hazard_categories else 0
    )

    avg_compliance = _org_filter(
        db.query(func.avg(SafetyWalk.compliance_rating)), SafetyWalk, org_id
    ).scalar()
    audit_readiness_pct = round(float(avg_compliance) / 5 * 100) if avg_compliance else 0

    compliance_score = round((permit_compliance_pct + legal_register_pct + audit_readiness_pct) / 3)
    compliance_label = "Excellent" if compliance_score >= 85 else ("Good" if compliance_score >= 70 else "Needs Improvement")
    legal_label = "High" if legal_register_pct >= 85 else ("Medium" if legal_register_pct >= 60 else "Low")
    audit_label = "Ready" if audit_readiness_pct >= 80 else ("Needs Attention" if audit_readiness_pct >= 60 else "Not Ready")

    latest_walk_date = _org_filter(
        db.query(func.max(SafetyWalk.inspection_date_time)), SafetyWalk, org_id
    ).scalar()
    trend_rows = (
        _org_filter(
            db.query(
                func.year(SafetyWalk.inspection_date_time).label("yr"),
                func.month(SafetyWalk.inspection_date_time).label("mo"),
                func.avg(SafetyWalk.compliance_rating).label("avg_rating"),
            ).filter(SafetyWalk.inspection_date_time.isnot(None)),
            SafetyWalk, org_id,
        )
        .group_by("yr", "mo")
        .order_by("yr", "mo")
        .all()
    ) if latest_walk_date else []
    compliance_trend = [
        {"month": MONTH_NAMES[int(r.mo) - 1], "value": round(float(r.avg_rating) / 5 * 100)}
        for r in trend_rows[-10:]
    ]
    trend_mom = None
    if len(compliance_trend) >= 2:
        prev, curr = compliance_trend[-2]["value"], compliance_trend[-1]["value"]
        trend_mom = curr - prev

    compliance_walks = _org_filter(
        db.query(SafetyWalk).filter(SafetyWalk.inspection_type == "Compliance"), SafetyWalk, org_id
    ).all()
    findings_critical = sum(1 for w in compliance_walks if (w.critical_issues or 0) >= 2)
    findings_major = sum(1 for w in compliance_walks if (w.critical_issues or 0) == 1)
    findings_minor = sum(1 for w in compliance_walks if (w.critical_issues or 0) == 0 and (w.issues_found or 0) >= 1)
    findings_observation = sum(1 for w in compliance_walks if (w.critical_issues or 0) == 0 and (w.issues_found or 0) == 0)
    findings_by_severity = [
        {"name": "Critical", "value": findings_critical, "color": "#5A7895"},
        {"name": "Major", "value": findings_major, "color": "#5E67A9"},
        {"name": "Minor", "value": findings_minor, "color": "#E6AF37"},
        {"name": "Observation", "value": findings_observation, "color": "#5E7399"},
    ]

    nc_rows = (
        _org_filter(
            db.query(CapaAction, Employee, Incident)
            .outerjoin(Employee, CapaAction.responsible_person_id == Employee.id)
            .outerjoin(Incident, CapaAction.incident_id == Incident.id)
            .filter(CapaAction.status != "Completed"),
            CapaAction, org_id,
        )
        .order_by(case((CapaAction.due_date.is_(None), 1), else_=0), CapaAction.due_date.asc())
        .limit(6)
        .all()
    )
    priority_to_criticality = {"Critical": "High", "High": "High", "Medium": "Medium", "Low": "Low"}
    non_conformance_rows = [
        {
            "id": f"NC-{c.id:03d}",
            "action": c.description or c.action_type or "Corrective Action",
            "owner": emp.full_name if emp else "Unassigned",
            "due": c.due_date.strftime("%b %d, %Y") if c.due_date else "No Date",
            "criticality": priority_to_criticality.get(_rca_priority(inc.severity if inc else None), "Low"),
        }
        for c, emp, inc in nc_rows
    ]

    return {
        "compliance_score": compliance_score,
        "compliance_label": compliance_label,
        "legal_register_coverage_pct": legal_register_pct,
        "legal_register_label": legal_label,
        "audit_readiness_pct": audit_readiness_pct,
        "audit_readiness_label": audit_label,
        "permit_compliance_pct": permit_compliance_pct,
        "policy_review_pct": policy_review_pct,
        "compliance_trend": compliance_trend,
        "compliance_trend_mom": trend_mom,
        "findings_by_severity": findings_by_severity,
        "non_conformance_rows": non_conformance_rows,
    }


@router.get("/asset-summary")
def get_asset_summary(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    from datetime import timedelta
    from app.models.equipment_certification import EquipmentCertification

    org_id = current_user.org_id
    today = date.today()

    # ── Equipment cert counts ─────────────────────────────────────────────────
    cert_q = db.query(EquipmentCertification)
    if org_id is not None:
        cert_q = cert_q.filter(EquipmentCertification.organisation_id == org_id)
    all_certs = cert_q.all()

    total_certs = len(all_certs)

    def _cert_status(expiry_date):
        if not expiry_date:
            return "Valid"
        if expiry_date < today:
            return "Expired"
        if expiry_date <= today + timedelta(days=30):
            return "Expiring Soon"
        return "Valid"

    for c in all_certs:
        c._status = _cert_status(c.expiry_date)

    valid_count        = sum(1 for c in all_certs if c._status == "Valid")
    expiring_count     = sum(1 for c in all_certs if c._status == "Expiring Soon")
    expired_count      = sum(1 for c in all_certs if c._status == "Expired")

    control_effectiveness = round(valid_count / total_certs * 100) if total_certs else 0
    maintenance_risk_pct  = round((expiring_count + expired_count) / total_certs * 100) if total_certs else 0
    if maintenance_risk_pct >= 60:
        risk_label = "High Risk"
    elif maintenance_risk_pct >= 25:
        risk_label = "Medium Risk"
    else:
        risk_label = "Low Risk"

    # ── Incident trend by month (asset context = all incidents) ───────────────
    inc_rows = (
        _org_filter(
            db.query(
                func.year(Incident.incident_date_time).label("yr"),
                func.month(Incident.incident_date_time).label("mo"),
                func.count(Incident.id).label("cnt"),
            ).filter(Incident.incident_date_time.isnot(None)),
            Incident, org_id,
        )
        .group_by("yr", "mo")
        .order_by("yr", "mo")
        .all()
    )
    failure_trend = [{"month": MONTH_NAMES[int(r.mo) - 1], "value": r.cnt} for r in inc_rows[-8:]]

    nm_rows = (
        _org_filter(
            db.query(
                func.year(NearMiss.event_date_time).label("yr"),
                func.month(NearMiss.event_date_time).label("mo"),
                func.count(NearMiss.id).label("cnt"),
            ).filter(NearMiss.event_date_time.isnot(None)),
            NearMiss, org_id,
        )
        .group_by("yr", "mo")
        .order_by("yr", "mo")
        .all()
    )
    asset_incident_trend = [{"month": MONTH_NAMES[int(r.mo) - 1], "value": r.cnt} for r in nm_rows[-8:]]

    # ── Risk table — certs that are expired or expiring soon ──────────────────
    risk_certs = [c for c in all_certs if c._status in ("Expired", "Expiring Soon")][:6]
    risk_table = [
        {
            "id": f"CERT-{c.id:04d}",
            "type": c.equipment_type or "Unknown",
            "risk": "High" if c._status == "Expired" else "Medium",
            "status": "Critical (Red)" if c._status == "Expired" else "Warning (Amber)",
        }
        for c in risk_certs
    ]

    # ── Overdue inspections — certs where next_inspection_date < today ────────
    overdue_certs = [
        c for c in all_certs
        if c.next_inspection_date and c.next_inspection_date < today
    ]
    overdue_certs.sort(key=lambda c: c.next_inspection_date)

    def _overdue_label(d: date) -> str:
        days = (today - d).days
        if days == 0:
            return "Due Today"
        if days == 1:
            return "Due Yesterday"
        return f"Due {days} Days Ago"

    overdue_inspections = [
        {
            "name": f"{c.equipment_name} Inspection",
            "due": _overdue_label(c.next_inspection_date),
            "tone": "critical",
        }
        for c in overdue_certs[:5]
    ]

    # ── Barrier checklist — cert types with their completion ratio ────────────
    type_counts: dict[str, dict] = {}
    for c in all_certs:
        t = c.certification_type or "General"
        if t not in type_counts:
            type_counts[t] = {"total": 0, "valid": 0}
        type_counts[t]["total"] += 1
        if c._status == "Valid":
            type_counts[t]["valid"] += 1
    barrier_checklist = [
        {
            "text": ctype,
            "progress": round(v["valid"] / v["total"] * 100) if v["total"] else 0,
        }
        for ctype, v in list(type_counts.items())[:5]
    ]

    # ── Heat map — equipment type vs site ─────────────────────────────────────
    site_ids = {c.site_id for c in all_certs if c.site_id}
    site_map: dict[int, str] = {}
    if site_ids:
        for s in db.query(Site).filter(Site.id.in_(site_ids)).all():
            site_map[s.id] = s.site_name

    types_list  = sorted({c.equipment_type or "Unknown" for c in all_certs})[:6]
    sites_list  = sorted({site_map.get(c.site_id, "Unknown") for c in all_certs})[:6]

    heat_vals: list[list[float]] = []
    for t in types_list:
        row_vals = []
        for s in sites_list:
            bucket = [
                c for c in all_certs
                if (c.equipment_type or "Unknown") == t
                and site_map.get(c.site_id, "Unknown") == s
            ]
            if not bucket:
                row_vals.append(0.1)
            else:
                expired_ratio = sum(1 for c in bucket if c._status == "Expired") / len(bucket)
                row_vals.append(round(expired_ratio + 0.1, 2))
        heat_vals.append(row_vals)

    return {
        "control_effectiveness_pct": control_effectiveness,
        "maintenance_risk_pct": maintenance_risk_pct,
        "maintenance_risk_label": risk_label,
        "total_certs": total_certs,
        "valid_count": valid_count,
        "expiring_count": expiring_count,
        "expired_count": expired_count,
        "failure_trend": failure_trend,
        "asset_incident_trend": asset_incident_trend,
        "risk_table": risk_table,
        "overdue_inspections": overdue_inspections,
        "barrier_checklist": barrier_checklist,
        "heat_rows": types_list,
        "heat_cols": sites_list,
        "heat_vals": heat_vals,
    }


@router.get("/engagement-summary")
def get_engagement_summary(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    from app.models.user import User
    from app.models.app_role import AppRole

    org_id = current_user.org_id
    today = date.today()
    first_this_month = today.replace(day=1)
    first_last_month = (first_this_month - timedelta(days=1)).replace(day=1)

    def _report_count(from_dt, to_dt):
        inc = int(
            _org_filter(
                db.query(func.count(Incident.id)).filter(
                    Incident.report_date >= from_dt, Incident.report_date < to_dt
                ),
                Incident, org_id,
            ).scalar() or 0
        )
        nm = int(
            _org_filter(
                db.query(func.count(NearMiss.id)).filter(
                    func.date(NearMiss.event_date_time) >= from_dt,
                    func.date(NearMiss.event_date_time) < to_dt,
                ),
                NearMiss, org_id,
            ).scalar() or 0
        )
        return inc + nm

    this_month_reports = _report_count(first_this_month, today + timedelta(days=1))
    last_month_reports = _report_count(first_last_month, first_this_month)

    total_employees = int(
        _org_filter(db.query(func.count(Employee.id)), Employee, org_id).scalar() or 0
    )
    # Reporting rate: reports-per-employee scaled; fallback to raw count when no employees
    if total_employees > 0:
        reporting_rate = min(100, round(this_month_reports / total_employees * 25))
    else:
        reporting_rate = min(100, this_month_reports * 10)
    reporting_rate_mom = this_month_reports - last_month_reports

    # Survey score — avg compliance_rating from safety_walks (1–5 scale)
    avg_compliance = _org_filter(
        db.query(func.avg(SafetyWalk.compliance_rating)), SafetyWalk, org_id
    ).scalar()
    survey_score = round(float(avg_compliance or 0), 1)
    survey_score_pct = round(survey_score / 5 * 100)

    avg_this_month = _org_filter(
        db.query(func.avg(SafetyWalk.compliance_rating)).filter(
            func.date(SafetyWalk.inspection_date_time) >= first_this_month
        ),
        SafetyWalk, org_id,
    ).scalar()
    avg_last_month = _org_filter(
        db.query(func.avg(SafetyWalk.compliance_rating)).filter(
            func.date(SafetyWalk.inspection_date_time) >= first_last_month,
            func.date(SafetyWalk.inspection_date_time) < first_this_month,
        ),
        SafetyWalk, org_id,
    ).scalar()
    if avg_this_month is not None and avg_last_month is not None:
        survey_score_mom = round(float(avg_this_month) - float(avg_last_month), 1)
    else:
        survey_score_mom = None

    # Safety observations % — walks with high compliance (rating >= 4)
    total_walks = int(
        _org_filter(db.query(func.count(SafetyWalk.id)), SafetyWalk, org_id).scalar() or 0
    )
    compliant_walks = int(
        _org_filter(
            db.query(func.count(SafetyWalk.id)).filter(SafetyWalk.compliance_rating >= 4),
            SafetyWalk, org_id,
        ).scalar() or 0
    )
    safety_observations_pct = round(compliant_walks / max(total_walks, 1) * 100)

    # Safety walks % — walks completed this month vs one-per-employee target.
    # Fall back to all-time walks when no walks exist this month
    # (imported historical data often has past dates).
    walks_this_month = int(
        _org_filter(
            db.query(func.count(SafetyWalk.id)).filter(
                func.date(SafetyWalk.inspection_date_time) >= first_this_month
            ),
            SafetyWalk, org_id,
        ).scalar() or 0
    )
    effective_walks = walks_this_month if walks_this_month > 0 else total_walks
    safety_walks_pct = min(100, round(effective_walks / max(total_employees, 1) * 100))

    # Toolbox attendance % — toolbox-type walks vs employee count
    # Fall back to all walk types when no "toolbox" entries exist
    toolbox_count = int(
        _org_filter(
            db.query(func.count(SafetyWalk.id)).filter(
                func.lower(SafetyWalk.inspection_type).like("%toolbox%")
            ),
            SafetyWalk, org_id,
        ).scalar() or 0
    )
    if toolbox_count == 0:
        toolbox_count = total_walks
    toolbox_pct = min(100, round(toolbox_count / max(total_employees, 1) * 100))

    # Site participation % — distinct sites with incidents or near_misses vs total sites
    total_sites = int(
        _org_filter(db.query(func.count(Site.id)), Site, org_id).scalar() or 0
    )
    active_sites_inc = int(
        db.query(func.count(func.distinct(WorkingStation.site_id)))
        .join(Incident, Incident.location_station_id == WorkingStation.id)
        .filter(*(
            [Incident.organisation_id == org_id]
            if org_id is not None else []
        ))
        .scalar() or 0
    )
    active_sites_nm = int(
        db.query(func.count(func.distinct(WorkingStation.site_id)))
        .join(NearMiss, NearMiss.location_station_id == WorkingStation.id)
        .filter(*(
            [NearMiss.organisation_id == org_id]
            if org_id is not None else []
        ))
        .scalar() or 0
    )
    active_sites = min(max(active_sites_inc, active_sites_nm), total_sites)
    site_participation_pct = round(active_sites / max(total_sites, 1) * 100)

    # Top recognitions — employees with most completed CAPA actions
    top_emp_rows = (
        db.query(Employee.full_name, func.count(CapaAction.id).label("cnt"))
        .join(CapaAction, CapaAction.responsible_person_id == Employee.id)
        .filter(
            CapaAction.status == "Completed",
            *(
                [Employee.organisation_id == org_id]
                if org_id is not None else []
            ),
        )
        .group_by(Employee.full_name)
        .order_by(func.count(CapaAction.id).desc())
        .limit(3)
        .all()
    )
    top_recognitions = [{"name": r.full_name} for r in top_emp_rows if r.full_name]

    # Fallback: use org users when employees table is empty
    if not top_recognitions:
        user_rows = (
            db.query(User, AppRole)
            .outerjoin(AppRole, User.app_role_id == AppRole.id)
            .filter(
                User.organisation_id == org_id,
                AppRole.name.notin_(["superadmin", "admin"]),
            )
            if org_id is not None
            else db.query(User, AppRole)
            .outerjoin(AppRole, User.app_role_id == AppRole.id)
            .filter(AppRole.name.notin_(["superadmin", "admin"]))
        )
        top_recognitions = [
            {"name": u.full_name or u.username}
            for u, _ in user_rows.order_by(User.id.asc()).limit(3).all()
        ]

    # Open actions — CAPA not completed, ordered by due date
    def _action_status(due_date) -> str:
        if not due_date:
            return "Overdue"
        days = (due_date - today).days
        if days < 0:
            return "Overdue"
        if days == 0:
            return "Due Today"
        return "Due Tomorrow"

    open_capa_rows = (
        _org_filter(
            db.query(CapaAction).filter(CapaAction.status != "Completed"),
            CapaAction, org_id,
        )
        .order_by(
            case((CapaAction.due_date.is_(None), 1), else_=0),
            CapaAction.due_date.asc(),
        )
        .limit(5)
        .all()
    )
    open_actions = [
        {
            "text": c.description or c.action_type or f"CAPA Action #{c.id}",
            "status": _action_status(c.due_date),
        }
        for c in open_capa_rows
    ]

    return {
        "reporting_rate": reporting_rate,
        "reporting_rate_mom": reporting_rate_mom,
        "survey_score": survey_score,
        "survey_score_pct": survey_score_pct,
        "survey_score_mom": survey_score_mom,
        "safety_observations_pct": safety_observations_pct,
        "safety_walks_pct": safety_walks_pct,
        "toolbox_attendance_pct": toolbox_pct,
        "site_participation_pct": site_participation_pct,
        "top_recognitions": top_recognitions,
        "open_actions": open_actions,
    }


@router.get("/violation-detail/{incident_id}")
def get_violation_detail(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    org_id = current_user.org_id

    row = (
        db.query(Incident, WorkingStation, Site, Employee)
        .outerjoin(WorkingStation, Incident.location_station_id == WorkingStation.id)
        .outerjoin(Site, WorkingStation.site_id == Site.id)
        .outerjoin(Employee, Incident.reported_by == Employee.id)
        .filter(Incident.id == incident_id)
        .filter(*([Incident.organisation_id == org_id] if org_id is not None else []))
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Incident not found")

    inc, ws, site, reporter = row

    capa_rows = (
        db.query(CapaAction, Employee)
        .outerjoin(Employee, CapaAction.responsible_person_id == Employee.id)
        .filter(CapaAction.incident_id == inc.id)
        .order_by(CapaAction.due_date.asc())
        .all()
    )

    capa_list = [
        {
            "id": f"CAPA-{c.id:03d}",
            "action_type": c.action_type or "Corrective Action",
            "description": c.description or "",
            "responsible_person": emp.full_name if emp else "Unassigned",
            "due_date": c.due_date.strftime("%b %d, %Y") if c.due_date else None,
            "status": c.status or "Pending",
        }
        for c, emp in capa_rows
    ]

    def _status_step(s: str) -> int:
        sl = (s or "").lower()
        if "complete" in sl or "closed" in sl:
            return 4
        if "progress" in sl:
            return 3
        if "acknowledge" in sl:
            return 2
        if "assign" in sl:
            return 1
        return 0

    def _map_severity(sev: str) -> str:
        s = (sev or "").lower()
        if "fatal" in s or "critical" in s or "catastrophic" in s or "significant" in s:
            return "Critical"
        if "major" in s or "lost time" in s or "high" in s or "serious" in s:
            return "High"
        if "moderate" in s or "medium" in s:
            return "Medium"
        return "Low"

    def _fmt_dt(dt_val) -> str:
        if dt_val is None:
            return "Unknown"
        if hasattr(dt_val, "hour"):
            return dt_val.strftime("%b %d, %Y %I:%M %p")
        return dt_val.strftime("%b %d, %Y")

    timeline = []
    if inc.incident_date_time or inc.report_date:
        timeline.append({
            "action": "Incident Reported",
            "user": reporter.full_name if reporter else "System",
            "time": _fmt_dt(inc.incident_date_time or inc.report_date),
            "type": "reported",
        })
    for c, emp in capa_rows:
        timeline.append({
            "action": f"CAPA: {c.action_type or 'Corrective Action'}",
            "user": emp.full_name if emp else "Unassigned",
            "time": c.due_date.strftime("%b %d, %Y") if c.due_date else "No date",
            "type": "capa",
        })
    inv_status = inc.investigation_status or "Pending"
    if ("complete" in inv_status.lower() or "closed" in inv_status.lower()) and timeline:
        timeline.append({
            "action": "Investigation Closed",
            "user": "System",
            "time": _fmt_dt(inc.incident_date_time or inc.report_date),
            "type": "closed",
        })

    assignee = None
    if capa_rows:
        _, first_emp = capa_rows[0]
        if first_emp:
            assignee = {"name": first_emp.full_name, "role": "Responsible Person"}

    first_due = (
        capa_rows[0][0].due_date.strftime("%Y-%m-%d")
        if capa_rows and capa_rows[0][0].due_date
        else None
    )

    return {
        "id": f"INC-{inc.id:05d}",
        "incident_type": inc.incident_type or "Unknown",
        "severity": _map_severity(inc.severity or ""),
        "raw_severity": inc.severity or "Unknown",
        "investigation_status": inv_status,
        "status_step": _status_step(inv_status),
        "incident_datetime": _fmt_dt(inc.incident_date_time or inc.report_date),
        "description": inc.description or "",
        "immediate_cause": inc.immediate_cause or "—",
        "root_cause": inc.root_cause or inc.root_cause_category or "Under investigation",
        "zone": ws.zone_classification if ws else "—",
        "station": ws.station_name if ws else "—",
        "site": site.site_name if site else "—",
        "reporter": reporter.full_name if reporter else "Unknown",
        "permit_active": inc.permit_active or "No",
        "days_away": inc.days_away or 0,
        "number_persons_involved": inc.number_persons_involved or 0,
        "control_failure": inc.control_failure or "No",
        "capa_actions": capa_list,
        "timeline": timeline,
        "assignee": assignee,
        "due_date": first_due,
    }
