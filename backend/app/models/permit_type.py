from sqlalchemy import Column, Integer, String
from app.models.base import Base


class PermitType(Base):
    __tablename__ = "permit_types"

    permit_type_name = Column(String(255), nullable=False)
    risk_level = Column(String(50))
    validity_period_hours = Column(Integer)
    concurrent_limit = Column(Integer)
