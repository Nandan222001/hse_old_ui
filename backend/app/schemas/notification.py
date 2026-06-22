from __future__ import annotations
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.schemas.base import TimestampMixin


class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str = "info"
    target_type: str = "all"
    target_invite_id: Optional[int] = None


class NotificationOut(TimestampMixin):
    id: int
    organisation_id: Optional[int]
    title: str
    message: str
    type: str
    target_type: str
    status: str
    sent_at: Optional[datetime]
    is_read: bool = False

    model_config = {"from_attributes": True}


class UnreadCountOut(BaseModel):
    count: int
