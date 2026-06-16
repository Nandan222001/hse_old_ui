from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import case, func, or_
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.capa_action import CapaAction
from app.models.department import Department
from app.models.employee import Employee
from app.models.incident import Incident
from app.models.near_miss import NearMiss
from app.models.role import Role
from app.models.safety_walk import SafetyWalk
from app.models.shift_schedule import ShiftSchedule
from app.models.site import Site
from app.models.training_program import TrainingProgram

router = APIRouter(prefix="/people", tags=["People"])

MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def _month_start(d: date) -> date:
    return d.replace(day=1)


def _add_months(d: date, months: int) -> date:
    month_index = d.month - 1 + months
    year = d.year + month_index // 12
    month = month_index % 12 + 1
    return date(year, month, 1)


def _fmt_due(due_date) -> str:
    return due_date.strftime("%b %d, %Y") if due_date else "No Date"


def _add_months_preserve_day(d: date, months: int) -> date:
    """Advance d by `months`, clamping the day for shorter target months."""
    month_index = d.month - 1 + months
    year = d.year + month_index // 12
    month = month_index % 12 + 1
    day = d.day
    while True:
        try:
            return date(year, month, day)
        except ValueError:
            day -= 1  # roll back for months with fewer days (e.g. Feb 30 -> 28)


