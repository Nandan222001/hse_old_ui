from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.core.dependencies import get_current_user, CurrentUser
from app.models.capa_action import CapaAction
from app.models.employee import Employee
from app.models.incident import Incident
from app.models.permit_to_work import PermitToWork
from app.models.training_program import TrainingProgram

router = APIRouter(prefix="/vendors", tags=["Vendors"])

MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]


def _due_label(d: date | None, today: date) -> str:
    if d is None:
        return "No Due Date"
    delta = (d - today).days
    if delta < 0:
        return "Overdue"
    if delta == 0:
        return "Due Today"
    if delta <= 7:
        return "Due This Week"
    if delta <= 14:
        return "Due Next Week"
    return f"Due {d.strftime('%d %b')}"


def _capa_status(s: str | None) -> str:
    if s in ("Closed", "Completed", "Resolved"):
        return "Closed"
    return "In Progress"


@router.get("/summary")
def get_vendor_summary(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    org_id = current_user.org_id
    today = date.today()
    ninety_ago = today - timedelta(days=90)
    nine_months_ago = today - timedelta(days=270)

    # ── Contractors ──────────────────────────────────────────────────────────
    contractors = (
        db.query(Employee)
        .filter(
            Employee.organisation_id == org_id,
            Employee.employment_type.ilike("%contractor%"),
        )
        .all()
    )
    total = len(contractors)
    contractor_ids = [c.id for c in contractors]

    # ── Compliance breakdown ─────────────────────────────────────────────────
    if total == 0:
        compliant_pct = non_compliant_pct = pending_pct = 0
    else:
        # Non-compliant = contractors with incidents in last 90 days
        nc_ids: set[int] = set()
        if contractor_ids:
            rows = (
                db.query(Incident.reported_by)
                .filter(
                    Incident.organisation_id == org_id,
                    Incident.reported_by.in_(contractor_ids),
                    Incident.report_date >= ninety_ago,
                )
                .distinct()
                .all()
            )
            nc_ids = {r[0] for r in rows}

        # Pending = not inducted
        pending_ids = {c.id for c in contractors if c.induction_date is None}
        # Compliant = inducted AND no recent incident
        compliant_ids = {
            c.id for c in contractors
            if c.id not in nc_ids and c.id not in pending_ids
        }
        compliant_pct     = round(len(compliant_ids) / total * 100)
        non_compliant_pct = round(len(nc_ids)        / total * 100)
        pending_pct       = max(0, 100 - compliant_pct - non_compliant_pct)

    compliance = [
        {"name": "Compliant",     "value": compliant_pct,     "color": "#22C55E"},
        {"name": "Non-Compliant", "value": non_compliant_pct, "color": "#F59E0B"},
        {"name": "Pending",       "value": pending_pct,       "color": "#CBD5E1"},
    ]

    # ── Risk Score (10 − penalty from incident rate) ─────────────────────────
    inc_count = 0
    if contractor_ids:
        inc_count = (
            db.query(func.count(Incident.id))
            .filter(
                Incident.organisation_id == org_id,
                Incident.reported_by.in_(contractor_ids),
                Incident.report_date >= ninety_ago,
            )
            .scalar()
            or 0
        )
    raw = max(0.0, 10.0 - (inc_count / max(total, 1)) * 3.0)
    risk_score = round(raw, 1)

    # ── Exposure Hours per month (permits) ───────────────────────────────────
    permit_rows = (
        db.query(
            func.month(PermitToWork.date_issued).label("m"),
            func.sum(
                func.coalesce(PermitToWork.number_of_workers, 1)
                * func.coalesce(PermitToWork.duration_requested_hours, 8)
            ).label("hours"),
        )
        .filter(
            PermitToWork.organisation_id == org_id,
            PermitToWork.date_issued >= nine_months_ago,
        )
        .group_by(func.month(PermitToWork.date_issued))
        .order_by(func.month(PermitToWork.date_issued))
        .all()
    )
    exposure_hours = [
        {"month": MONTH_ABBR[r.m - 1], "hours": int(r.hours or 0)}
        for r in permit_rows
    ]
    if not exposure_hours:
        exposure_hours = [{"month": m, "hours": 0} for m in MONTH_ABBR[:9]]

    avg_h = sum(r["hours"] for r in exposure_hours) / max(len(exposure_hours), 1)
    threshold = max(int(avg_h * 1.2), 100)

    # ── Certifications (training programs) ──────────────────────────────────
    training_rows = (
        db.query(
            TrainingProgram.training_name,
            func.count(TrainingProgram.id).label("cnt"),
        )
        .filter(TrainingProgram.organisation_id == org_id)
        .group_by(TrainingProgram.training_name)
        .order_by(func.count(TrainingProgram.id).desc())
        .limit(4)
        .all()
    )
    fallback_labels = ["Site Induction", "Electrical Safety", "Work at Height", "Categories"]
    if training_rows:
        max_cnt = max(r.cnt for r in training_rows) or 1
        certifications = [
            {"label": r.training_name[:28], "pct": min(100, round(r.cnt / max_cnt * 100))}
            for r in training_rows
        ]
        while len(certifications) < 4:
            certifications.append({"label": fallback_labels[len(certifications)], "pct": 0})
    else:
        certifications = [{"label": l, "pct": 0} for l in fallback_labels]

    # ── High Risk Contractors ────────────────────────────────────────────────
    high_risk: list[dict] = []
    if contractor_ids:
        hr_rows = (
            db.query(
                Employee.full_name,
                func.count(Incident.id).label("cnt"),
            )
            .join(Incident, Incident.reported_by == Employee.id)
            .filter(
                Employee.organisation_id == org_id,
                Employee.id.in_(contractor_ids),
                Incident.report_date >= ninety_ago,
            )
            .group_by(Employee.id, Employee.full_name)
            .order_by(func.count(Incident.id).desc())
            .limit(5)
            .all()
        )
        top = hr_rows[0].cnt if hr_rows else 1
        high_risk = [
            {"name": r.full_name, "risk": min(99, round(50 + r.cnt / max(top, 1) * 49))}
            for r in hr_rows
        ]

    # ── Permit Violations ────────────────────────────────────────────────────
    pv_rows = (
        db.query(Employee.full_name, PermitToWork.date_issued)
        .join(Employee, PermitToWork.issued_by == Employee.id)
        .filter(
            PermitToWork.organisation_id == org_id,
            PermitToWork.deviation_reported == "Yes",
        )
        .order_by(PermitToWork.date_issued.desc())
        .limit(5)
        .all()
    )
    permit_violations = [
        {
            "name": r.full_name,
            "desc": "Permit Violation",
            "time": r.date_issued.strftime("%d %b %Y") if r.date_issued else "—",
        }
        for r in pv_rows
    ]

    # ── Repeat Breaches ──────────────────────────────────────────────────────
    repeat_breaches: list[dict] = []
    if contractor_ids:
        rb_rows = (
            db.query(
                Employee.full_name,
                func.count(Incident.id).label("cnt"),
            )
            .join(Incident, Incident.reported_by == Employee.id)
            .filter(
                Employee.organisation_id == org_id,
                Employee.id.in_(contractor_ids),
            )
            .group_by(Employee.id, Employee.full_name)
            .having(func.count(Incident.id) > 1)
            .order_by(func.count(Incident.id).desc())
            .limit(5)
            .all()
        )
        repeat_breaches = [
            {"name": r.full_name, "breach": f"{r.cnt} Breach{'es' if r.cnt > 1 else ''}"}
            for r in rb_rows
        ]

    # ── Watchlist (contractors with high-severity incidents) ─────────────────
    watchlist: list[dict] = []
    if contractor_ids:
        wl_rows = (
            db.query(
                Employee.full_name,
                func.count(Incident.id).label("cnt"),
            )
            .join(Incident, Incident.reported_by == Employee.id)
            .filter(
                Employee.organisation_id == org_id,
                Employee.id.in_(contractor_ids),
                Incident.severity.in_(["High", "Critical", "Major"]),
            )
            .group_by(Employee.id, Employee.full_name)
            .order_by(func.count(Incident.id).desc())
            .limit(5)
            .all()
        )
        top_wl = wl_rows[0].cnt if wl_rows else 1
        watchlist = [
            {"name": r.full_name, "risk": min(99, round(70 + r.cnt / max(top_wl, 1) * 29))}
            for r in wl_rows
        ]

    # ── CAPA Items ───────────────────────────────────────────────────────────
    capa_rows = (
        db.query(CapaAction)
        .filter(CapaAction.organisation_id == org_id)
        .order_by(CapaAction.due_date.desc())
        .limit(5)
        .all()
    )
    capa_items = [
        {"label": f"CAPA-{c.id}", "status": _capa_status(c.status)}
        for c in capa_rows
    ]

    # ── Open Actions ─────────────────────────────────────────────────────────
    open_rows = (
        db.query(CapaAction)
        .filter(
            CapaAction.organisation_id == org_id,
            CapaAction.status.notin_(["Closed", "Completed", "Resolved"]),
        )
        .order_by(CapaAction.due_date)
        .limit(5)
        .all()
    )
    open_actions = [
        {
            "label": f"CAPA-{r.id}: {(r.description or 'Action')[:30]}",
            "due": _due_label(r.due_date, today),
        }
        for r in open_rows
    ]

    return {
        "risk_score":        {"value": risk_score, "delta": 1.5, "up": True},
        "total_contractors": total,
        "compliance":        compliance,
        "exposure_hours":    exposure_hours,
        "threshold":         threshold,
        "certifications":    certifications,
        "high_risk":         high_risk,
        "permit_violations": permit_violations,
        "repeat_breaches":   repeat_breaches,
        "watchlist":         watchlist,
        "capa_items":        capa_items,
        "open_actions":      open_actions,
    }
