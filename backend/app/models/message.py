from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class MessageBase(BaseModel):
    type: str = Field(..., pattern="^(human|agent|conflict)$")
    content: str
    summary: Optional[str] = None
    questions: Optional[List[str]] = None
    has_view_plan: bool = False


class MessageCreate(MessageBase):
    type: str = Field(default="human", pattern="^(human)$")  # Only humans can create


class MessageInDB(MessageBase):
    id: Optional[str] = Field(default=None, alias="_id")
    trip_id: Optional[str] = Field(default=None, alias="tripId")
    author_id: Optional[str] = Field(default=None, alias="authorId")
    conflict_id: Optional[str] = Field(default=None, alias="conflictId")
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


class Message(MessageBase):
    id: str
    trip_id: str
    author_id: Optional[str] = None
    conflict_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
