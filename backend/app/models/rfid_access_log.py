from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from app.models.base import Base


class RfidAccessLog(Base):
    __tablename__ = "rfid_access_logs"

    organisation_id = Column(Integer, ForeignKey("organisation.id"), nullable=True, index=True)
    reader_id       = Column(Integer, ForeignKey("rfid_readers.id"), nullable=False)
    employee_id     = Column(Integer, ForeignKey("employees.id"), nullable=True)
    entry_type      = Column(String(10), nullable=False, default="Entry")
    result          = Column(String(10), nullable=False, default="Allowed")
    logged_at       = Column(DateTime, nullable=False, server_default=func.now())
