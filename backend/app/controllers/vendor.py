from typing import List, Optional
from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.core.dependencies import get_current_user, CurrentUser
from app.models.contractor import ContractorCompany, ContractorHours, ContractorScorecard, ContractorWorker
from app.models.employee import Employee
from app.models.incident import Incident

router = APIRouter(prefix="/vendors", tags=["Vendors"])

MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def _org_filter(query, model, org_id):
    if org_id is not None:
        return query.filter(model.organisation_id == org_id)
    return query


@router.get("/summary")
def get_vendor_summary(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Module 5 (Contractors & Vendors) — client's own KPI spec:

        Contractor TRIR                    = contractor injuries x 200,000 / contractor hours
        Contractor Induction Compliance %  = valid inductions / total inductions x 100
        Contractor Incident Contribution % = contractor injuries / total site injuries x 100
        Contractor Safety Score            = average of each company's own score (0-100)

    Sourced from the real WF-08 contractor registry (contractor_companies /
    contractor_workers / contractor_hours / contractor_scorecards,
    app/models/contractor.py) rather than inferring "contractor" from an
    Employee's employment_type field — that heuristic is still the only real
    signal this app has for attributing an *incident* to a contractor (see
    the TRIR/incident-contribution note below), but company-level facts
    (register, inductions, hours, safety score) now come from the registry
    that was actually built for them.

    NOTE: the registry itself is currently the client's own Module 5 sample
    data (SD_ContractorRegister / SD_ContractorInductions / SD_ContractorHours
    in HSEIQ_Full_KPI_with_SampleData.xlsx), imported identically into every
    org by backend/scripts/import_module5_contractor_sample.py. It is not yet
    per-org real data — flag that to the client when demoing this page; once
    a real contractor register is imported per org, these same queries will
    reflect it with no code changes needed.
    """
    org_id = current_user.org_id
    today = date.today()

    companies = (
        _org_filter(db.query(ContractorCompany), ContractorCompany, org_id)
        .order_by(ContractorCompany.company_name)
        .all()
    )
    company_ids = [c.id for c in companies]

    # ── Contractor Safety Score — average of each company's latest scorecard ──
    latest_scores: dict[int, float] = {}
    if company_ids:
        scorecard_rows = (
            _org_filter(db.query(ContractorScorecard), ContractorScorecard, org_id)
            .filter(ContractorScorecard.contractor_company_id.in_(company_ids))
            .order_by(ContractorScorecard.period_year.desc(), ContractorScorecard.period_quarter.desc())
            .all()
        )
        for row in scorecard_rows:
            latest_scores.setdefault(row.contractor_company_id, float(row.score))
    safety_score = (
        round(sum(latest_scores.values()) / len(latest_scores), 1) if latest_scores else None
    )

    # ── Contractor Induction Compliance % ────────────────────────────────────
    # Genuinely time-sensitive, unlike this app's "no incidents in the last 90
    # days" class of bug elsewhere: an induction really does lapse the day its
    # induction_valid_until passes, so literal today is the correct anchor —
    # not a "latest activity in the data" one.
    workers = _org_filter(db.query(ContractorWorker), ContractorWorker, org_id).all()
    total_inductions = len(workers)
    valid_inductions = sum(1 for w in workers if w.induction_valid_until and w.induction_valid_until >= today)
    induction_compliance_pct = (
        round(valid_inductions / total_inductions * 100, 1) if total_inductions else None
    )
    expiring_soon = [
        w for w in workers
        if w.induction_valid_until and today <= w.induction_valid_until <= today + timedelta(days=30)
    ]
    company_name_by_id = {c.id: c.company_name for c in companies}
    # Most-recently-expired / soonest-to-expire first — the most actionable
    # ones — not the longest-expired, which sorting purely ascending would surface.
    at_risk_workers = sorted(
        (w for w in workers if w.induction_valid_until and w.induction_valid_until < today + timedelta(days=30)),
        key=lambda w: w.induction_valid_until,
        reverse=True,
    )[:6]
    at_risk_rows = [
        {
            "full_name": w.full_name,
            "company_name": company_name_by_id.get(w.contractor_company_id, "—"),
            "badge_no": w.badge_no,
            "induction_valid_until": w.induction_valid_until.isoformat() if w.induction_valid_until else None,
            "status": "Expired" if w.induction_valid_until and w.induction_valid_until < today else "Expiring Soon",
        }
        for w in at_risk_workers
    ]

    # ── Contractor TRIR & Incident Contribution % ────────────────────────────
    # The registry above has no link from a ContractorWorker to this app's
    # Employee/Incident model (contractor_workers.badge_no is the client's own
    # sample employee code, not a real employees.id) — same gap the client's
    # own KPI spec flags ("recommend adding Contractor_Y_N flag to Incidents
    # schema"). Employment_type is the only real signal this app has for
    # attributing an incident to a contractor; contractor_hours (real, from
    # the register) is the denominator instead of the old permit-derived guess.
    contractor_employee_ids = [
        r[0] for r in
        db.query(Employee.id).filter(
            Employee.organisation_id == org_id,
            Employee.employment_type.ilike("%contractor%"),
        ).all()
    ]
    contractor_injuries = (
        db.query(Incident)
        .filter(Incident.organisation_id == org_id, Incident.reported_by.in_(contractor_employee_ids))
        .count()
        if contractor_employee_ids else 0
    )
    total_site_injuries = _org_filter(db.query(Incident), Incident, org_id).count()

    total_contractor_hours = int(
        _org_filter(db.query(func.sum(ContractorHours.hours_worked)), ContractorHours, org_id)
        .filter(ContractorHours.contractor_company_id.in_(company_ids) if company_ids else False)
        .scalar() or 0
    )
    contractor_trir = (
        round(contractor_injuries * 200_000 / total_contractor_hours, 2) if total_contractor_hours else None
    )
    incident_contribution_pct = (
        round(contractor_injuries / total_site_injuries * 100, 1) if total_site_injuries else None
    )

    # ── Exposure Hours — trailing 12 months of real logged hours ────────────
    hours_rows = (
        _org_filter(db.query(ContractorHours), ContractorHours, org_id)
        .filter(ContractorHours.contractor_company_id.in_(company_ids) if company_ids else False)
        .all()
    )
    by_period: dict[tuple[int, int], int] = {}
    for h in hours_rows:
        key = (h.period_year, h.period_month)
        by_period[key] = by_period.get(key, 0) + h.hours_worked
    exposure_hours = []
    if by_period:
        latest_period = max(by_period)
        for i in range(11, -1, -1):
            month_index = latest_period[1] - 1 - i
            year = latest_period[0] + month_index // 12
            month = month_index % 12 + 1
            if month <= 0:
                year -= 1
                month += 12
            exposure_hours.append({
                "month": MONTH_ABBR[month - 1],
                "hours": by_period.get((year, month), 0),
            })

    # ── Register table ────────────────────────────────────────────────────────
    register = [
        {
            "id": c.id,
            "company_name": c.company_name,
            "service_type": c.service_type,
            "prequalification_status": c.prequalification_status,
            "iso_45001_certified": bool(c.iso_45001_certified),
            "active": not bool(c.suspended),
            "contract_start_date": c.contract_start_date.isoformat() if c.contract_start_date else None,
            "contract_end_date": c.contract_end_date.isoformat() if c.contract_end_date else None,
            "last_safety_audit_date": c.last_safety_audit_date.isoformat() if c.last_safety_audit_date else None,
            "safety_score": latest_scores.get(c.id),
        }
        for c in companies
    ]

    return {
        "total_contractors": len(companies),
        "kpis": {
            "contractor_trir": {
                "value": contractor_trir,
                "contractor_injuries": contractor_injuries,
                "contractor_hours": total_contractor_hours,
                "note": "Target: at or below site TRIR",
            },
            "induction_compliance_pct": {
                "value": induction_compliance_pct,
                "valid": valid_inductions,
                "total": total_inductions,
                "note": "Target: 100% at all times — an expired induction means the worker isn't permitted on site",
            },
            "incident_contribution_pct": {
                "value": incident_contribution_pct,
                "contractor_injuries": contractor_injuries,
                "total_site_injuries": total_site_injuries,
                "note": "Attributed via Employee.employment_type — the registry has no incident linkage yet",
            },
            "safety_score": {
                "value": safety_score,
                "company_count": len(latest_scores),
                "note": "Target: 75+ average; any company below 60 needs review",
            },
        },
        "exposure_hours": exposure_hours,
        "expiring_soon_count": len(expiring_soon),
        "at_risk_workers": at_risk_rows,
        "register": register,
    }
