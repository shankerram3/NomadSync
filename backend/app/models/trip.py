from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class TripMember(BaseModel):
    user_id: str = Field(alias="userId")
    role: str = Field(default="editor", pattern="^(owner|editor|viewer)$")

    class Config:
        populate_by_name = True


class TripDates(BaseModel):
    start: Optional[datetime] = None
    end: Optional[datetime] = None


class TripBase(BaseModel):
    title: str
    destination: Optional[str] = None
    dates: Optional[TripDates] = None
    status: str = Field(default="draft", pattern="^(draft|planned|booked)$")
    readiness: int = Field(default=0, ge=0, le=100)
    cover_image: Optional[str] = None


class TripCreate(TripBase):
    pass


class TripInDB(TripBase):
    id: Optional[str] = Field(default=None, alias="_id")
    members: List[TripMember] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


class Trip(TripBase):
    id: str
    members: List[dict]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
