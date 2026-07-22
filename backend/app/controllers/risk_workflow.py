"""Risk report workflow: Worker → Supervisor → Manager.

Routes live under /risk-workflow and write to the `risk_reports` table — deliberately
NOT the `hazards` catalog, which the website reads as organisation-wide reference data.
"""
from typing import Any, Dict, Optional

from app.controllers.report_workflow_factory import build_workflow_router
from app.models.risk_report import RiskReport
from app.schemas.report_workflow import RiskReportCreate

# 5x5 risk matrix, used when the app sends likelihood/consequence but no score.
_LIKELIHOOD = {"rare": 1, "unlikely": 2, "possible": 3, "likely": 4, "almost_certain": 5}
_CONSEQUENCE = {"negligible": 1, "minor": 2, "moderate": 3, "major": 4, "catastrophic": 5}


def _score(likelihood: Optional[str], consequence: Optional[str]) -> Optional[int]:
    l = _LIKELIHOOD.get((likelihood or "").strip().lower())
    c = _CONSEQUENCE.get((consequence or "").strip().lower())
    return l * c if l and c else None


def _build_row(payload: RiskReportCreate, data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "risk_title": data.get("risk_title"),
        "risk_category": data.get("risk_category"),
        "likelihood": data.get("likelihood"),
        "consequence": data.get("consequence"),
        "risk_score": data.get("risk_score") or _score(data.get("likelihood"), data.get("consequence")),
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
