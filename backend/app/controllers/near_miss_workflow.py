"""Near Miss workflow: Worker → Supervisor → Manager.

Routes live under /near-miss-workflow and write to the `near_misses` table.
Separate from the website's read-only /near-misss/ CRUD router, which is untouched.
"""
from typing import Any, Dict

from app.controllers.report_workflow_factory import build_workflow_router
from app.models.near_miss import NearMiss
from app.schemas.report_workflow import NearMissReport


def _build_row(payload: NearMissReport, data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "potential_consequence": data.get("potential_consequence"),
        "underlying_cause": data.get("underlying_cause"),
        "control_failure": data.get("control_failure"),
    }


router = build_workflow_router(
    report_type="near_miss",
    model=NearMiss,
    prefix="/near-miss-workflow",
    tag="Near Miss Workflow",
    create_schema=NearMissReport,
    build_row=_build_row,
    detail_fields=["potential_consequence", "underlying_cause", "hazard_id"],
    # near_misses names its timestamp column event_date_time
    observed_at_field="event_date_time",
)
