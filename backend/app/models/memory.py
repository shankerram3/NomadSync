from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class MemoryField(BaseModel):
    value: Optional[str] = None
    confidence: int = Field(default=0, ge=0, le=100)
    sources: List[str] = Field(default_factory=list)


class TripMemoryBase(BaseModel):
    destination: Optional[MemoryField] = None
    dates: Optional[MemoryField] = None
    budget: Optional[MemoryField] = None
    pace: Optional[MemoryField] = None
    duration: Optional[MemoryField] = None


class TripMemoryUpdate(TripMemoryBase):
    pass


class TripMemoryInDB(TripMemoryBase):
    id: Optional[str] = Field(default=None, alias="_id")
    trip_id: Optional[str] = Field(default=None, alias="tripId")
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


class TripMemory(TripMemoryBase):
    id: str
    trip_id: str
    updated_at: datetime

    class Config:
        from_attributes = True
