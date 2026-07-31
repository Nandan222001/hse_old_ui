"""Request/response schemas shared by the near-miss, unsafe-act and risk workflows.

Mirrors app/schemas/incident_workflow.py. Kept separate from it so that changing one
report type's contract can never alter the incident contract the website depends on.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ══════════════════════════════════════════════════════════════════════════════
# WORKER — submission
# ══════════════════════════════════════════════════════════════════════════════
class WorkerReportBase(BaseModel):
    """Fields every worker report form sends, whatever the type."""

    description: str = Field(..., min_length=1)
    severity: str = "medium"
    location: Optional[str] = None
    location_station_id: Optional[int] = None
    observed_date_time: Optional[datetime] = None
    hazard_still_present: Optional[str] = None
    witnesses: Optional[List[str]] = None
    photos: Optional[List[str]] = None
    gps_latitude: Optional[str] = None
    gps_longitude: Optional[str] = None


class NearMissReport(WorkerReportBase):
    potential_consequence: Optional[str] = None
    underlying_cause: Optional[str] = None
    hazard_id: Optional[int] = None
    control_failure: Optional[str] = None
    capa_escalation: Optional[str] = None


class UnsafeActReport(WorkerReportBase):
    act_type: Optional[str] = None
    person_observed: Optional[str] = None
    rule_violated: Optional[str] = None
    corrective_advice_given: Optional[str] = None


class RiskReportCreate(WorkerReportBase):
    risk_title: Optional[str] = None
    risk_category: Optional[str] = None
    likelihood: Optional[str] = None
    consequence: Optional[str] = None
    risk_score: Optional[int] = None
    existing_controls: Optional[str] = None
    suggested_controls: Optional[str] = None
    hazard_id: Optional[int] = None


# ══════════════════════════════════════════════════════════════════════════════
# SUPERVISOR — acknowledge / investigate / escalate
# ══════════════════════════════════════════════════════════════════════════════
class SupervisorAcknowledgeReport(BaseModel):
    notes: Optional[str] = None


class SupervisorInvestigateReport(BaseModel):
    root_cause: Optional[str] = None
    five_why_analysis: Optional[Dict[str, Any]] = None
    immediate_actions_taken: Optional[str] = None
    supervisor_signature: Optional[str] = None
    severity: Optional[str] = None


class SupervisorEscalateReport(BaseModel):
    escalation_reason: str = Field(..., min_length=1)
    escalated_to_manager_id: Optional[int] = None


# ══════════════════════════════════════════════════════════════════════════════
# MANAGER — approve / close
# ══════════════════════════════════════════════════════════════════════════════
class ManagerApproveReport(BaseModel):
    approved: bool = True
    notes: Optional[str] = None


class ManagerCloseReport(BaseModel):
    closure_notes: Optional[str] = None
    lessons_learned: Optional[str] = None
    manager_signature: Optional[str] = None


# ══════════════════════════════════════════════════════════════════════════════
# RESPONSES
# ══════════════════════════════════════════════════════════════════════════════
class ReportWorkflowResponse(BaseModel):
    """Full record. Type-specific columns ride along in `details` so one response
    model can serve all three workflows without leaking another type's fields."""

    id: int
    report_type: str
    workflow_status: Optional[str] = None
    severity: Optional[str] = None
    description: Optional[str] = None
    location_station_id: Optional[int] = None
    reported_by: Optional[int] = None

    reported_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None
    investigation_completed_at: Optional[datetime] = None
    escalated_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

    root_cause: Optional[str] = None
    immediate_actions_taken: Optional[str] = None
    escalation_reason: Optional[str] = None
    closure_notes: Optional[str] = None

    details: Dict[str, Any] = Field(default_factory=dict)

    model_config = {"from_attributes": True}


class ReportListItem(BaseModel):
    id: int
    report_type: str
    workflow_status: Optional[str] = None
    severity: Optional[str] = None
    description: Optional[str] = None
    location_station_id: Optional[int] = None
    reported_by: Optional[int] = None
    reported_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
