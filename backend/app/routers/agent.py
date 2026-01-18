from typing import Any, Dict, Optional
from datetime import datetime
from bson import ObjectId

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agents import build_agent_graph
from app.config import settings
from app.database import get_database
from app.models.memory import MemoryField


router = APIRouter(prefix="/agents", tags=["agents"])


class AgentRequest(BaseModel):
    message: str
    trip_id: Optional[str] = None  # Trip ID for auto-updating memory
    trip_context: Optional[Dict[str, Any]] = None
    trip_memory: Optional[Dict[str, Any]] = None


class AgentResponse(BaseModel):
    clarification: Optional[str]
    response: Optional[str]
    intent: Optional[Dict[str, Any]]
    task_plan: Optional[Dict[str, Any]]
    completed_tasks: Dict[str, Any]


@router.post("/plan", response_model=AgentResponse)
async def run_agent_workflow(payload: AgentRequest) -> AgentResponse:
    if not settings.openai_api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured")

    graph = build_agent_graph()
    initial_state = {
        "user_message": payload.message,
        "trip_context": payload.trip_context or {},
        "trip_memory": payload.trip_memory or {},
        "intent": None,
        "task_plan": None,
        "clarification": None,
        "completed_tasks": {},
        "final_response": None,
    }

    final_state = await graph.ainvoke(initial_state)

    intent = final_state.get("intent")
    task_plan = final_state.get("task_plan")

    # Auto-update trip memory from intent if trip_id is provided
    if payload.trip_id and intent:
        # Use message text as a reference for sources (could be enhanced with actual message ID)
        await _update_memory_from_intent(payload.trip_id, intent, payload.message[:50])

    # Auto-generate plan from task execution if trip_id is provided and tasks completed
    completed_tasks = final_state.get("completed_tasks", {})
    if payload.trip_id and completed_tasks and intent:
        await _generate_plan_from_tasks(payload.trip_id, intent, completed_tasks)

    return AgentResponse(
        clarification=final_state.get("clarification"),
        response=final_state.get("final_response"),
        intent=intent.model_dump() if intent else None,
        task_plan=task_plan.model_dump() if task_plan else None,
        completed_tasks=final_state.get("completed_tasks", {}),
    )


async def _update_memory_from_intent(trip_id: str, intent: Any, message_ref: str):
    """Update trip memory from agent intent extraction"""
    try:
        db = get_database()
        memory_updates = {}
        
        # Update destination
        if intent.destinations and len(intent.destinations) > 0:
            destination_str = ", ".join(intent.destinations)
            memory_updates["destination"] = {
                "value": destination_str,
                "confidence": 80,  # Default confidence for new extractions
                "sources": [message_ref] if message_ref else []
            }
        
        # Update dates
        if intent.start_date or intent.end_date:
            dates_str = ""
            if intent.start_date and intent.end_date:
                dates_str = f"{intent.start_date} to {intent.end_date}"
            elif intent.start_date:
                dates_str = f"Starting {intent.start_date}"
            elif intent.end_date:
                dates_str = f"Ending {intent.end_date}"
            
            if dates_str:
                memory_updates["dates"] = {
                    "value": dates_str,
                    "confidence": 85,
                    "sources": [message_ref] if message_ref else []
                }
        
        # Update duration
        if intent.duration_days:
            memory_updates["duration"] = {
                "value": f"{intent.duration_days} days",
                "confidence": 80,
                "sources": [message_ref] if message_ref else []
            }
        
        # Update budget
        if intent.budget_total:
            memory_updates["budget"] = {
                "value": f"${intent.budget_total} total",
                "confidence": 75,
                "sources": [message_ref] if message_ref else []
            }
        elif intent.budget_per_person and intent.group_size:
            total = intent.budget_per_person * intent.group_size
            memory_updates["budget"] = {
                "value": f"${intent.budget_per_person} per person (${total} total)",
                "confidence": 75,
                "sources": [message_ref] if message_ref else []
            }
        
        # Update pace (from interests/constraints)
        if intent.interests:
            pace_hints = ["relaxed", "slow", "leisurely", "fast", "packed", "intensive"]
            pace_value = None
            for interest in intent.interests:
                interest_lower = interest.lower()
                if any(hint in interest_lower for hint in pace_hints):
                    pace_value = interest
                    break
            
            if not pace_value:
                # Default based on number of interests
                pace_value = "moderate" if len(intent.interests) <= 3 else "active"
            
            memory_updates["pace"] = {
                "value": pace_value,
                "confidence": 60,
                "sources": [message_ref] if message_ref else []
            }
        
        # Update memory in database if there are updates
        if memory_updates:
            memory_updates["updatedAt"] = datetime.utcnow()
            
            # Merge with existing memory, updating confidence and sources
            existing_memory = await db.trip_memory.find_one({"tripId": ObjectId(trip_id)})
            
            if existing_memory:
                # Merge updates, increasing confidence if value already exists
                for key, new_value in memory_updates.items():
                    if key == "updatedAt":
                        continue
                    existing_value = existing_memory.get(key)
                    if existing_value and existing_value.get("value") == new_value["value"]:
                        # Same value, increase confidence
                        new_value["confidence"] = min(100, existing_value.get("confidence", 0) + 10)
                        new_value["sources"] = list(set(existing_value.get("sources", []) + new_value["sources"]))
            
            await db.trip_memory.update_one(
                {"tripId": ObjectId(trip_id)},
                {"$set": memory_updates},
                upsert=True
            )
    except Exception as e:
        # Log error but don't fail the agent workflow
        print(f"Error updating memory from intent: {e}")


