from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from app.models.base import Base


class Audit(Base):
    """A scheduled safety/compliance audit assigned to an auditor.

    Mirrors the worker/supervisor report tables: org-scoped, assigned to a user,
    and carrying the submitted checklist findings so the result feeds the web
    Compliance section (audit readiness) the same way safety walks do.
    """
    __tablename__ = "audits"

    organisation_id = Column(Integer, ForeignKey("organisation.id"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    checklist_type = Column(String(120))
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True)
    site_name = Column(String(200))          # denormalised label for the mobile card
    department = Column(String(120))
    shift = Column(String(20), nullable=True)  # Morning | Afternoon | Night
    auditor_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    scheduled_date = Column(DateTime)
    due_date = Column(DateTime)
    status = Column(String(20), default="scheduled")   # scheduled | in_progress | completed | overdue
    priority = Column(String(10), default="Med")        # High | Med | Low
    progress = Column(Integer, default=0)               # 0-100
    compliance_score = Column(Integer)                  # 0-100, derived from pass ratio on submit
    findings_json = Column(Text)                        # JSON array of checklist items
    submitted_at = Column(DateTime)
