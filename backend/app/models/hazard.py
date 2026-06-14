from sqlalchemy import Column, ForeignKey, Integer, String
from app.models.base import Base


class Hazard(Base):
    __tablename__ = "hazards"

    category_id = Column(Integer, ForeignKey("hazard_categories.id"))
    hazard_name = Column(String(255), nullable=False)
    severity = Column(String(50))
    probability = Column(String(50))
