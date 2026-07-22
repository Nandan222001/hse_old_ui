from dataclasses import dataclass

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.incident import Incident
from app.models.permit_to_work import PermitToWork

CONTRACTOR_TYPE_PATTERN = "%contract%"


@dataclass
class ContractorRiskResult:
    has_contractors: bool
    contractor_employees: int
    total_employees: int
    contractor_incidents: int
    total_org_incidents: int
    contractor_violations: int
    relative_risk: float
    violation_penalty: float
    incident_penalty: float
    score_10: float
    score_pct: float
    label: str


def compute_contractor_risk(db: Session, org_id: int | None) -> ContractorRiskResult:
    """Single source of truth for the Contractor Risk Score, shared by the
    dashboard leading-indicators panel and the Vendors/Contractors page so both
    always display the same number for the same organisation."""

    def _org(query, model):
        if org_id is not None:
            return query.filter(model.organisation_id == org_id)
        return query

    contractor_employees = int(
        _org(db.query(Employee), Employee)
        .filter(func.lower(Employee.employment_type).like(CONTRACTOR_TYPE_PATTERN))
        .count()
    )
    total_employees = int(_org(db.query(Employee), Employee).count())

    total_org_incidents = int(_org(db.query(Incident), Incident).count())

    contractor_incidents = int(
        _org(db.query(func.count(Incident.id)), Incident)
        .join(Employee, Incident.reported_by == Employee.id)
        .filter(func.lower(Employee.employment_type).like(CONTRACTOR_TYPE_PATTERN))
        .scalar()
        or 0
    )

    # Violations must be scoped to permits issued by a contractor — an org-wide
    # violation count dilutes the score with permits that have nothing to do
    # with contractors, and saturates the penalty cap for every organisation.
    contractor_violations = int(
        _org(db.query(func.count(PermitToWork.id)), PermitToWork)
        .join(Employee, PermitToWork.issued_by == Employee.id)
        .filter(
            PermitToWork.deviation_reported == "Yes",
            func.lower(Employee.employment_type).like(CONTRACTOR_TYPE_PATTERN),
        )
        .scalar()
        or 0
    )

    violation_penalty = min(3.0, contractor_violations * 0.5)

    if contractor_employees == 0:
        # No contractor workforce recorded for this org — a score would be
        # fabricated from unrelated data, so report explicitly that none exists
        # instead of one controller returning a fake 10/10 and another a
        # violation-only score.
        return ContractorRiskResult(
            has_contractors=False,
            contractor_employees=0,
            total_employees=total_employees,
            contractor_incidents=0,
            total_org_incidents=total_org_incidents,
            contractor_violations=contractor_violations,
            relative_risk=0.0,
            violation_penalty=0.0,
            incident_penalty=0.0,
            score_10=0.0,
            score_pct=0.0,
            label="No Contractors",
        )

    if total_org_incidents == 0:
        relative_risk = 0.0
        incident_penalty = 0.0
    else:
        cont_inc_rate = contractor_incidents / contractor_employees
        org_inc_rate = total_org_incidents / max(total_employees, 1)
        relative_risk = round(cont_inc_rate / org_inc_rate, 2) if org_inc_rate > 0 else 0.0
        incident_penalty = min(7.0, relative_risk * 3.0)

    score_10 = round(max(0.0, 10.0 - incident_penalty - violation_penalty), 1)
    score_pct = round(score_10 * 10, 1)
    label = "High" if score_10 < 5 else ("Medium" if score_10 < 8 else "Low")

    return ContractorRiskResult(
        has_contractors=True,
        contractor_employees=contractor_employees,
        total_employees=total_employees,
        contractor_incidents=contractor_incidents,
        total_org_incidents=total_org_incidents,
        contractor_violations=contractor_violations,
        relative_risk=relative_risk,
        violation_penalty=violation_penalty,
        incident_penalty=incident_penalty,
        score_10=score_10,
        score_pct=score_pct,
        label=label,
    )
