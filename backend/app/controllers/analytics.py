from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy import case, func, or_
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.capa_action import CapaAction
from app.models.employee import Employee
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
        .order_by(case((CapaAction.due_date.is_(None), 1), else_=0), CapaAction.due_date.asc())
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
        # Reuse the same severity->priority mapping as root-cause-analysis
        # (this dataset's real severities are Lost Time/Minor/Serious/
        # Significant — the old ad-hoc keyword match here mis-bucketed most
        # of them, e.g. "Significant" landed in "high" not "critical").
        bucket = _rca_priority(r.sev).lower()
        months_map[key][bucket] += r.cnt
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
        .filter(Incident.permit_active == "Yes")
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
        .order_by(case((PermitToWork.validity_end.is_(None), 1), else_=0), PermitToWork.validity_end.asc())
        .limit(10)
        .all()
    )

    # A relative "time remaining" countdown can't be made honest here: this is
    # historical bulk test data where `status` isn't actually derived from
    # validity_start/validity_end (only 2 of 828 "Active" permits are within
    # their own validity window at any single point in time), so there's no
    # real "now" to count down from. Show the real validity_end date instead.
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

    # Work exposure hours: total person-hours of currently active permitted work.
    work_exposure_hours = int(
        db.query(func.sum(PermitToWork.duration_requested_hours * PermitToWork.number_of_workers))
        .filter(PermitToWork.status == "Active")
        .scalar() or 0
    )

    # Permit compliance %: permits with no reported deviation and no resulting incident.
    total_permits = db.query(PermitToWork).count()
    compliant_permits = db.query(PermitToWork).filter(
        PermitToWork.deviation_reported != "Yes", PermitToWork.incident_occurred != "Yes"
    ).count()
    permit_compliance_pct = round(compliant_permits / total_permits * 100, 1) if total_permits else 0

    # Contractor compliance: permits issued or approved by a contractor
    # employee, split into compliant / non-compliant (no real "pending"
    # state exists for permits, so that bucket stays 0).
    is_contractor = func.lower(Employee.employment_type).like("%contract%")
    contractor_employee_ids = [e.id for e in db.query(Employee).filter(is_contractor).all()]
    contractor_permit_filter = or_(
        PermitToWork.issued_by.in_(contractor_employee_ids),
        PermitToWork.approved_by.in_(contractor_employee_ids),
    ) if contractor_employee_ids else None
    if contractor_permit_filter is not None:
        contractor_total = db.query(PermitToWork).filter(contractor_permit_filter).count()
        contractor_compliant = db.query(PermitToWork).filter(
            contractor_permit_filter,
            PermitToWork.deviation_reported != "Yes",
            PermitToWork.incident_occurred != "Yes",
        ).count()
    else:
        contractor_total = contractor_compliant = 0
    contractor_compliant_pct = round(contractor_compliant / contractor_total * 100) if contractor_total else 0
    contractor_non_compliant_pct = 100 - contractor_compliant_pct if contractor_total else 0

    # Missing work controls: real active permits with a reported deviation,
    # soonest-expiring first (best real proxy — there's no dedicated
    # "controls checklist" table in this schema).
    deviation_rows = (
        db.query(PermitToWork, PermitType)
        .outerjoin(PermitType, PermitToWork.permit_type_id == PermitType.id)
        .filter(PermitToWork.status == "Active", PermitToWork.deviation_reported == "Yes")
        .order_by(case((PermitToWork.validity_end.is_(None), 1), else_=0), PermitToWork.validity_end.asc())
        .limit(4)
        .all()
    )
    missing_controls = [
        f"{ptw.work_description or (pt.permit_type_name if pt else 'Work')} — Deviation Reported (PTW-{ptw.id:04d})"
        for ptw, pt in deviation_rows
    ]

    # Work by permit type, stacked by lifecycle status (% of that type's
    # permits in each status) — real substitute for a "by contractor"
    # breakdown, since no contractor entity exists in this schema.
    type_status_rows = (
        db.query(PermitType.permit_type_name, PermitToWork.status, func.count(PermitToWork.id))
        .join(PermitToWork, PermitToWork.permit_type_id == PermitType.id)
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
):
    rows = (
        db.query(Incident, WorkingStation, Site, Employee)
        .outerjoin(WorkingStation, Incident.location_station_id == WorkingStation.id)
        .outerjoin(Site, WorkingStation.site_id == Site.id)
        .outerjoin(Employee, Incident.reported_by == Employee.id)
        .order_by(Incident.id.desc())
        .limit(limit)
        .all()
    )

    incident_ids = [inc.id for inc, _, _, _ in rows]
    capa_rows = (
        db.query(CapaAction).filter(CapaAction.incident_id.in_(incident_ids)).all()
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
            # Prefer a CAPA explicitly marked Completed; fall back to the
            # latest due_date among any CAPA tied to this incident (still
            # real data) rather than leaving it blank.
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
def get_compliance_summary(db: Session = Depends(get_db)):
    # Permit compliance: same real formula used on the Actions/Work page —
    # permits with no reported deviation and no resulting incident.
    total_permits = db.query(PermitToWork).count()
    compliant_permits = db.query(PermitToWork).filter(
        PermitToWork.deviation_reported != "Yes", PermitToWork.incident_occurred != "Yes"
    ).count()
    permit_compliance_pct = round(compliant_permits / total_permits * 100) if total_permits else 0

    # Policy review status: % of policies currently marked 'Current'.
    total_policies = db.query(Policy).count()
    current_policies = db.query(Policy).filter(Policy.status == "Current").count()
    policy_review_pct = round(current_policies / total_policies * 100) if total_policies else 0

    # Legal register coverage: distinct policy categories vs. distinct hazard
    # categories — how much of the real hazard landscape has a policy
    # category covering it (capped at 100%; there's no exact 1:1 naming
    # match between the two registers, so this is a coverage *breadth* proxy).
    distinct_policy_categories = db.query(func.count(func.distinct(Policy.category))).scalar() or 0
    distinct_hazard_categories = db.query(func.count(func.distinct(HazardCategory.category_name))).scalar() or 0
    legal_register_pct = (
        min(100, round(distinct_policy_categories / distinct_hazard_categories * 100))
        if distinct_hazard_categories else 0
    )

    # Audit readiness: all-time avg safety_walk compliance_rating (1-5) as %.
    # Deliberately all-time (not a trailing window) — this is historical test
    # data and any "trailing N days from today" window would read zero.
    avg_compliance = db.query(func.avg(SafetyWalk.compliance_rating)).scalar()
    audit_readiness_pct = round(float(avg_compliance) / 5 * 100) if avg_compliance else 0

    compliance_score = round((permit_compliance_pct + legal_register_pct + audit_readiness_pct) / 3)
    compliance_label = "Excellent" if compliance_score >= 85 else ("Good" if compliance_score >= 70 else "Needs Improvement")
    legal_label = "High" if legal_register_pct >= 85 else ("Medium" if legal_register_pct >= 60 else "Low")
    audit_label = "Ready" if audit_readiness_pct >= 80 else ("Needs Attention" if audit_readiness_pct >= 60 else "Not Ready")

    # Compliance trend: monthly avg compliance_rating (as %) over the last 10
    # months of *actual* safety_walk data, anchored to the data's own latest
    # date rather than today.
    latest_walk_date = db.query(func.max(SafetyWalk.inspection_date_time)).scalar()
    trend_rows = (
        db.query(
            func.year(SafetyWalk.inspection_date_time).label("yr"),
            func.month(SafetyWalk.inspection_date_time).label("mo"),
            func.avg(SafetyWalk.compliance_rating).label("avg_rating"),
        )
        .filter(SafetyWalk.inspection_date_time.isnot(None))
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

    # Audit findings by severity: real 'Compliance'-type safety_walks,
    # bucketed by their own critical_issues / issues_found counts.
    compliance_walks = db.query(SafetyWalk).filter(SafetyWalk.inspection_type == "Compliance").all()
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

    # Non-conformance: real open CAPA actions, criticality from the related
    # incident's severity (collapsed to the table's High/Medium/Low scheme).
    nc_rows = (
        db.query(CapaAction, Employee, Incident)
        .outerjoin(Employee, CapaAction.responsible_person_id == Employee.id)
        .outerjoin(Incident, CapaAction.incident_id == Incident.id)
        .filter(CapaAction.status != "Completed")
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
