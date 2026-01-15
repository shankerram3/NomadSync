from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from app.database import get_database
from app.models.conflict import ConflictCreate, Conflict
from app.utils.auth import get_current_user_id
from app.utils.trip_permissions import check_trip_access

router = APIRouter(prefix="/trips/{trip_id}/conflicts", tags=["conflicts"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_conflict(
    trip_id: str,
    conflict_data: ConflictCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create a conflict (typically by agent)"""
    await check_trip_access(trip_id, user_id)
    
    db = get_database()
    
    # Verify message exists and belongs to trip
    message = await db.messages.find_one({
        "_id": ObjectId(conflict_data.message_id),
        "tripId": ObjectId(trip_id)
    })
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    
    now = datetime.utcnow()
    conflict_doc = {
        "tripId": ObjectId(trip_id),
        "messageId": ObjectId(conflict_data.message_id),
        "options": [opt.dict() for opt in conflict_data.options],
        "createdAt": now,
    }
    
    result = await db.conflicts.insert_one(conflict_doc)
    conflict_doc["_id"] = result.inserted_id
    
    # Update message with conflict reference
    await db.messages.update_one(
        {"_id": ObjectId(conflict_data.message_id)},
        {"$set": {"conflictId": conflict_doc["_id"]}}
    )
    
    return {
        "id": str(conflict_doc["_id"]),
        "trip_id": trip_id,
        "message_id": conflict_data.message_id,
        "options": conflict_doc["options"],
        "created_at": conflict_doc.get("createdAt"),
    }


@router.post("/{conflict_id}/vote")
async def vote_on_conflict(
    trip_id: str,
    conflict_id: str,
    vote_data: dict,
    user_id: str = Depends(get_current_user_id)
):
    option_key = vote_data.get("option_key") or vote_data.get("key")
    """Vote on a conflict option"""
    await check_trip_access(trip_id, user_id)
    
    db = get_database()
    
    conflict = await db.conflicts.find_one({
        "_id": ObjectId(conflict_id),
        "tripId": ObjectId(trip_id)
    })
    if not conflict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conflict not found")
    
    # Check if option exists
    option_index = next(
        (i for i, opt in enumerate(conflict["options"]) if opt["key"] == option_key),
        None
    )
    if option_index is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Option not found")
    
    user_obj_id = ObjectId(user_id)
    
    # Check if user already voted (remove old vote)
    for opt in conflict["options"]:
        opt["votes"] = [v for v in opt.get("votes", []) if v.get("userId") != user_obj_id]
    
    # Add new vote
    conflict["options"][option_index]["votes"].append({
        "userId": user_obj_id,
        "at": datetime.utcnow()
    })
    
    await db.conflicts.update_one(
        {"_id": ObjectId(conflict_id)},
        {"$set": {"options": conflict["options"]}}
    )
    
    return {"message": "Vote recorded"}


@router.get("/{conflict_id}")
async def get_conflict(
    trip_id: str,
    conflict_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific conflict"""
    await check_trip_access(trip_id, user_id)
    
    db = get_database()
    conflict = await db.conflicts.find_one({
        "_id": ObjectId(conflict_id),
        "tripId": ObjectId(trip_id)
    })
    
    if not conflict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conflict not found")
    
    return {
        "id": str(conflict["_id"]),
        "trip_id": trip_id,
        "message_id": str(conflict["messageId"]),
        "options": conflict["options"],
        "created_at": conflict.get("createdAt"),
    }
