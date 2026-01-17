from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agents import build_agent_graph
from app.config import settings


router = APIRouter(prefix="/agents", tags=["agents"])


class AgentRequest(BaseModel):
    message: str
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

    return AgentResponse(
        clarification=final_state.get("clarification"),
        response=final_state.get("final_response"),
        intent=intent.model_dump() if intent else None,
        task_plan=task_plan.model_dump() if task_plan else None,
        completed_tasks=final_state.get("completed_tasks", {}),
    )