async def _generate_plan_from_tasks(trip_id: str, intent: Any, completed_tasks: Dict[str, Any]):
    """Generate a plan from agent task execution results"""
    try:
        db = get_database()
        
        # Only generate plan if itinerary tasks were completed
        has_itinerary_tasks = any(
            key.startswith("plan_day_") or key == "search_attractions"
            for key in completed_tasks.keys()
        )
        
        if not has_itinerary_tasks:
            return
        
        # Build itinerary structure from completed tasks
        itinerary: Dict[str, Any] = {}
        days = intent.duration_days or 1
        
        # Extract day plans from completed tasks
        for day in range(1, days + 1):
            day_key = f"plan_day_{day}"
            if day_key in completed_tasks:
                day_data = completed_tasks[day_key]
                if isinstance(day_data, dict) and "status" not in day_data:
                    itinerary[f"day_{day}"] = day_data
                else:
                    # Fallback: create basic day structure
                    itinerary[f"day_{day}"] = {
                        "title": f"Day {day}",
                        "activities": day_data.get("activities", []) if isinstance(day_data, dict) else [],
                        "cost": day_data.get("cost", "$0") if isinstance(day_data, dict) else "$0"
                    }
        
        # If no day plans, create a basic structure from attractions
        if not itinerary and "search_attractions" in completed_tasks:
            attractions_data = completed_tasks.get("search_attractions", {})
            if isinstance(attractions_data, dict):
                attractions = attractions_data.get("attractions", []) or []
                # Distribute attractions across days
                per_day = max(1, len(attractions) // days) if attractions else 0
                for day in range(1, days + 1):
                    start_idx = (day - 1) * per_day
                    day_attractions = attractions[start_idx:start_idx + per_day] if attractions else []
                    itinerary[f"day_{day}"] = {
                        "title": f"Day {day}",
                        "activities": [attr.get("name", str(attr)) if isinstance(attr, dict) else str(attr) for attr in day_attractions],
                        "cost": "$0"
                    }
        
        # Calculate budget breakdown if available
        budget = {
            "total": 0,
            "accommodation": 0,
            "activities": 0,
            "food": 0,
            "transport": 0
        }
        
        # Extract budget from tasks
        if "search_hotels" in completed_tasks:
            hotels_data = completed_tasks.get("search_hotels", {})
            if isinstance(hotels_data, dict):
                budget["accommodation"] = hotels_data.get("total_cost", 0) or 0
        
        # Calculate total from day costs
        total_cost = 0
        for day_data in itinerary.values():
            if isinstance(day_data, dict):
                cost_str = day_data.get("cost", "$0")
                cost = float(cost_str.replace("$", "").replace(",", "")) if isinstance(cost_str, str) else (cost_str if isinstance(cost_str, (int, float)) else 0)
                total_cost += cost
        
        budget["total"] = total_cost
        
        # Add budget to itinerary
        itinerary["budget"] = budget
        
        # Get latest version to increment
        latest = await db.plan_versions.find_one(
            {"tripId": ObjectId(trip_id)},
            sort=[("version", -1)]
        )
        next_version = (latest["version"] + 1) if latest else 1
        now = datetime.utcnow()
        
        # Create plan version
        plan_doc = {
            "tripId": ObjectId(trip_id),
            "version": next_version,
            "itinerary": itinerary,
            "createdBy": "agent",
            "createdAt": now,
        }
        
        await db.plan_versions.insert_one(plan_doc)
    except Exception as e:
        # Log error but don't fail the agent workflow
        print(f"Error generating plan from tasks: {e}")
