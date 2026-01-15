from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ConflictVote(BaseModel):
    user_id: str = Field(alias="userId")
    at: Optional[datetime] = None

    class Config:
        populate_by_name = True


class ConflictOption(BaseModel):
    key: str  # 'a', 'b', etc.
    title: str
    description: Optional[str] = None
    votes: List[ConflictVote] = Field(default_factory=list)


class ConflictBase(BaseModel):
    options: List[ConflictOption]


class ConflictCreate(ConflictBase):
    message_id: str


class ConflictInDB(ConflictBase):
    id: Optional[str] = Field(default=None, alias="_id")
    trip_id: Optional[str] = Field(default=None, alias="tripId")
    message_id: Optional[str] = Field(default=None, alias="messageId")
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


class Conflict(ConflictBase):
    id: str
    trip_id: str
    message_id: str
    created_at: datetime

    class Config:
        from_attributes = True
