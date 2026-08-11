from sqlalchemy import Column, Date, ForeignKey, Integer, String, Text
from app.models.base import Base


class CapaAction(Base):
    __tablename__ = "capa_actions"

    organisation_id = Column(Integer, ForeignKey("organisation.id"), nullable=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    action_type = Column(String(100))
    description = Column(Text)
    root_cause_addressed = Column(String(255))
    responsible_person_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    due_date = Column(Date)
    status = Column(String(50))
    effectiveness_rating = Column(Integer)

    # ── WF-04 · priority matrix and due-date rules (migration 046) ────────────
    # priority_score/band answer "how important" (severity x systemic, 1-9).
    # capa_type answers "how fast" (P1 24h .. P5 90 days) and sets due_date.
    # The two are independent — see app.services.capa_priority.
    severity_potential = Column(Integer, nullable=True)   # 1-3
    systemic_risk = Column(Integer, nullable=True)        # 1-3
    priority_score = Column(Integer, nullable=True)       # 1-9
    priority_band = Column(String(20), nullable=True)     # Standard | High | Critical
    capa_type = Column(String(4), nullable=True)          # P1..P5
    capa_type_label = Column(String(20), nullable=True)
    target_hours = Column(Integer, nullable=True)
    evidence_required = Column(String(255), nullable=True)
    priority_explanation = Column(Text, nullable=True)
