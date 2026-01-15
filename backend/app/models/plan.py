from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field


class PlanVersionBase(BaseModel):
    version: int
    itinerary: dict[str, Any]  # Flexible structure for trip plan
    created_by: Optional[str] = None  # 'agent' or user_id


class PlanVersionCreate(PlanVersionBase):
    pass


class PlanVersionInDB(PlanVersionBase):
    id: Optional[str] = Field(default=None, alias="_id")
    trip_id: Optional[str] = Field(default=None, alias="tripId")
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


class PlanVersion(PlanVersionBase):
    id: str
    trip_id: str
    created_at: datetime

    class Config:
        from_attributes = True
