from sqlalchemy import Column, Integer, String
from app.models.base import Base


class Role(Base):
    __tablename__ = "roles"

    role_name = Column(String(100), nullable=False)
    job_category = Column(String(100))
    authority_level = Column(Integer)
    permit_authority = Column(String(10))
    safety_signatory = Column(String(10))
