from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import case, func, or_
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.core.dependencies import get_current_user, CurrentUser
from app.utils.tenant import org_scoped_join
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
    month_index = d.month - 1 + months
    year = d.year + month_index // 12
    month = month_index % 12 + 1
    day = d.day
    while True:
        try:
            return date(year, month, day)
        except ValueError:
            day -= 1


def _of(query, model, org_id):
    if org_id is not None:
        return query.filter(model.organisation_id == org_id)
    return query


@router.get("/overview")
def get_people_overview(db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    today = date.today()
    org_id = current_user.org_id

    total_employees = _of(db.query(Employee), Employee, org_id).count() or 0

    training_incident_rows = (
        _of(
            db.query(Incident.reported_by, Incident.incident_date_time)
            .filter(
                Incident.reported_by.isnot(None),
                or_(
                    func.lower(Incident.root_cause).like("%train%"),
                    func.lower(Incident.root_cause_category).like("%train%"),
                ),
            ),
            Incident, org_id,
        ).all()
    )
    training_capa_employee_ids = {
        row[0]
        for row in _of(
            db.query(CapaAction.responsible_person_id)
            .filter(
                CapaAction.responsible_person_id.isnot(None),
                func.lower(CapaAction.root_cause_addressed).like("%train%"),
            ),
            CapaAction, org_id,
        ).all()
    }
    flagged_now = training_capa_employee_ids | {r[0] for r in training_incident_rows}
    competency_pct = round((total_employees - len(flagged_now)) / total_employees * 100) if total_employees else 0

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

    latest_incident_date = _of(db.query(func.max(Incident.incident_date_time)), Incident, org_id).scalar()
    latest_near_miss_date = _of(db.query(func.max(NearMiss.event_date_time)), NearMiss, org_id).scalar()
    candidates = [d for d in (latest_incident_date, latest_near_miss_date) if d]
    activity_anchor = max(candidates) if candidates else datetime.combine(today, datetime.min.time())
    cutoff_90 = activity_anchor - timedelta(days=90)
    recent_incidents = _of(
        db.query(Incident).filter(Incident.incident_date_time.isnot(None), Incident.incident_date_time >= cutoff_90),
        Incident, org_id,
    ).count()
    recent_near_misses = _of(
        db.query(NearMiss).filter(NearMiss.event_date_time.isnot(None), NearMiss.event_date_time >= cutoff_90),
        NearMiss, org_id,
    ).count()
    exposure_index = round(min(100, (recent_incidents + recent_near_misses) / total_employees * 100)) if total_employees else 0
    exposure_tone = "red" if exposure_index > 30 else ("amber" if exposure_index >= 10 else "green")
    exposure_subtitle = "High Risk" if exposure_index > 30 else ("Medium Risk" if exposure_index >= 10 else "Low Risk")

    # Join through employee's actual role to check safety_signatory directly,
    # avoiding org mismatch when employees reference roles from another org.
    avg_supervisor_compliance = (
        db.query(func.avg(SafetyWalk.compliance_rating))
        .join(Employee, org_scoped_join(SafetyWalk.inspector_id == Employee.id, Employee.organisation_id, org_id))
        .join(Role, Employee.role_id == Role.id)
        .filter(
            Role.safety_signatory == "Yes",
            *([SafetyWalk.organisation_id == org_id] if org_id is not None else []),
        )
        .scalar()
    )
    supervisor_score = round(float(avg_supervisor_compliance) / 5 * 100) if avg_supervisor_compliance else 0
    supervisor_subtitle = "Highly Effective" if supervisor_score >= 90 else ("Effective" if supervisor_score >= 70 else "Needs Coaching")

    latest_shift_date = _of(db.query(func.max(ShiftSchedule.shift_date)), ShiftSchedule, org_id).scalar()
    fatigue_trend: list = []
    if latest_shift_date:
        window_end = latest_shift_date + timedelta(days=1)
        window_start = window_end - timedelta(weeks=10)
        shift_rows = (
            _of(
                db.query(ShiftSchedule.shift_date, ShiftSchedule.actual_hours_worked)
                .filter(ShiftSchedule.shift_date >= window_start, ShiftSchedule.shift_date < window_end),
                ShiftSchedule, org_id,
            ).all()
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


    latest_walk_date = _of(db.query(func.max(SafetyWalk.inspection_date_time)), SafetyWalk, org_id).scalar()
    walk_anchor = (latest_walk_date.date() if latest_walk_date else today)
    eight_months_ago = _add_months(walk_anchor, -7)
    toolbox_rows = (
        _of(
            db.query(
                func.year(SafetyWalk.inspection_date_time).label("yr"),
                func.month(SafetyWalk.inspection_date_time).label("mo"),
                func.count(SafetyWalk.id).label("cnt"),
            ).filter(
                SafetyWalk.inspection_date_time.isnot(None),
                SafetyWalk.inspection_date_time >= eight_months_ago,
            ),
            SafetyWalk, org_id,
        )
        .group_by("yr", "mo")
        .order_by("yr", "mo")
        .all()
    )
    toolbox_counts = {(int(r.yr), int(r.mo)): r.cnt for r in toolbox_rows}
    toolbox_trend = []
    for i in range(8):
        bucket_date = _add_months(eight_months_ago, i)
        toolbox_trend.append({
            "month": MONTH_NAMES[bucket_date.month - 1],
            "meetings": toolbox_counts.get((bucket_date.year, bucket_date.month), 0),
        })

    role_headcount = dict(
        db.query(Role.role_name, func.count(Employee.id))
        .join(Employee, Employee.role_id == Role.id)
        .filter(*([Employee.organisation_id == org_id] if org_id is not None else []))
        .group_by(Role.role_name)
        .all()
    )
    role_incidents = dict(
        db.query(Role.role_name, func.count(Incident.id))
        .join(Employee, Employee.role_id == Role.id)
        .outerjoin(Incident, org_scoped_join(Incident.reported_by == Employee.id, Incident.organisation_id, org_id))
        .filter(*([Employee.organisation_id == org_id] if org_id is not None else []))
        .group_by(Role.role_name)
        .all()
    )
    role_near_misses = dict(
        db.query(Role.role_name, func.count(NearMiss.id))
        .join(Employee, Employee.role_id == Role.id)
        .outerjoin(NearMiss, org_scoped_join(NearMiss.reported_by == Employee.id, NearMiss.organisation_id, org_id))
        .filter(*([Employee.organisation_id == org_id] if org_id is not None else []))
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

    programs = _of(db.query(TrainingProgram).filter(TrainingProgram.expiry_months > 0), TrainingProgram, org_id).all()
    employees_with_induction = _of(db.query(Employee).filter(Employee.induction_date.isnot(None)), Employee, org_id).all()
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

    safe_count = _of(db.query(SafetyWalk).filter(SafetyWalk.issues_found == 0), SafetyWalk, org_id).count()
    at_risk_count = _of(db.query(SafetyWalk).filter(SafetyWalk.issues_found > 0), SafetyWalk, org_id).count()
    near_miss_count = _of(db.query(NearMiss), NearMiss, org_id).count()
    behaviour_total = safe_count + at_risk_count + near_miss_count
    behaviour_breakdown = [
        {"label": "Safe", "value": round(safe_count / behaviour_total * 100) if behaviour_total else 0, "color": "#50B46A"},
        {"label": "At-Risk", "value": round(at_risk_count / behaviour_total * 100) if behaviour_total else 0, "color": "#F3B548"},
        {"label": "Near Miss", "value": round(near_miss_count / behaviour_total * 100) if behaviour_total else 0, "color": "#4D74C1"},
    ]

    coaching_rows = (
        _of(
            db.query(CapaAction, Employee)
            .outerjoin(Employee, org_scoped_join(CapaAction.responsible_person_id == Employee.id, Employee.organisation_id, org_id))
            .filter(CapaAction.action_type == "Training", CapaAction.status != "Completed"),
            CapaAction, org_id,
        )
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

    open_rows = (
        _of(
            db.query(CapaAction, Employee)
            .outerjoin(Employee, org_scoped_join(CapaAction.responsible_person_id == Employee.id, Employee.organisation_id, org_id))
            .filter(CapaAction.action_type != "Training", CapaAction.status != "Completed"),
            CapaAction, org_id,
        )
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


@router.get("/hierarchy")
def get_team_hierarchy(db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    from app.models.user import User
    from app.models.app_role import AppRole

    org_id = current_user.org_id

    q = (
        db.query(Employee, Role, User, AppRole)
        .outerjoin(Role, Employee.role_id == Role.id)
        .outerjoin(User, User.employee_id == Employee.id)
        .outerjoin(AppRole, User.app_role_id == AppRole.id)
    )
    if org_id is not None:
        q = q.filter(Employee.organisation_id == org_id)
    rows = q.order_by(Employee.full_name.asc()).all()

    return [
        {
            "id": emp.id,
            "full_name": emp.full_name,
            "role_name": (app_role.label if app_role else None) or (role.role_name if role else None),
            "manager_id": emp.manager_id,
            "active_status": emp.active_status,
            "email": user.email if user else None,
            "has_login": user is not None,
            "is_active": bool(user.is_active) if user else None,
        }
        for emp, role, user, app_role in rows
    ]


@router.get("/directory")
def get_employee_directory(db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    from app.models.user import User
    from app.models.app_role import AppRole

    org_id = current_user.org_id

    # Employees who already have a linked login (User.employee_id) are represented
    # via user_result below — exclude them here so invited users don't show twice.
    linked_employee_ids = {
        row[0] for row in db.query(User.employee_id).filter(User.employee_id.isnot(None)).all()
    }

    # Always fetch imported employees
    q = (
        db.query(Employee, Role, Department, Site)
        .outerjoin(Role, Employee.role_id == Role.id)
        .outerjoin(Department, Employee.department_id == Department.id)
        .outerjoin(Site, Department.site_id == Site.id)
    )
    if org_id is not None:
        q = q.filter(Employee.organisation_id == org_id)
    if linked_employee_ids:
        q = q.filter(Employee.id.notin_(linked_employee_ids))
    rows = q.order_by(Employee.full_name.asc()).all()

    employee_result = [
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

    # Always include non-admin org users (wizard step-4 / invited users)
    if org_id is not None:
        uq = (
            db.query(User, AppRole)
            .outerjoin(AppRole, User.app_role_id == AppRole.id)
            .filter(
                User.organisation_id == org_id,
                AppRole.name.notin_(["superadmin", "admin"]),
            )
        )
    else:
        uq = (
            db.query(User, AppRole)
            .outerjoin(AppRole, User.app_role_id == AppRole.id)
            .filter(AppRole.name.notin_(["superadmin", "admin"]))
        )
    user_rows = uq.order_by(User.full_name.asc()).all()
    user_result = [
        {
            "id": -(u.id),
            "full_name": u.full_name or u.username,
            "role_name": ar.label if ar else None,
            "department_name": None,
            "site_name": None,
            "employment_type": "System User",
            "shift_pattern": None,
            "active_status": "Active" if u.is_active else "Inactive",
        }
        for u, ar in user_rows
    ]

    # Return system users first, then imported employees — always both
    return user_result + employee_result
