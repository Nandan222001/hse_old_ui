from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String
from app.models.base import Base


class EdgeDevice(Base):
    __tablename__ = "edge_devices"

    organisation_id  = Column(Integer, ForeignKey("organisation.id"), nullable=True, index=True)
    device_name      = Column(String(255), nullable=False)
    device_type      = Column(String(100))
    site_id          = Column(Integer, ForeignKey("sites.id"), nullable=True)
    zone_id          = Column(Integer, ForeignKey("working_stations.id"), nullable=True)
    firmware_version = Column(String(50))
    ai_model_version = Column(String(50))
    last_seen        = Column(DateTime)
    status           = Column(String(20), nullable=False, default="Online")
    cpu_usage        = Column(Numeric(5, 2))
    gpu_usage        = Column(Numeric(5, 2))
    memory_usage     = Column(Numeric(5, 2))
