"""
Pydantic schemas for the role-based incident reporting workflow.

Flow: Worker reports → Supervisor acknowledges & investigates → Manager approves & closes
"""
from __future__ import annotations

from datetime import datetime, date
from decimal import Decimal
from typing import Any, List, Optional

from pydantic import BaseModel, Field


# ── Worker: Report Incident ───────────────────────────────────────────────────

class WorkerIncidentReport(BaseModel):
    """What the worker submits when reporting an incident."""
    incident_date_time: datetime
    location_station_id: Optional[int] = None
    incident_type: str = Field(..., description="Injury | Near Miss | Unsafe Act | Unsafe Condition | Property Damage | Environmental Spill")
    severity: str = Field(..., description="Minor | Moderate | Serious | Critical")
    description: str = Field(..., min_length=5)
    anyone_injured: str = Field(default="No", description="Yes | No")
    injured_person_name: Optional[str] = None
    injured_body_part: Optional[str] = None
    hazard_still_present: str = Field(default="No", description="Yes | No")
    witnesses_json: Optional[List[str]] = None
    evidence_json: Optional[List[str]] = None
    gps_latitude: Optional[Decimal] = None
    gps_longitude: Optional[Decimal] = None
    number_persons_involved: Optional[int] = None


# ── Supervisor: Acknowledge ───────────────────────────────────────────────────

class SupervisorAcknowledge(BaseModel):
    """Supervisor acknowledges the incident within 30 min SLA."""
    notes: Optional[str] = None


# ── Supervisor: Investigate ───────────────────────────────────────────────────

class SupervisorInvestigate(BaseModel):
    """Supervisor completes investigation with root cause analysis."""
    root_cause: str = Field(..., description="Root cause determined by 5-Why analysis")
    five_why_analysis: Optional[List[dict]] = Field(
        None, description='Array of steps: [{"why": "...", "answer": "..."}]'
    )
    immediate_cause: Optional[str] = None
    immediate_actions_taken: Optional[str] = None
    root_cause_category: Optional[str] = None
    severity_classification: str = Field(..., description="LTI | MTI | First Aid | Near Miss")
    days_away: Optional[int] = None
    # CAPA details (optional — can also be created separately)
    capa_description: Optional[str] = None
    capa_responsible_person_id: Optional[int] = None
    capa_due_date: Optional[date] = None
    # Escalate to manager?
    escalate: bool = Field(default=False, description="Set true to escalate to manager")
    escalation_reason: Optional[str] = None


# ── Supervisor: Escalate ──────────────────────────────────────────────────────

class SupervisorEscalate(BaseModel):
    """Explicitly escalate an incident to manager."""
    escalation_reason: str = Field(..., min_length=3)
    escalated_to_manager_id: Optional[int] = None


# ── Manager: Approve Investigation ───────────────────────────────────────────

class ManagerApproveInvestigation(BaseModel):
    """Manager approves or rejects the supervisor's investigation."""
    decision: str = Field(..., description="approved | rejected")
    notes: Optional[str] = None


# ── Manager: Close Incident ───────────────────────────────────────────────────

class ManagerCloseIncident(BaseModel):
    """Manager formally closes the incident."""
    closure_notes: Optional[str] = None
    regulatory_notified: str = Field(default="No", description="Yes | No")
    lessons_learned: Optional[str] = None
    communicated_to_teams: str = Field(default="No", description="Yes | No")


# ── Response Schemas ──────────────────────────────────────────────────────────

class IncidentWorkflowResponse(BaseModel):
    """Full incident response with workflow fields."""
    id: int
    organisation_id: Optional[int] = None
    report_date: Optional[date] = None
    incident_date_time: Optional[datetime] = None
    location_station_id: Optional[int] = None
    incident_type: Optional[str] = None
    severity: Optional[str] = None
    number_persons_involved: Optional[int] = None
    description: Optional[str] = None
    immediate_cause: Optional[str] = None
    root_cause: Optional[str] = None
    hazard_id: Optional[int] = None
    permit_active: Optional[str] = None
    control_failure: Optional[str] = None
    reported_by: Optional[int] = None
    investigation_status: Optional[str] = None
    capa_generated: Optional[str] = None
    days_away: Optional[int] = None
    root_cause_category: Optional[str] = None

    # Workflow
    workflow_status: Optional[str] = None
    assigned_supervisor_id: Optional[int] = None
    escalated_to_manager_id: Optional[int] = None
    escalation_reason: Optional[str] = None

    # Timestamps
    reported_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None
    investigation_started_at: Optional[datetime] = None
    investigation_completed_at: Optional[datetime] = None
    escalated_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # Manager closure
    closure_notes: Optional[str] = None
    regulatory_notified: Optional[str] = None
    lessons_learned: Optional[str] = None
    communicated_to_teams: Optional[str] = None
    manager_signature: Optional[str] = None

    # Worker extras
    anyone_injured: Optional[str] = None
    injured_person_name: Optional[str] = None
    injured_body_part: Optional[str] = None
    hazard_still_present: Optional[str] = None
    witnesses_json: Optional[Any] = None
    evidence_json: Optional[Any] = None
    gps_latitude: Optional[Decimal] = None
    gps_longitude: Optional[Decimal] = None

    # Supervisor investigation
    five_why_analysis: Optional[Any] = None
    immediate_actions_taken: Optional[str] = None
    supervisor_signature: Optional[str] = None
    severity_classification: Optional[str] = None

    model_config = {"from_attributes": True}


class IncidentListItem(BaseModel):
    """Lighter response for list views."""
    id: int
    incident_date_time: Optional[datetime] = None
    incident_type: Optional[str] = None
    severity: Optional[str] = None
    description: Optional[str] = None
    workflow_status: Optional[str] = None
    reported_by: Optional[int] = None
    reported_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None
    location_station_id: Optional[int] = None
    anyone_injured: Optional[str] = None
    severity_classification: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
