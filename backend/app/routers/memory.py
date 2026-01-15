from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from app.database import get_database
from app.models.memory import TripMemoryUpdate, TripMemory
from app.utils.auth import get_current_user_id
from app.utils.trip_permissions import check_trip_access

router = APIRouter(prefix="/trips/{trip_id}/memory", tags=["memory"])


@router.get("")
async def get_memory(
    trip_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get trip memory"""
    await check_trip_access(trip_id, user_id)
    
    db = get_database()
    memory = await db.trip_memory.find_one({"tripId": ObjectId(trip_id)})
    
    if not memory:
        # Return empty memory if not found
        return {
            "id": None,
            "trip_id": trip_id,
            "destination": None,
            "dates": None,
            "budget": None,
            "pace": None,
            "duration": None,
            "updated_at": None,
        }
    
    return {
        "id": str(memory["_id"]),
        "trip_id": trip_id,
        "destination": memory.get("destination"),
        "dates": memory.get("dates"),
        "budget": memory.get("budget"),
        "pace": memory.get("pace"),
        "duration": memory.get("duration"),
        "updated_at": memory.get("updatedAt"),
    }


@router.patch("")
async def update_memory(
    trip_id: str,
    memory_data: TripMemoryUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update trip memory (typically by agent)"""
    await check_trip_access(trip_id, user_id)
    
    db = get_database()
    
    update_doc = {}
    if memory_data.destination:
        update_doc["destination"] = memory_data.destination.dict()
    if memory_data.dates:
        update_doc["dates"] = memory_data.dates.dict()
    if memory_data.budget:
        update_doc["budget"] = memory_data.budget.dict()
    if memory_data.pace:
        update_doc["pace"] = memory_data.pace.dict()
    if memory_data.duration:
        update_doc["duration"] = memory_data.duration.dict()
    
    if not update_doc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    
    update_doc["updatedAt"] = datetime.utcnow()
    
    result = await db.trip_memory.update_one(
        {"tripId": ObjectId(trip_id)},
        {"$set": update_doc},
        upsert=True
    )
    
    memory = await db.trip_memory.find_one({"tripId": ObjectId(trip_id)})
    
    return {
        "id": str(memory["_id"]),
        "trip_id": trip_id,
        "destination": memory.get("destination"),
        "dates": memory.get("dates"),
        "budget": memory.get("budget"),
        "pace": memory.get("pace"),
        "duration": memory.get("duration"),
        "updated_at": memory.get("updatedAt"),
    }
