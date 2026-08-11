"""Risk report workflow: Worker → Supervisor → Manager.

Routes live under /risk-workflow and write to the `risk_reports` table — deliberately
NOT the `hazards` catalog, which the website reads as organisation-wide reference data.
"""
from datetime import datetime
from typing import Any, Dict, Optional

from app.controllers.report_workflow_factory import build_workflow_router
from app.models.risk_report import RiskReport
from app.schemas.report_workflow import RiskReportCreate
from app.services.risk_scoring import score_risk


def _is_night_shift(observed_at: Optional[datetime]) -> bool:
    """WF-01 uplift 3 — night shift is 22:00-06:00.

    Derived from the observation timestamp when the client does not state it,
    so the uplift cannot be lost simply because the mobile form has no such
    checkbox. The window wraps midnight, hence the `or` rather than a range.
    """
    if observed_at is None:
        return False
    return observed_at.hour >= 22 or observed_at.hour < 6


def _build_row(payload: RiskReportCreate, data: Dict[str, Any]) -> Dict[str, Any]:
    # The client may send an explicit night_shift flag. If it does not, infer it
    # from when the risk was observed.
    night_shift = data.get("night_shift")
    if night_shift is None:
        night_shift = _is_night_shift(data.get("observed_date_time"))

    result = score_risk(
        likelihood=data.get("likelihood"),
        # `risk_reports` names this column "consequence"; the WF-01 matrix calls
        # the same axis severity.
        severity=data.get("consequence"),
        raw_score=data.get("risk_score"),
        no_valid_rams=bool(data.get("no_valid_rams")),
        new_worker=bool(data.get("new_worker")),
        night_shift=bool(night_shift),
        temporary_control=bool(data.get("temporary_control")),
    )

    return {
        "risk_title": data.get("risk_title"),
        "risk_category": data.get("risk_category"),
        "likelihood": data.get("likelihood"),
        "consequence": data.get("consequence"),
        # risk_score stays the raw L x S — the website and the analytics queries
        # already read it and expect an unadjusted 1-25.
        "risk_score": result.raw_score,
        "raw_risk_score": result.raw_score,
        "uplift_no_valid_rams": int(bool(data.get("no_valid_rams"))),
        "uplift_new_worker": int(bool(data.get("new_worker"))),
        "uplift_night_shift": int(bool(night_shift)),
        "uplift_temporary_control": int(bool(data.get("temporary_control"))),
        "uplift_total": result.uplift_total,
        "adjusted_risk_score": result.adjusted_score,
        "risk_band": result.band,
        "risk_colour": result.colour,
        "review_frequency": result.review_frequency,
        "approval_route": result.approval_route,
        "blocks_work": int(result.blocks_work),
        "risk_explanation": result.explanation,
        "existing_controls": data.get("existing_controls"),
        "suggested_controls": data.get("suggested_controls"),
        "hazard_id": data.get("hazard_id"),
    }


router = build_workflow_router(
    report_type="risk",
    model=RiskReport,
    prefix="/risk-workflow",
    tag="Risk Workflow",
    create_schema=RiskReportCreate,
    build_row=_build_row,
    detail_fields=[
        "risk_title", "risk_category", "likelihood", "consequence",
        "risk_score", "existing_controls", "suggested_controls", "hazard_id",
    ],
)