@router.get("/overview")
def get_people_overview(db: Session = Depends(get_db)):
    today = date.today()
    total_employees = db.query(Employee).count() or 0

    # ── Competency Coverage % ───────────────────────────────────────────────
    # Employees are not flagged as "competency gaps" unless a real incident or
    # CAPA finding documents a training-related root cause against them.
    # (employees.induction_date is unpopulated in this dataset, so it can't be
    # used as the coverage signal.)
    training_incident_rows = (
        db.query(Incident.reported_by, Incident.incident_date_time)
        .filter(
            Incident.reported_by.isnot(None),
            or_(
                func.lower(Incident.root_cause).like("%train%"),
                func.lower(Incident.root_cause_category).like("%train%"),
            ),
        )
        .all()
    )
    training_capa_employee_ids = {
        row[0]
        for row in db.query(CapaAction.responsible_person_id)
        .filter(
            CapaAction.responsible_person_id.isnot(None),
            func.lower(CapaAction.root_cause_addressed).like("%train%"),
        )
        .all()
    }
    flagged_now = training_capa_employee_ids | {r[0] for r in training_incident_rows}
    competency_pct = round((total_employees - len(flagged_now)) / total_employees * 100) if total_employees else 0

    # 10-point trailing-month sparkline of the same coverage metric, growing the
    # flagged set only as each real incident's date is reached.
    sparkline = []
    window_start = _add_months(today, -9)
    for i in range(10):
        checkpoint = _add_months(window_start, i + 1)
        flagged_by_then = set(training_capa_employee_ids)
        for emp_id, dt in training_incident_rows:
            if dt and dt.date() < checkpoint:
                flagged_by_then.add(emp_id)
        pct = round((total_employees - len(flagged_by_then)) / total_employees * 100) if total_employees else 0
        sparkline.append(pct)

    competency_tone = "green" if competency_pct >= 80 else ("amber" if competency_pct >= 60 else "red")
    competency_subtitle = "Excellent" if competency_pct >= 80 else ("Good" if competency_pct >= 60 else "Needs Improvement")

    # ── Worker Exposure Index ───────────────────────────────────────────────
    # Recent (90-day) incident + near-miss volume relative to headcount.
    # Anchored to the latest *actual* incident/near-miss date in the data, not
    # the real-world "today" — this is historical test data (ends 2025), so a
    # window anchored to the real calendar date would always read zero.
    latest_incident_date = db.query(func.max(Incident.incident_date_time)).scalar()
    latest_near_miss_date = db.query(func.max(NearMiss.event_date_time)).scalar()
    candidates = [d for d in (latest_incident_date, latest_near_miss_date) if d]
    activity_anchor = max(candidates) if candidates else datetime.combine(today, datetime.min.time())
    cutoff_90 = activity_anchor - timedelta(days=90)
    recent_incidents = db.query(Incident).filter(
        Incident.incident_date_time.isnot(None), Incident.incident_date_time >= cutoff_90
    ).count()
    recent_near_misses = db.query(NearMiss).filter(
        NearMiss.event_date_time.isnot(None), NearMiss.event_date_time >= cutoff_90
    ).count()
    exposure_index = round(min(100, (recent_incidents + recent_near_misses) / total_employees * 100)) if total_employees else 0
    exposure_tone = "red" if exposure_index > 30 else ("amber" if exposure_index >= 10 else "green")
    exposure_subtitle = "High Risk" if exposure_index > 30 else ("Medium Risk" if exposure_index >= 10 else "Low Risk")

    # ── Supervisor Safety Score ─────────────────────────────────────────────
    # Avg compliance_rating of safety_walks performed by employees in
    # safety-signatory roles (HSE Manager / Safety Officer / Site Inspector).
    supervisor_role_ids = [r.id for r in db.query(Role).filter(Role.safety_signatory == "Yes").all()]
    avg_supervisor_compliance = (
        db.query(func.avg(SafetyWalk.compliance_rating))
        .join(Employee, SafetyWalk.inspector_id == Employee.id)
        .filter(Employee.role_id.in_(supervisor_role_ids))
        .scalar()
    ) if supervisor_role_ids else None
    supervisor_score = round(float(avg_supervisor_compliance) / 5 * 100) if avg_supervisor_compliance else 0
    supervisor_subtitle = "Highly Effective" if supervisor_score >= 90 else ("Effective" if supervisor_score >= 70 else "Needs Coaching")

    # ── Fatigue Risk (overtime vs normal hours) ─────────────────────────────
    # shift_schedule has no concept of "overtime" recorded directly — every
    # shift logs actual_hours_worked against a standard 8-hour shift. Hours
    # beyond 8 per shift are treated as overtime, summed org-wide per week
    # over the most recent 10 weeks of *actual* shift data (the dataset's
    # own date range, not "today" — this is historical data, not live shifts).
    latest_shift_date = db.query(func.max(ShiftSchedule.shift_date)).scalar()
    fatigue_trend: list = []
    if latest_shift_date:
        window_end = latest_shift_date + timedelta(days=1)
        window_start = window_end - timedelta(weeks=10)
        shift_rows = (
            db.query(ShiftSchedule.shift_date, ShiftSchedule.actual_hours_worked)
            .filter(ShiftSchedule.shift_date >= window_start, ShiftSchedule.shift_date < window_end)
            .all()
        )
        weekly: dict = {}
        for shift_date, hours in shift_rows:
            if shift_date is None or hours is None:
                continue
            week_index = (shift_date - window_start).days // 7
            hours = float(hours)
            normal = min(hours, 8.0)
            overtime = max(0.0, hours - 8.0)
            bucket = weekly.setdefault(week_index, {"normal": 0.0, "overtime": 0.0})
            bucket["normal"] += normal
            bucket["overtime"] += overtime
        fatigue_trend = [
            {
                "week": str(i + 1),
                "normal": round(weekly.get(i, {"normal": 0.0})["normal"]),
                "overtime": round(weekly.get(i, {"overtime": 0.0})["overtime"]),
            }
            for i in range(10)
        ]

    # ── Safety Toolbox Meetings Trend ───────────────────────────────────────
    # No "Toolbox" inspection_type exists; closest real proxy is monthly
    # safety_walk volume overall (best-effort substitute, documented here).
    # Anchored to the latest actual safety_walk date, not real-world "today"
    # (same reasoning as Worker Exposure Index above).
    latest_walk_date = db.query(func.max(SafetyWalk.inspection_date_time)).scalar()
    walk_anchor = (latest_walk_date.date() if latest_walk_date else today)
    eight_months_ago = _add_months(walk_anchor, -7)
    toolbox_rows = (
        db.query(
            func.year(SafetyWalk.inspection_date_time).label("yr"),
            func.month(SafetyWalk.inspection_date_time).label("mo"),
            func.count(SafetyWalk.id).label("cnt"),
        )
        .filter(
            SafetyWalk.inspection_date_time.isnot(None),
            SafetyWalk.inspection_date_time >= eight_months_ago,
        )
        .group_by("yr", "mo")
        .order_by("yr", "mo")
        .all()
    )
    toolbox_trend = [{"month": MONTH_NAMES[int(r.mo) - 1], "meetings": r.cnt} for r in toolbox_rows]

    # ── High Risk Roles ──────────────────────────────────────────────────────
    # (incidents + near-misses attributed to a role) / headcount in that role.
    role_headcount = dict(
        db.query(Role.role_name, func.count(Employee.id))
        .join(Employee, Employee.role_id == Role.id)
        .group_by(Role.role_name)
        .all()
    )
    role_incidents = dict(
        db.query(Role.role_name, func.count(Incident.id))
        .join(Employee, Employee.role_id == Role.id)
        .outerjoin(Incident, Incident.reported_by == Employee.id)
        .group_by(Role.role_name)
        .all()
    )
    role_near_misses = dict(
        db.query(Role.role_name, func.count(NearMiss.id))
        .join(Employee, Employee.role_id == Role.id)
        .outerjoin(NearMiss, NearMiss.reported_by == Employee.id)
        .group_by(Role.role_name)
        .all()
    )
    role_rates = sorted(
        (
            (name, (role_incidents.get(name, 0) + role_near_misses.get(name, 0)) / headcount)
            for name, headcount in role_headcount.items()
            if headcount
        ),
        key=lambda item: (-item[1], item[0]),
    )
    high_risk_roles = []
    for name, rate in role_rates[:4]:
        if rate >= 3:
            status, tone = "High", "red"
        elif rate >= 1.5:
            status, tone = "Medium", "amber"
        else:
            status, tone = "Low", "green"
        high_risk_roles.append({"role": name, "status": status, "tone": tone})

    # ── Training Expiry Status ──────────────────────────────────────────────
    # There's no per-employee training-assignment table, so this assumes every
    # employee renews every catalog training on its own recurring cycle
    # (expiry_months) starting from their real induction_date — the closest
    # defensible proxy available from real data for "who is due a refresher".
    programs = db.query(TrainingProgram).filter(TrainingProgram.expiry_months.isnot(None)).all()
    employees_with_induction = db.query(Employee).filter(Employee.induction_date.isnot(None)).all()
    expired_count = due_30_count = due_90_count = 0
    for emp in employees_with_induction:
        for prog in programs:
            next_due = emp.induction_date
            while next_due < today:
                next_due = _add_months_preserve_day(next_due, prog.expiry_months)
            days_until = (next_due - today).days
            if days_until < 0:
                expired_count += 1
            elif days_until < 30:
                due_30_count += 1
            elif days_until < 90:
                due_90_count += 1
    training_expiry = [
        {"label": "Expired", "value": expired_count},
        {"label": "Due <30 Days", "value": due_30_count},
        {"label": "Due <90 Days", "value": due_90_count},
    ]
    expiring_soon_count = expired_count + due_30_count

    # ── Behaviour Observations ──────────────────────────────────────────────
    safe_count = db.query(SafetyWalk).filter(SafetyWalk.issues_found == 0).count()
    at_risk_count = db.query(SafetyWalk).filter(SafetyWalk.issues_found > 0).count()
    near_miss_count = db.query(NearMiss).count()
    behaviour_total = safe_count + at_risk_count + near_miss_count
    behaviour_breakdown = [
        {"label": "Safe", "value": round(safe_count / behaviour_total * 100) if behaviour_total else 0, "color": "#50B46A"},
        {"label": "At-Risk", "value": round(at_risk_count / behaviour_total * 100) if behaviour_total else 0, "color": "#F3B548"},
        {"label": "Near Miss", "value": round(near_miss_count / behaviour_total * 100) if behaviour_total else 0, "color": "#4D74C1"},
    ]

    # ── Coaching Actions ─────────────────────────────────────────────────────
    # Open CAPA actions specifically addressing a training gap.
    coaching_rows = (
        db.query(CapaAction, Employee)
        .outerjoin(Employee, CapaAction.responsible_person_id == Employee.id)
        .filter(CapaAction.action_type == "Training", CapaAction.status != "Completed")
        .order_by(case((CapaAction.due_date.is_(None), 1), else_=0), CapaAction.due_date.asc())
        .limit(3)
        .all()
    )
    coaching_actions = []
    for c, emp in coaching_rows:
        days_until = (c.due_date - today).days if c.due_date else None
        if days_until is None:
            detail = "No Date"
        elif days_until < 0:
            detail = "Overdue"
        elif days_until == 0:
            detail = "Due Today"
        elif days_until == 1:
            detail = "Due Tomorrow"
        elif days_until <= 7:
            detail = "Due This Week"
        else:
            detail = f"Due {_fmt_due(c.due_date)}"
        coaching_actions.append({
            "title": f"{c.description or c.action_type} - {emp.full_name if emp else 'Unassigned'}",
            "detail": detail,
            "tone": "red" if days_until is not None and days_until < 0 else "green",
        })

    # ── Open Actions ─────────────────────────────────────────────────────────
    # General open CAPA actions (excluding the ones already shown as coaching).
    open_rows = (
        db.query(CapaAction, Employee)
        .outerjoin(Employee, CapaAction.responsible_person_id == Employee.id)
        .filter(CapaAction.action_type != "Training", CapaAction.status != "Completed")
        .order_by(case((CapaAction.due_date.is_(None), 1), else_=0), CapaAction.due_date.asc())
        .limit(3)
        .all()
    )
    open_actions = []
    for c, emp in open_rows:
        is_overdue = bool(c.due_date and c.due_date < today)
        days_until = (c.due_date - today).days if c.due_date else None
        tone = "red" if is_overdue else ("amber" if days_until is not None and days_until <= 7 else "blue")
        open_actions.append({
            "title": c.description or c.action_type or "CAPA Action",
            "detail": f"Due {_fmt_due(c.due_date)}",
            "tone": tone,
            "priority": "High" if is_overdue else "Priority",
        })

    return {
        "competency_coverage": {
            "value": competency_pct,
            "subtitle": competency_subtitle,
            "tone": competency_tone,
            "change": f"{'▲' if competency_tone != 'red' else '▼'} {competency_pct}%",
            "sparkline": sparkline,
        },
        "worker_exposure_index": {
            "value": exposure_index,
            "subtitle": exposure_subtitle,
            "tone": exposure_tone,
            "change": f"{'▲' if exposure_tone == 'green' else '⚠'}" + (f" {exposure_index}%" if exposure_tone == "green" else ""),
        },
        "supervisor_safety_score": {
            "value": supervisor_score,
            "subtitle": supervisor_subtitle,
            "tone": "blue",
            "change": f"▲ {supervisor_score}%",
        },
        "fatigue_trend": fatigue_trend,
        "toolbox_trend": toolbox_trend,
        "high_risk_roles": high_risk_roles,
        "training_expiry": training_expiry,
        "expiring_soon_count": expiring_soon_count,
        "behaviour_breakdown": behaviour_breakdown,
        "coaching_actions": coaching_actions,
        "open_actions": open_actions,
    }


@router.get("/directory")
def get_employee_directory(db: Session = Depends(get_db)):
    """Real employee roster with joined role/department/site names."""
    rows = (
        db.query(Employee, Role, Department, Site)
        .outerjoin(Role, Employee.role_id == Role.id)
        .outerjoin(Department, Employee.department_id == Department.id)
        .outerjoin(Site, Department.site_id == Site.id)
        .order_by(Employee.full_name.asc())
        .all()
    )
    return [
        {
            "id": emp.id,
            "full_name": emp.full_name,
            "role_name": role.role_name if role else None,
            "department_name": dept.department_name if dept else None,
            "site_name": site.site_name if site else None,
            "employment_type": emp.employment_type,
            "shift_pattern": emp.shift_pattern,
            "active_status": emp.active_status,
        }
        for emp, role, dept, site in rows
    ]
