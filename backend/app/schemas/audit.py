"""Request/response schemas for the auditor workflow (assign → submit findings)."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ChecklistItemIn(BaseModel):
    """One line of the audit checklist as submitted from the mobile app."""
    id: Optional[int] = None
    title: Optional[str] = None
    question: Optional[str] = None
    response: Optional[str] = None       # pass | fail | na | null
    remarks: Optional[str] = None
    photo_attached: bool = False


class AuditCreate(BaseModel):
    """Manager/admin schedules an audit and assigns it to an auditor."""
    title: str = Field(..., min_length=1)
    checklist_type: Optional[str] = None
    site_id: Optional[int] = None
    site_name: Optional[str] = None
    department: Optional[str] = None
    auditor_id: Optional[int] = None
    scheduled_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    priority: str = "Med"
    # Checklist questions the auditor must answer. If omitted, a default template
    # is seeded from the checklist_type so the mobile app always has items to show.
    items: Optional[List[ChecklistItemIn]] = None


class AuditSubmit(BaseModel):
    """Auditor submits the completed checklist. compliance_score is derived if omitted."""
    items: List[ChecklistItemIn] = Field(default_factory=list)
    compliance_score: Optional[int] = None
    notes: Optional[str] = None


class AuditResponse(BaseModel):
    id: int
    organisation_id: Optional[int] = None
    title: str
    checklist_type: Optional[str] = None
    site_id: Optional[int] = None
    site_name: Optional[str] = None
    department: Optional[str] = None
    auditor_id: Optional[int] = None
    scheduled_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    status: str
    priority: Optional[str] = None
    progress: Optional[int] = None
    compliance_score: Optional[int] = None
    findings: List[ChecklistItemIn] = Field(default_factory=list)
    submitted_at: Optional[datetime] = None

    class Config:
        from_attributes = True
