from __future__ import annotations
from typing import Optional, Any
from datetime import date, datetime, time
from decimal import Decimal
from pydantic import BaseModel
from app.schemas.base import TimestampMixin


class EmployeeBase(BaseModel):
    full_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    employment_type: Optional[str] = None
    employment_start_date: Optional[date] = None
    role_id: Optional[int] = None
    department_id: Optional[int] = None
    shift_pattern: Optional[str] = None
    manager_id: Optional[int] = None
    induction_date: Optional[date] = None
    active_status: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    employment_type: Optional[str] = None
    employment_start_date: Optional[date] = None
    role_id: Optional[int] = None
    department_id: Optional[int] = None
    shift_pattern: Optional[str] = None
    manager_id: Optional[int] = None
    induction_date: Optional[date] = None
    active_status: Optional[str] = None


class EmployeeResponse(EmployeeBase, TimestampMixin):
    id: int

    model_config = {"from_attributes": True}
