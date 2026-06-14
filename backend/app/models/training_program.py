from sqlalchemy import Column, Integer, String
from app.models.base import Base


class TrainingProgram(Base):
    __tablename__ = "training_programs"

    training_name = Column(String(255), nullable=False)
    duration_hours = Column(Integer)
    frequency = Column(String(50))
    certification = Column(String(10))
    expiry_months = Column(Integer)
