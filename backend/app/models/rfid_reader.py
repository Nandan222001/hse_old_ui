from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from app.models.base import Base


class RfidReader(Base):
    __tablename__ = "rfid_readers"

    organisation_id = Column(Integer, ForeignKey("organisation.id"), nullable=True, index=True)
    gate_name       = Column(String(255), nullable=False)
    site_id         = Column(Integer, ForeignKey("sites.id"), nullable=True)
    zone_id         = Column(Integer, ForeignKey("working_stations.id"), nullable=True)
    reader_type     = Column(String(50))
    last_seen       = Column(DateTime)
    status          = Column(String(20), nullable=False, default="Active")
