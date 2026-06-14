from sqlalchemy import Column, String, Text
from app.models.base import Base


class HazardCategory(Base):
    __tablename__ = "hazard_categories"

    category_name = Column(String(100), nullable=False)
    description = Column(Text)
