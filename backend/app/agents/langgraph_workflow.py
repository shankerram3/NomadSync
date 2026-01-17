from __future__ import annotations

import json
from typing import Any, Dict, List, Optional, TypedDict

from langgraph.graph import END, StateGraph
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

from app.config import settings


class TripIntent(BaseModel):
    """Structured extraction from natural language trip request."""

    original_message: str
    destinations: List[str] = Field(description="List of destinations mentioned")
    origin: Optional[str] = Field(description="Starting location")
    start_date: Optional[str] = Field(description="Trip start date in YYYY-MM-DD")
    end_date: Optional[str] = Field(description="Trip end date in YYYY-MM-DD")
    duration_days: Optional[int] = Field(description="Number of days")
    group_size: Optional[int] = Field(description="Number of travelers, None if unclear")
    traveler_names: List[str] = Field(default_factory=list)
    budget_total: Optional[float] = Field(description="Total budget if mentioned")
    budget_per_person: Optional[float] = Field(description="Per-person budget if mentioned")
    interests: List[str] = Field(default_factory=list, description="Activities/interests mentioned")
    constraints: List[str] = Field(default_factory=list, description="Restrictions like dietary, accessibility")
    requested_tasks: List[str] = Field(
        description="What user wants: flights, hotels, itinerary, restaurants, full_plan, etc."
    )
    clarifications_needed: List[str] = Field(
        default_factory=list,
        description="Questions to ask user for missing critical info",
    )


class TaskPlan(BaseModel):
    """Ordered list of tasks to execute."""

    class Task(BaseModel):
        task_id: str
        agent: str
        action: str
        parameters: Dict[str, Any]
        depends_on: List[str] = []
        priority: int

    tasks: List[Task]
    clarification_required: bool = False
    clarification_message: Optional[str] = None


class ExecutionState(TypedDict):
    user_message: str
    trip_context: Dict[str, Any]
    trip_memory: Dict[str, Any]
    intent: Optional[TripIntent]
    task_plan: Optional[TaskPlan]
    clarification: Optional[str]
    completed_tasks: Dict[str, Any]
    final_response: Optional[str]


def _openai_client() -> AsyncOpenAI:
    return AsyncOpenAI(api_key=settings.openai_api_key)


async def parse_intent(state: ExecutionState) -> ExecutionState:
    system_prompt = (
        "Extract structured trip planning details from the user's message. "
        "Return JSON only.\n\n"
        "Rules:\n"
        "- Convert relative dates to YYYY-MM-DD when possible.\n"
        "- If dates conflict with duration, keep dates and update duration_days.\n"
        "- Only add clarifications for critical missing info (dates, group size for booking).\n"
        "- If user says 'plan everything', set requested_tasks to flights, hotels, itinerary."
    )

    client = _openai_client()
    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": state["user_message"]},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )

    content = response.choices[0].message.content or "{}"
    data = json.loads(content)
    intent = TripIntent(**data, original_message=state["user_message"])

    state["intent"] = intent
    return state


