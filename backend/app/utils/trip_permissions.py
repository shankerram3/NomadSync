from typing import Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.database import get_database


async def check_trip_access(trip_id: str, user_id: str, require_role: Optional[str] = None) -> dict:
    """Check if user has access to trip, optionally requiring a specific role"""
    db = get_database()
    trip = await db.trips.find_one({"_id": ObjectId(trip_id)})
    
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    
    user_obj_id = ObjectId(user_id)
    member = next(
        (m for m in trip.get("members", []) if m.get("userId") == user_obj_id),
        None
    )
    
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    if require_role and member.get("role") != require_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Requires {require_role} role"
        )
    
    return trip
