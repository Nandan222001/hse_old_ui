"""Request/response schemas for the Hazard register workflow (flow 5).

Worker/Supervisor logs a hazard → Supervisor/Manager reviews, updates or closes it as
it is controlled → Auditor verifies it is being managed during site audits.

Separate from schemas/hazard.py (the website's catalog CRUD) so the register workflow
cannot alter the catalog contract.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class HazardLog(BaseModel):
    """Worker/supervisor logs a field hazard into the register."""

    hazard_name: str = Field(..., min_length=1)
    category_id: Optional[int] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    probability: Optional[str] = None
    location: Optional[str] = None
    location_station_id: Optional[int] = None
    controls: Optional[str] = None
    gps_latitude: Optional[str] = None
    gps_longitude: Optional[str] = None


class HazardReview(BaseModel):
    """Supervisor/Manager moves a hazard through its control lifecycle."""

    register_status: Optional[str] = None  # open | under_review | controlled | closed
    review_notes: Optional[str] = None
    controls: Optional[str] = None
    severity: Optional[str] = None


class HazardVerify(BaseModel):
    """Auditor records that the hazard is being managed on site."""

    verification_notes: Optional[str] = None


class HazardVerifyControls(BaseModel):
    """Stage 06 VERIFY — did the permanent control hold?

    Distinct from HazardVerify above, which is the auditor's assurance check and
    gates nothing. This one moves the hazard between stages 05 and 07.
    """

    effective: bool = Field(..., description="Did the control work?")
    verification_notes: Optional[str] = Field(None, description="What was checked, and how")


class HazardRegisterResponse(BaseModel):
    id: int
    hazard_name: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    probability: Optional[str] = None
    register_status: Optional[str] = None
    location_station_id: Optional[int] = None
    controls: Optional[str] = None
    logged_by: Optional[int] = None
    logged_at: Optional[datetime] = None
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    auditor_verified_by: Optional[int] = None
    auditor_verified_at: Optional[datetime] = None
    verification_notes: Optional[str] = None

    # Position on the eight stages, derived from register_status by
    # workflow_stages.describe("hazard_register", ...) — never stored.
    stage: Optional[str] = None
    stage_number: Optional[int] = None
    stage_label: Optional[str] = None
    completed_stages: List[str] = Field(default_factory=list)
    total_stages: Optional[int] = None

    model_config = {"from_attributes": True}
