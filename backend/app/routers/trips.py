from typing import List
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from app.database import get_database
from app.models.trip import TripCreate, Trip
from app.utils.auth import get_current_user_id
from app.utils.trip_permissions import check_trip_access

router = APIRouter(prefix="/trips", tags=["trips"])


@router.get("", response_model=List[dict])
async def get_trips(user_id: str = Depends(get_current_user_id)):
    """Get all trips for current user"""
    db = get_database()
    user_obj_id = ObjectId(user_id)
    
    trips = await db.trips.find({"members.userId": user_obj_id}).sort("updatedAt", -1).to_list(100)
    
    return [
        {
            "id": str(trip["_id"]),
            "title": trip["title"],
            "destination": trip.get("destination"),
            "dates": trip.get("dates"),
            "status": trip.get("status", "draft"),
            "readiness": trip.get("readiness", 0),
            "cover_image": trip.get("cover_image"),
            "members": trip.get("members", []),
            "created_at": trip.get("created_at"),
            "updated_at": trip.get("updated_at"),
        }
        for trip in trips
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_trip(trip_data: TripCreate, user_id: str = Depends(get_current_user_id)):
    """Create a new trip"""
    db = get_database()
    
    now = datetime.utcnow()
    trip_doc = {
        "title": trip_data.title,
        "destination": trip_data.destination,
        "dates": trip_data.dates.dict() if trip_data.dates else None,
        "status": trip_data.status,
        "readiness": trip_data.readiness,
        "cover_image": trip_data.cover_image,
        "members": [{"userId": ObjectId(user_id), "role": "owner"}],
        "createdAt": now,
        "updatedAt": now,
    }
    
    result = await db.trips.insert_one(trip_doc)
    trip_doc["_id"] = result.inserted_id
    
    return {
        "id": str(trip_doc["_id"]),
        **{k: v for k, v in trip_doc.items() if k != "_id"}
    }


@router.get("/{trip_id}")
async def get_trip(trip_id: str, user_id: str = Depends(get_current_user_id)):
    """Get a specific trip"""
    trip = await check_trip_access(trip_id, user_id)
    
    return {
        "id": str(trip["_id"]),
        "title": trip["title"],
        "destination": trip.get("destination"),
        "dates": trip.get("dates"),
        "status": trip.get("status", "draft"),
        "readiness": trip.get("readiness", 0),
        "cover_image": trip.get("cover_image"),
        "members": trip.get("members", []),
        "created_at": trip.get("created_at"),
        "updated_at": trip.get("updated_at"),
    }


@router.patch("/{trip_id}")
async def update_trip(
    trip_id: str,
    updates: dict,
    user_id: str = Depends(get_current_user_id)
):
    """Update a trip"""
    await check_trip_access(trip_id, user_id, require_role="owner")
    
    db = get_database()
    
    # Clean updates
    allowed_fields = ["title", "destination", "dates", "status", "readiness", "cover_image"]
    update_doc = {k: v for k, v in updates.items() if k in allowed_fields}
    
    if not update_doc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No valid fields to update")
    
    result = await db.trips.update_one(
        {"_id": ObjectId(trip_id)},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    
    updated = await db.trips.find_one({"_id": ObjectId(trip_id)})
    return {
        "id": str(updated["_id"]),
        "title": updated["title"],
        "destination": updated.get("destination"),
        "dates": updated.get("dates"),
        "status": updated.get("status", "draft"),
        "readiness": updated.get("readiness", 0),
        "cover_image": updated.get("cover_image"),
        "members": updated.get("members", []),
        "created_at": updated.get("created_at"),
        "updated_at": updated.get("updated_at"),
    }


@router.post("/{trip_id}/invite")
async def invite_member(
    trip_id: str,
    email: str,
    role: str = "editor",
    user_id: str = Depends(get_current_user_id)
):
    """Invite a user to a trip"""
    await check_trip_access(trip_id, user_id)
    
    db = get_database()
    
    # Find user by email
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    user_obj_id = user["_id"]
    
    # Check if already a member
    trip = await db.trips.find_one({"_id": ObjectId(trip_id)})
    if any(m.get("userId") == user_obj_id for m in trip.get("members", [])):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already a member")
    
    # Add member
    await db.trips.update_one(
        {"_id": ObjectId(trip_id)},
        {"$push": {"members": {"userId": user_obj_id, "role": role}}}
    )
    
    return {"message": "User invited successfully"}