async def create_task_plan(state: ExecutionState) -> ExecutionState:
    intent = state["intent"]
    trip_memory = state.get("trip_memory") or {}

    if intent is None:
        state["task_plan"] = TaskPlan(tasks=[])
        return state

    tasks: List[TaskPlan.Task] = []

    if intent.group_size is None and trip_memory.get("group_size"):
        intent.group_size = trip_memory["group_size"]

    if intent.group_size is None and any(task in intent.requested_tasks for task in ["flights", "hotels"]):
        state["task_plan"] = TaskPlan(
            tasks=[],
            clarification_required=True,
            clarification_message="How many people are traveling? I need this to search for flights and hotels.",
        )
        return state

    if "flights" in intent.requested_tasks:
        tasks.append(
            TaskPlan.Task(
                task_id="search_flights",
                agent="research",
                action="search_flights",
                parameters={
                    "origin": intent.origin,
                    "destination": intent.destinations[0] if intent.destinations else None,
                    "departure_date": intent.start_date,
                    "return_date": intent.end_date,
                    "passengers": intent.group_size,
                },
                depends_on=[],
                priority=1,
            )
        )

    if "hotels" in intent.requested_tasks:
        tasks.append(
            TaskPlan.Task(
                task_id="search_hotels",
                agent="research",
                action="search_hotels",
                parameters={
                    "destination": intent.destinations[0] if intent.destinations else None,
                    "checkin": intent.start_date,
                    "checkout": intent.end_date,
                    "guests": intent.group_size,
                    "rooms": max(1, (intent.group_size or 2) // 2),
                },
                depends_on=[],
                priority=1,
            )
        )

    if "itinerary" in intent.requested_tasks:
        tasks.append(
            TaskPlan.Task(
                task_id="get_weather",
                agent="research",
                action="get_weather_forecast",
                parameters={
                    "destination": intent.destinations[0] if intent.destinations else None,
                    "start_date": intent.start_date,
                    "end_date": intent.end_date,
                },
                depends_on=[],
                priority=1,
            )
        )
        tasks.append(
            TaskPlan.Task(
                task_id="search_attractions",
                agent="research",
                action="search_attractions",
                parameters={
                    "destination": intent.destinations[0] if intent.destinations else None,
                    "interests": intent.interests or ["sightseeing", "food", "culture"],
                    "days": intent.duration_days,
                },
                depends_on=["get_weather"],
                priority=2,
            )
        )
        for day in range(1, (intent.duration_days or 1) + 1):
            tasks.append(
                TaskPlan.Task(
                    task_id=f"plan_day_{day}",
                    agent="itinerary",
                    action="create_day_plan",
                    parameters={
                        "day_number": day,
                        "destination": intent.destinations[0] if intent.destinations else None,
                        "date": intent.start_date,
                    },
                    depends_on=["search_attractions"],
                    priority=3,
                )
            )

    state["task_plan"] = TaskPlan(tasks=tasks)
    return state


async def check_clarification(state: ExecutionState) -> ExecutionState:
    task_plan = state.get("task_plan")
    if task_plan and task_plan.clarification_required:
        state["clarification"] = task_plan.clarification_message
    return state


async def execute_task_plan(state: ExecutionState) -> ExecutionState:
    task_plan = state.get("task_plan")
    completed_tasks = state.get("completed_tasks", {})

    if not task_plan:
        state["completed_tasks"] = completed_tasks
        return state

    priority_groups: Dict[int, List[TaskPlan.Task]] = {}
    for task in task_plan.tasks:
        priority_groups.setdefault(task.priority, []).append(task)

    for priority in sorted(priority_groups.keys()):
        tasks_at_priority = priority_groups[priority]
        ready_tasks = [
            task for task in tasks_at_priority if all(dep in completed_tasks for dep in task.depends_on)
        ]
        for task in ready_tasks:
            completed_tasks[task.task_id] = await execute_single_task(task, completed_tasks)

    state["completed_tasks"] = completed_tasks
    return state


async def execute_single_task(task: TaskPlan.Task, context: Dict[str, Any]) -> Any:
    return {
        "status": "not_implemented",
        "message": (
            "Connect this action to a provider or internal service. "
            f"Agent={task.agent}, action={task.action}, parameters={task.parameters}."
        ),
    }


async def synthesize_response(state: ExecutionState) -> ExecutionState:
    intent = state.get("intent")
    completed_tasks = state.get("completed_tasks", {})

    if intent is None:
        state["final_response"] = "I wasn't able to parse that request."
        return state

    prompt = (
        "You are NomadSync, a friendly travel planning assistant.\n\n"
        f"The user asked: {intent.original_message}\n\n"
        "Use the data below to respond. If a task result has status=not_implemented, "
        "explain that integrations are pending and ask if the user wants you to continue once connected.\n\n"
        f"Flights: {completed_tasks.get('search_flights')}\n"
        f"Hotels: {completed_tasks.get('search_hotels')}\n"
        f"Weather: {completed_tasks.get('get_weather')}\n"
        f"Day 1: {completed_tasks.get('plan_day_1')}\n"
        f"Day 2: {completed_tasks.get('plan_day_2')}\n"
        f"Day 3: {completed_tasks.get('plan_day_3')}\n"
    )

    client = _openai_client()
    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
    )

    state["final_response"] = response.choices[0].message.content
    return state


def _should_execute(state: ExecutionState) -> str:
    if state.get("clarification"):
        return "end"
    return "execute"


def build_agent_graph():
    graph = StateGraph(ExecutionState)
    graph.add_node("parse_intent", parse_intent)
    graph.add_node("create_task_plan", create_task_plan)
    graph.add_node("check_clarification", check_clarification)
    graph.add_node("execute_task_plan", execute_task_plan)
    graph.add_node("synthesize_response", synthesize_response)

    graph.set_entry_point("parse_intent")
    graph.add_edge("parse_intent", "create_task_plan")
    graph.add_edge("create_task_plan", "check_clarification")
    graph.add_conditional_edges("check_clarification", _should_execute, {"execute": "execute_task_plan", "end": END})
    graph.add_edge("execute_task_plan", "synthesize_response")
    graph.add_edge("synthesize_response", END)

    return graph.compile()
