from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from app.models.base import Base
from app.models.report_workflow_mixin import ReportWorkflowMixin


class RiskReport(Base, ReportWorkflowMixin):
    """A worker-raised risk / unsafe condition.

    Distinct from the `hazards` table, which is an organisation-wide hazard *catalog*
    (hazard_name, category, probability) that the website reads. A risk report is one
    worker's field observation and optionally points at a catalog hazard via hazard_id.
    """

    __tablename__ = "risk_reports"

    organisation_id = Column(Integer, ForeignKey("organisation.id"), nullable=True, index=True)
    report_date = Column(Date)
    observed_date_time = Column(DateTime)
    location_station_id = Column(Integer, ForeignKey("working_stations.id"), nullable=True)

    hazard_id = Column(Integer, ForeignKey("hazards.id"), nullable=True)
    risk_title = Column(String(255))
    risk_category = Column(String(100))
    description = Column(Text)

    likelihood = Column(String(50))
    consequence = Column(String(50))
    risk_score = Column(Integer)  # likelihood x consequence, 1-25
    existing_controls = Column(Text)
    suggested_controls = Column(Text)

    reported_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
