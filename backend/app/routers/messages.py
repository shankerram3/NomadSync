from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId
from app.database import get_database
from app.models.message import MessageCreate, Message
from app.utils.auth import get_current_user_id
from app.utils.trip_permissions import check_trip_access





router = APIRouter(prefix="/trips/{trip_id}/messages", tags=["messages"])




@router.get("", response_model=List[dict])
async def get_messages(
    trip_id: str,
    limit: int = Query(default=200, le=500),
    cursor: Optional[str] = None,
    user_id: str = Depends(get_current_user_id)
):
    """Get messages for a trip"""
    await check_trip_access(trip_id, user_id)
    
    db = get_database()
    query = {"tripId": ObjectId(trip_id)}
    
    if cursor:
        try:
            cursor_time = ObjectId(cursor)
            query["_id"] = {"$gt": cursor_time}
        except:
            pass
    
    messages = await db.messages.find(query).sort("createdAt", 1).limit(limit).to_list(limit)
    
    return [
        {
            "id": str(msg["_id"]),
            "trip_id": str(msg["tripId"]),
            "author_id": str(msg["authorId"]) if msg.get("authorId") else None,
            "type": msg["type"],
            "content": msg["content"],
            "summary": msg.get("summary"),
            "questions": msg.get("questions"),
            "conflict_id": str(msg["conflictId"]) if msg.get("conflictId") else None,
            "has_view_plan": msg.get("hasViewPlan", False),
            "created_at": msg.get("createdAt"),
        }
        for msg in messages
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_message(
    trip_id: str,
    message_data: MessageCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new message"""
    await check_trip_access(trip_id, user_id)
    
    db = get_database()
    
    now = datetime.utcnow()
    message_doc = {
        "tripId": ObjectId(trip_id),
        "authorId": ObjectId(user_id),
        "type": message_data.type,
        "content": message_data.content,
        "summary": message_data.summary,
        "questions": message_data.questions,
        "hasViewPlan": message_data.has_view_plan,
        "createdAt": now,
    }
    
    result = await db.messages.insert_one(message_doc)
    message_doc["_id"] = result.inserted_id
    
    # Update trip's updated_at
    await db.trips.update_one(
        {"_id": ObjectId(trip_id)},
        {"$set": {"updatedAt": now}}
    )
    
    return {
        "id": str(message_doc["_id"]),
        "trip_id": trip_id,
        "author_id": user_id,
        "type": message_doc["type"],
        "content": message_doc["content"],
        "summary": message_doc.get("summary"),
        "questions": message_doc.get("questions"),
        "has_view_plan": message_doc.get("hasViewPlan", False),
        "created_at": now,
    }
