from typing import Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId
from app.database import get_database
from app.models.plan import PlanVersionCreate, PlanVersion
from app.utils.auth import get_current_user_id
from app.utils.trip_permissions import check_trip_access

router = APIRouter(prefix="/trips/{trip_id}/plan", tags=["plan"])


@router.get("")
async def get_plan(
    trip_id: str,
    version: Optional[int] = Query(default=None, description="Plan version (default: latest)"),
    user_id: str = Depends(get_current_user_id)
):
    """Get trip plan (latest or specific version)"""
    await check_trip_access(trip_id, user_id)
    
    db = get_database()
    query = {"tripId": ObjectId(trip_id)}
    
    if version:
        query["version"] = version
    else:
        # Get latest version
        latest = await db.plan_versions.find_one(
            {"tripId": ObjectId(trip_id)},
            sort=[("version", -1)]
        )
        if not latest:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No plan found")
        return {
            "id": str(latest["_id"]),
            "trip_id": trip_id,
            "version": latest["version"],
            "itinerary": latest["itinerary"],
            "created_by": latest.get("createdBy"),
            "created_at": latest.get("createdAt"),
        }
    
    plan = await db.plan_versions.find_one(query)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan version not found")
    
    return {
        "id": str(plan["_id"]),
        "trip_id": trip_id,
        "version": plan["version"],
        "itinerary": plan["itinerary"],
        "created_by": plan.get("createdBy"),
        "created_at": plan.get("createdAt"),
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_plan_version(
    trip_id: str,
    plan_data: PlanVersionCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new plan version"""
    await check_trip_access(trip_id, user_id)
    
    db = get_database()
    
    # Get latest version to increment
    latest = await db.plan_versions.find_one(
        {"tripId": ObjectId(trip_id)},
        sort=[("version", -1)]
    )
    next_version = (latest["version"] + 1) if latest else 1
    now = datetime.utcnow()
    
    plan_doc = {
        "tripId": ObjectId(trip_id),
        "version": next_version,
        "itinerary": plan_data.itinerary,
        "createdBy": plan_data.created_by or user_id,
        "createdAt": now,
    }
    
    result = await db.plan_versions.insert_one(plan_doc)
    plan_doc["_id"] = result.inserted_id
    
    return {
        "id": str(plan_doc["_id"]),
        "trip_id": trip_id,
        "version": plan_doc["version"],
        "itinerary": plan_doc["itinerary"],
        "created_by": plan_doc.get("createdBy"),
        "created_at": now,
    }


@router.get("/versions")
async def list_plan_versions(
    trip_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """List all plan versions for a trip"""
    await check_trip_access(trip_id, user_id)
    
    db = get_database()
    versions = await db.plan_versions.find(
        {"tripId": ObjectId(trip_id)}
    ).sort("version", -1).to_list(100)
    
    return [
        {
            "id": str(v["_id"]),
            "version": v["version"],
            "created_by": v.get("createdBy"),
            "created_at": v.get("createdAt"),
        }
        for v in versions
    ]
