from sqlalchemy import Column, Date, ForeignKey, Integer, String
from app.models.base import Base


class CctvCamera(Base):
    __tablename__ = "cctv_cameras"

    organisation_id  = Column(Integer, ForeignKey("organisation.id"), nullable=True, index=True)
    camera_name      = Column(String(255), nullable=False)
    site_id          = Column(Integer, ForeignKey("sites.id"), nullable=True)
    zone_id          = Column(Integer, ForeignKey("working_stations.id"), nullable=True)
    ip_address       = Column(String(45))
    protocol         = Column(String(20))
    resolution       = Column(String(20))
    fps              = Column(Integer)
    installed_date   = Column(Date)
    last_maintenance = Column(Date)
    status           = Column(String(20), nullable=False, default="Active")
