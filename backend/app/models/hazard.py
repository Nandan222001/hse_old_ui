from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from app.models.base import Base


class Hazard(Base):
    __tablename__ = "hazards"

    organisation_id = Column(Integer, ForeignKey("organisation.id"), nullable=True, index=True)
    category_id = Column(Integer, ForeignKey("hazard_categories.id"))
    hazard_name = Column(String(255), nullable=False)
    severity = Column(String(50))
    probability = Column(String(50))

    # ── Hazard register lifecycle (migration 031) ────────────────────────────
    # Additive: the website reads hazard_name/severity/probability as catalog data;
    # these columns let a worker log a field hazard and carry it through control.
    register_status = Column(String(50), default="open")  # open | under_review | controlled | closed
    description = Column(Text, nullable=True)
    location_station_id = Column(Integer, ForeignKey("working_stations.id"), nullable=True)
    logged_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    logged_at = Column(DateTime, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(Text, nullable=True)
    controls = Column(Text, nullable=True)
    auditor_verified_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    auditor_verified_at = Column(DateTime, nullable=True)
    verification_notes = Column(Text, nullable=True)
    gps_latitude = Column(String(32), nullable=True)
    gps_longitude = Column(String(32), nullable=True)
