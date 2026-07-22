from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, func
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
from app.models.safety_walk import SafetyWalk
from app.models.site import Site
from app.models.shift_schedule import ShiftSchedule
from app.models.working_station import WorkingStation
from app.services.contractor_risk import compute_contractor_risk

from app.utils.logger import get_logger
logger = get_logger(__name__)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _org_filter(query, model, org_id):
    """Filter by org_id only. NULL organisation rows are not tenant data."""
    if org_id is not None:
        return query.filter(model.organisation_id == org_id)
    return query


def _date_filter(query, date_column, start_date: Optional[date], end_date: Optional[date]):
    """Apply optional start_date / end_date filter on a date or datetime column."""
    if start_date:
        query = query.filter(func.date(date_column) >= start_date)
    if end_date:
        query = query.filter(func.date(date_column) <= end_date)
    return query


def _latest_org_date(db: Session, model, date_column, org_id):
    latest_value = _org_filter(db.query(func.max(date_column)), model, org_id).scalar()
    return latest_value.date() if latest_value else None


def _safe_round(value, digits=2):
    return round(float(value), digits) if value is not None else 0.0


@router.get("/stats")
def get_dashboard_stats(
    start_date: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    today = date.today()
    org_id = current_user.org_id

    def inc_q():
        return _date_filter(_org_filter(db.query(Incident), Incident, org_id), Incident.incident_date_time, start_date, end_date)

    def nm_q():
        return _date_filter(_org_filter(db.query(NearMiss), NearMiss, org_id), NearMiss.event_date_time, start_date, end_date)

    def sw_q():
        return _date_filter(_org_filter(db.query(SafetyWalk), SafetyWalk, org_id), SafetyWalk.inspection_date_time, start_date, end_date)

    def capa_q():
        return _date_filter(_org_filter(db.query(CapaAction), CapaAction, org_id), CapaAction.due_date, start_date, end_date)

    total_incidents = inc_q().count()
    open_capa_actions = _org_filter(db.query(CapaAction), CapaAction, org_id).filter(CapaAction.status != "Completed").count()
    overdue_capa = _org_filter(db.query(CapaAction), CapaAction, org_id).filter(
        CapaAction.status != "Completed",
        CapaAction.due_date < today,
        CapaAction.due_date.isnot(None),
    ).count()
    active_permits = _org_filter(db.query(PermitToWork), PermitToWork, org_id).filter(PermitToWork.status == "Active").count()
    total_employees = _org_filter(db.query(Employee), Employee, org_id).count()
    total_sites = _org_filter(db.query(Site), Site, org_id).count()
    near_misses_count = nm_q().count()
    safety_walks_count = sw_q().count()

    avg_compliance = sw_q().with_entities(func.avg(SafetyWalk.compliance_rating)).scalar()
    avg_housekeeping = sw_q().with_entities(func.avg(SafetyWalk.housekeeping_rating)).scalar()

    # "Critical" is not an actual severity value in this schema (real values are
    # Fatal/Serious/Significant/Minor/Moderate/Lost Time) — count the genuinely
    # severe tiers instead of a label that never matches.
    critical_incidents = inc_q().filter(
        func.lower(Incident.severity).in_(["fatal", "serious", "significant"])
    ).count()

    # capa_completion_rate is org-wide (not date filtered) — it's a point-in-time health metric
    capa_completed = _org_filter(db.query(CapaAction), CapaAction, org_id).filter(CapaAction.status == "Completed").count()
    capa_total = _org_filter(db.query(CapaAction), CapaAction, org_id).count()
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


@router.get("/leading-indicators")
def get_leading_indicators(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Predictive/leading safety KPIs derived from incidents, employees and safety_walks.

    These are best-effort approximations (documented inline) since the schema does not
    track actual hours-worked or formal audit records. They move with real data but are
    not certified OSHA-audited figures.
    """
    org_id = current_user.org_id

    total_employees = _org_filter(db.query(Employee), Employee, org_id).count() or 0
    man_hours = (
        _org_filter(db.query(func.coalesce(func.sum(ShiftSchedule.actual_hours_worked), 0.0)), ShiftSchedule, org_id).scalar()
        or 0.0
    )

    # ── Anchor dates on actual data, not today ───────────────────────────────
    # Using today as anchor makes all 90-day windows empty when historical data
    # is from a past year. Anchor on the latest incident/walk date instead.
    latest_incident_dt = _org_filter(
        db.query(func.max(Incident.incident_date_time)), Incident, org_id
    ).scalar()
    latest_walk_dt = _org_filter(
        db.query(func.max(SafetyWalk.inspection_date_time)), SafetyWalk, org_id
    ).scalar()

    # If user passed explicit date window, respect it; otherwise anchor on data
    if start_date or end_date:
        data_window_end = end_date or date.today()
        data_window_start = start_date or None
    else:
        data_window_end = latest_incident_dt.date() if latest_incident_dt else date.today()
        data_window_start = None

    latest_date = data_window_end

    # Workbook formulas are based on the full supplied dataset, not a rolling window.
    inc_base = _org_filter(db.query(Incident), Incident, org_id)
    if data_window_start:
        inc_base = inc_base.filter(func.date(Incident.incident_date_time) >= data_window_start)
    if data_window_end:
        inc_base = inc_base.filter(func.date(Incident.incident_date_time) <= data_window_end)

    recordable_incidents = inc_base.filter(
        func.lower(func.coalesce(Incident.incident_type, "")).in_(["injury"]),
    ).count()
    lost_time_incidents = inc_base.filter(
        func.lower(func.coalesce(Incident.incident_type, "")).in_(["injury"]),
        func.lower(func.coalesce(Incident.severity, "")).in_(["lost time"]),
    ).count()
    lost_days = inc_base.with_entities(
        func.coalesce(func.sum(func.coalesce(Incident.days_away, 0)), 0)
    ).filter(
        func.lower(func.coalesce(Incident.incident_type, "")).in_(["injury"]),
        func.lower(func.coalesce(Incident.severity, "")).in_(["lost time"]),
    ).scalar() or 0
    fatalities = inc_base.filter(
        func.lower(func.coalesce(Incident.severity, "")).in_(["fatal"]),
    ).count()
    near_miss_count = _date_filter(
        _org_filter(db.query(NearMiss), NearMiss, org_id),
        NearMiss.event_date_time, data_window_start, data_window_end
    ).count()
    total_investigations = inc_base.count()
    completed_investigations = inc_base.filter(
        func.lower(func.coalesce(Incident.investigation_status, "")).in_(["completed"]),
    ).count()

    trir = _safe_round((recordable_incidents * 200_000) / man_hours) if man_hours else 0.0
    ltifr = _safe_round((lost_time_incidents * 1_000_000) / man_hours) if man_hours else 0.0
    ltisr = _safe_round((float(lost_days) * 1_000_000) / man_hours) if man_hours else 0.0
    dart_rate = _safe_round((lost_time_incidents * 200_000) / man_hours) if man_hours else 0.0
    far = _safe_round((fatalities * 100_000_000) / man_hours) if man_hours else 0.0
    near_miss_ratio = f"{_safe_round(near_miss_count / recordable_incidents, 1)} : 1" if recordable_incidents else "0 : 1"
    latest_lti_date = _org_filter(db.query(func.max(Incident.incident_date_time)), Incident, org_id).filter(
        func.lower(func.coalesce(Incident.incident_type, "")).in_(["injury"]),
        func.lower(func.coalesce(Incident.severity, "")).in_(["lost time"]),
    ).scalar()
    safe_days = int((data_window_end - latest_lti_date.date()).days) if latest_lti_date else 0
    dangerous_occurrence_rate = _org_filter(db.query(Incident), Incident, org_id).filter(
        func.lower(func.coalesce(Incident.incident_type, "")).in_(["dangerous occurrence"]),
    ).count()
    incident_close_out_rate = _safe_round((completed_investigations / total_investigations) * 100) if total_investigations else 0.0

    # ── Predictive Injury Risk Score ────────────────────────────────────────
    # Weighted by actual severity values in this schema (Fatal/Serious/Significant/
    # Lost Time/Moderate/Minor) — the previous "critical"/"high"/"major" labels don't
    # exist in the data, so Fatal and Serious incidents were silently falling into the
    # lowest-weight bucket instead of the highest. Max weight stays 3 to match the
    # existing (count * 3) normalization below.
    severity_weight = case(
        (func.lower(Incident.severity) == "fatal", 3),
        (func.lower(Incident.severity) == "serious", 2.5),
        (func.lower(Incident.severity) == "significant", 2),
        (func.lower(Incident.severity) == "lost time", 1.5),
        (func.lower(Incident.severity) == "moderate", 1),
        else_=0.5,
    )

    def weighted_risk_score(start_date, end_date) -> float:
        row = (
            _org_filter(
                db.query(
                    func.count(Incident.id).label("count"),
                    func.coalesce(func.sum(severity_weight), 0).label("weight_sum"),
                ),
                Incident,
                org_id,
            )
            .filter(Incident.incident_date_time.isnot(None))
            .filter(func.date(Incident.incident_date_time) >= start_date)
            .filter(func.date(Incident.incident_date_time) < end_date)
            .first()
        )
        count = int(row.count or 0)
        weight_sum = float(row.weight_sum or 0)
        if not count:
            return 0.0
        return min(100.0, (weight_sum / (count * 3)) * 100)

    current_start = latest_date - timedelta(days=90)
    previous_start = latest_date - timedelta(days=180)
    current_score = weighted_risk_score(current_start, latest_date)
    previous_score = weighted_risk_score(previous_start, current_start)
    injury_risk_score = _safe_round(current_score)
    injury_risk_trend = _safe_round(current_score - previous_score)

    # ── Contractor Risk Score — single shared implementation, see app/services/contractor_risk.py
    permanent_employees = _org_filter(db.query(Employee), Employee, org_id).filter(
        func.lower(Employee.employment_type) == "permanent"
    ).count()
    permanent_incidents = (
        _org_filter(
            db.query(func.count(Incident.id)),
            Incident,
            org_id,
        )
        .join(Employee, Incident.reported_by == Employee.id)
        .filter(func.lower(Employee.employment_type) == "permanent")
        .scalar()
        or 0
    )

    contractor_risk = compute_contractor_risk(db, org_id)
    contractor_employees = contractor_risk.contractor_employees
    contractor_incidents = contractor_risk.contractor_incidents
    contractor_rate = _safe_round(contractor_incidents / contractor_employees) if contractor_employees else 0.0
    permanent_rate = _safe_round(permanent_incidents / permanent_employees) if permanent_employees else 0.0

    contractor_risk_score_10 = contractor_risk.score_10
    contractor_risk_score = contractor_risk.score_pct
    contractor_risk_label = contractor_risk.label
    relative_risk = contractor_risk.relative_risk
    logger.info("CONTRACTOR_RISK: score_10=%s score_pct=%s label=%s violations=%s has_contractors=%s",
                contractor_risk_score_10, contractor_risk_score, contractor_risk_label,
                contractor_risk.contractor_violations, contractor_risk.has_contractors)

    # ── Audit Readiness Score ───────────────────────────────────────────────
    # Anchor on latest walk date so historical data is not missed
    latest_walk_anchor = latest_walk_dt.date() if latest_walk_dt else data_window_end
    if data_window_start:
        walk_window_start = data_window_start
        walk_window_end = data_window_end
    else:
        walk_window_end = latest_walk_anchor
        walk_window_start = latest_walk_anchor - timedelta(days=90)

    avg_compliance_walk = (
        _org_filter(db.query(func.avg(SafetyWalk.compliance_rating)), SafetyWalk, org_id)
        .filter(SafetyWalk.inspection_date_time.isnot(None))
        .filter(func.date(SafetyWalk.inspection_date_time) >= walk_window_start)
        .filter(func.date(SafetyWalk.inspection_date_time) <= walk_window_end)
        .scalar()
    )
    average_compliance = _safe_round(avg_compliance_walk)
    audit_readiness_score = _safe_round((average_compliance / 5) * 100) if average_compliance else 0.0
    audit_readiness_label = "Ready" if audit_readiness_score >= 80 else ("Needs Attention" if audit_readiness_score >= 60 else "Not Ready")

    return {
        "predictive_injury_risk_score": injury_risk_score,
        "predictive_injury_risk_previous_score": _safe_round(previous_score),
        "predictive_injury_risk_trend": injury_risk_trend,
        "trir": trir,
        "ltifr": ltifr,
        "ltisr": ltisr,
        "dart_rate": dart_rate,
        "far": far,
        "near_miss_ratio": near_miss_ratio,
        "safe_days": safe_days,
        "dangerous_occurrence_rate": dangerous_occurrence_rate,
        "incident_close_out_rate": incident_close_out_rate,
        "ltif": ltifr,
        "contractor_risk_label": contractor_risk_label,
        "contractor_rate": contractor_rate,
        "permanent_rate": permanent_rate,
        "relative_risk": relative_risk,
        "contractor_risk_score": contractor_risk_score,
        "contractor_risk_score_10": contractor_risk_score_10,
        "contractor_has_contractors": contractor_risk.has_contractors,
        "audit_readiness_score": audit_readiness_score,
        "average_compliance": average_compliance,
        "audit_readiness_label": audit_readiness_label,
    }


@router.get("/contractor-debug")
def get_contractor_debug(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Debug endpoint to verify contractor risk score calculation."""
    org_id = current_user.org_id
    r = compute_contractor_risk(db, org_id)
    return {
        "has_contractors": r.has_contractors,
        "contractor_employees": r.contractor_employees,
        "total_employees": r.total_employees,
        "contractor_incidents": r.contractor_incidents,
        "total_org_incidents": r.total_org_incidents,
        "contractor_violations": r.contractor_violations,
        "relative_risk": r.relative_risk,
        "incident_penalty": r.incident_penalty,
        "violation_penalty": r.violation_penalty,
        "score_10": r.score_10,
        "score_pct": r.score_pct,
        "label": r.label,
    }


@router.get("/capa-actions")
def get_ranked_capa_actions(
    limit: int = 10,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    today = date.today()
    org_id = current_user.org_id
    q = _org_filter(db.query(CapaAction, Employee), CapaAction, org_id)\
        .outerjoin(Employee, CapaAction.responsible_person_id == Employee.id)\
        .filter(CapaAction.status != "Completed")
    if start_date:
        q = q.filter(func.date(CapaAction.due_date) >= start_date)
    if end_date:
        q = q.filter(func.date(CapaAction.due_date) <= end_date)
    rows = q.order_by(case((CapaAction.due_date.is_(None), 1), else_=0), CapaAction.due_date.asc()).limit(limit).all()
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
def get_overdue_capa(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    today = date.today()
    org_id = current_user.org_id
    rows = (
        _org_filter(db.query(CapaAction), CapaAction, org_id)
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
def get_incidents_by_category(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    org_id = current_user.org_id
    inc_q = db.query(
            HazardCategory.category_name,
            func.count(Incident.id).label("count"),
        ).outerjoin(Hazard, Hazard.category_id == HazardCategory.id)\
         .outerjoin(Incident, Incident.hazard_id == Hazard.id)\
         .filter(Incident.organisation_id == org_id if org_id is not None else True)
    if start_date:
        inc_q = inc_q.filter(func.date(Incident.incident_date_time) >= start_date)
    if end_date:
        inc_q = inc_q.filter(func.date(Incident.incident_date_time) <= end_date)
    rows = inc_q.group_by(HazardCategory.category_name)\
                .order_by(func.count(Incident.id).desc())\
                .limit(8).all()
    return [{"name": r.category_name, "data": r.count, "intelligence": max(0, r.count - 5)} for r in rows]


@router.get("/incidents-by-severity")
def get_incidents_by_severity(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    org_id = current_user.org_id
    rows = (
        _org_filter(db.query(Incident.severity, func.count(Incident.id).label("count")), Incident, org_id)
        .filter(Incident.severity.isnot(None))
        .group_by(Incident.severity)
        .all()
    )
    return [{"severity": r.severity, "count": r.count} for r in rows]


@router.get("/compliance-trend")
def get_compliance_trend(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    org_id = current_user.org_id
    latest_walk_dt = _org_filter(db.query(func.max(SafetyWalk.inspection_date_time)), SafetyWalk, org_id).scalar()
    anchor = latest_walk_dt.date() if latest_walk_dt else date.today()
    cutoff = anchor - timedelta(days=days)
    rows = (
        _org_filter(
            db.query(
                func.date(SafetyWalk.inspection_date_time).label("day"),
                func.avg(SafetyWalk.compliance_rating).label("avg_score"),
            ),
            SafetyWalk,
            org_id,
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
def get_safety_walks_recent(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    org_id = current_user.org_id
    rows = (
        _org_filter(db.query(SafetyWalk, WorkingStation, Employee), SafetyWalk, org_id)
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
def get_near_misses_recent(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    org_id = current_user.org_id
    rows = (
        _org_filter(db.query(NearMiss, WorkingStation, Employee), NearMiss, org_id)
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
def get_active_permits(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    org_id = current_user.org_id
    rows = (
        _org_filter(db.query(PermitToWork, PermitType, WorkingStation), PermitToWork, org_id)
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
