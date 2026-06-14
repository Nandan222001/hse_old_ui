from sqlalchemy import Column, Integer, String
from app.models.base import Base


class Site(Base):
    __tablename__ = "sites"

    site_name = Column(String(255), nullable=False)
    address = Column(String(255))
    postcode = Column(String(20))
    city = Column(String(100))
    type = Column(String(100))
    operational_status = Column(String(50))
    number_of_working_stations = Column(Integer)
    capacity = Column(Integer)
    primary_products = Column(String(255))
    hazard_classification = Column(String(50))
