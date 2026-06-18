from sqlalchemy import Column, String, Text, Integer, DateTime, Enum, ForeignKey
from app.models.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    title             = Column(String(255), nullable=False)
    message           = Column(Text, nullable=False)
    type              = Column(Enum("info","success","warning","maintenance","announcement", name="notif_type"), nullable=False, default="info")
    target_type       = Column(Enum("all","specific", name="notif_target"), nullable=False, default="all")
    target_invite_id  = Column(Integer, ForeignKey("organisation_invite.id", ondelete="SET NULL"), nullable=True)
    status            = Column(Enum("draft","sent","failed", name="notif_status"), nullable=False, default="draft")
    email_sent_count  = Column(Integer, nullable=False, default=0)
    sent_at           = Column(DateTime, nullable=True)
