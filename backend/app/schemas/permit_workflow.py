"""Request/response schemas for the Permit to Work workflow (flow 6).

Worker raises → Supervisor acknowledges → Manager approves / rejects & monitors →
Auditor verifies the permit is valid and displayed on site.

Kept separate from schemas/permit_to_work.py (the website's CRUD contract) so changing
the app workflow can never alter the website's permit shape.
"""
from datetime import date, datetime, time
from typing import List, Optional

from pydantic import BaseModel, Field


# ══════════════════════════════════════════════════════════════════════════════
# WORKER — raise a permit request
# ══════════════════════════════════════════════════════════════════════════════
class PermitRequest(BaseModel):
    permit_type_id: Optional[int] = None
    permit_type: Optional[str] = None  # name, when the app does not know the id
    work_description: Optional[str] = None
    location: Optional[str] = None
    location_station_id: Optional[int] = None
    date_issued: Optional[date] = None
    time_issued: Optional[time] = None
    duration_requested_hours: Optional[int] = None
    number_of_workers: Optional[int] = None
    validity_start: Optional[datetime] = None
    validity_end: Optional[datetime] = None


# ══════════════════════════════════════════════════════════════════════════════
# SUPERVISOR / MANAGER / AUDITOR — actions
# ══════════════════════════════════════════════════════════════════════════════
class PermitAcknowledge(BaseModel):
    supervisor_notes: Optional[str] = None


class PermitApprove(BaseModel):
    validity_start: Optional[datetime] = None
    validity_end: Optional[datetime] = None
    notes: Optional[str] = None


class PermitReject(BaseModel):
    rejection_reason: str = Field(..., min_length=1)


class PermitVerify(BaseModel):
    verification_result: str = Field(..., description="valid | invalid | not_displayed")
    verification_notes: Optional[str] = None


# ══════════════════════════════════════════════════════════════════════════════
# RESPONSES
# ══════════════════════════════════════════════════════════════════════════════
class PermitWorkflowResponse(BaseModel):
    id: int
    permit_ref: Optional[str] = None
    permit_type_id: Optional[int] = None
    workflow_status: Optional[str] = None
    status: Optional[str] = None
    work_description: Optional[str] = None
    location_station_id: Optional[int] = None
    duration_requested_hours: Optional[int] = None
    number_of_workers: Optional[int] = None
    validity_start: Optional[datetime] = None
    validity_end: Optional[datetime] = None

    requested_by: Optional[int] = None
    requested_at: Optional[datetime] = None
    acknowledged_by: Optional[int] = None
    acknowledged_at: Optional[datetime] = None
    supervisor_notes: Optional[str] = None
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    auditor_verified_by: Optional[int] = None
    auditor_verified_at: Optional[datetime] = None
    verification_result: Optional[str] = None
    verification_notes: Optional[str] = None

    model_config = {"from_attributes": True}


class PermitListItem(BaseModel):
    id: int
    permit_ref: Optional[str] = None
    permit_type_id: Optional[int] = None
    workflow_status: Optional[str] = None
    status: Optional[str] = None
    work_description: Optional[str] = None
    location_station_id: Optional[int] = None
    requested_by: Optional[int] = None
    requested_at: Optional[datetime] = None
    validity_end: Optional[datetime] = None

    model_config = {"from_attributes": True}
