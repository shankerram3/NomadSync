import OpenAI from 'openai';
import { config } from '../config.js';

// Note: LangGraph TypeScript API differs significantly from Python.
// This implements the workflow manually for now.

export interface TripIntent {
  original_message: string;
  destinations: string[];
  origin?: string;
  start_date?: string;
  end_date?: string;
  duration_days?: number;
  group_size?: number;
  traveler_names: string[];
  budget_total?: number;
  budget_per_person?: number;
  interests: string[];
  constraints: string[];
  requested_tasks: string[];
  clarifications_needed: string[];
}

export interface Task {
  task_id: string;
  agent: string;
  action: string;
  parameters: Record<string, any>;
  depends_on: string[];
  priority: number;
}

export interface TaskPlan {
  tasks: Task[];
  clarification_required: boolean;
  clarification_message?: string;
}

export interface ExecutionState {
  user_message: string;
  trip_context: Record<string, any>;
  trip_memory: Record<string, any>;
  intent?: TripIntent;
  task_plan?: TaskPlan;
  clarification?: string;
  completed_tasks: Record<string, any>;
  final_response?: string;
}

function openaiClient(): OpenAI {
  if (!config.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey: config.openaiApiKey });
}

export async function parseIntent(state: ExecutionState): Promise<ExecutionState> {
  const systemPrompt = `Extract structured trip planning details from the user's message. Return JSON only.

Rules:
- Convert relative dates to YYYY-MM-DD when possible.
- If dates conflict with duration, keep dates and update duration_days.
- Only add clarifications for critical missing info (dates, group size for booking).
- If user says 'plan everything', set requested_tasks to flights, hotels, itinerary.`;

  const client = openaiClient();
  const response = await client.chat.completions.create({
    model: config.openaiModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: state.user_message },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  const content = response.choices[0].message.content || '{}';
  const data = JSON.parse(content);
  const intent: TripIntent = {
    ...data,
    original_message: state.user_message,
  };

  return { ...state, intent };
}

export async function createTaskPlan(state: ExecutionState): Promise<ExecutionState> {
  const intent = state.intent;
  const tripMemory = state.trip_memory || {};

  if (!intent) {
    return { ...state, task_plan: { tasks: [], clarification_required: false } };
  }

  const tasks: Task[] = [];

  if (!intent.group_size && tripMemory.group_size) {
    intent.group_size = tripMemory.group_size;
  }

  if (!intent.group_size && intent.requested_tasks.some(task => ['flights', 'hotels'].includes(task))) {
    return {
      ...state,
      task_plan: {
        tasks: [],
        clarification_required: true,
        clarification_message: 'How many people are traveling? I need this to search for flights and hotels.',
      },
    };
  }

  if (intent.requested_tasks.includes('flights')) {
    tasks.push({
      task_id: 'search_flights',
      agent: 'research',
      action: 'search_flights',
      parameters: {
        origin: intent.origin,
        destination: intent.destinations[0] || null,
        departure_date: intent.start_date,
        return_date: intent.end_date,
        passengers: intent.group_size,
      },
      depends_on: [],
      priority: 1,
    });
  }

  if (intent.requested_tasks.includes('hotels')) {
    tasks.push({
      task_id: 'search_hotels',
      agent: 'research',
      action: 'search_hotels',
      parameters: {
        destination: intent.destinations[0] || null,
        checkin: intent.start_date,
        checkout: intent.end_date,
        guests: intent.group_size,
        rooms: Math.max(1, Math.floor((intent.group_size || 2) / 2)),
      },
      depends_on: [],
      priority: 1,
    });
  }

  if (intent.requested_tasks.includes('itinerary')) {
    tasks.push({
      task_id: 'get_weather',
      agent: 'research',
      action: 'get_weather_forecast',
      parameters: {
        destination: intent.destinations[0] || null,
        start_date: intent.start_date,
        end_date: intent.end_date,
      },
      depends_on: [],
      priority: 1,
    });

    tasks.push({
      task_id: 'search_attractions',
      agent: 'research',
      action: 'search_attractions',
      parameters: {
        destination: intent.destinations[0] || null,
        interests: intent.interests.length > 0 ? intent.interests : ['sightseeing', 'food', 'culture'],
        days: intent.duration_days,
      },
      depends_on: ['get_weather'],
      priority: 2,
    });

    const days = intent.duration_days || 1;
    for (let day = 1; day <= days; day++) {
      tasks.push({
        task_id: `plan_day_${day}`,
        agent: 'itinerary',
        action: 'create_day_plan',
        parameters: {
          day_number: day,
          destination: intent.destinations[0] || null,
          date: intent.start_date,
        },
        depends_on: ['search_attractions'],
        priority: 3,
      });
    }
  }

  return { ...state, task_plan: { tasks, clarification_required: false } };
}

export async function checkClarification(state: ExecutionState): Promise<ExecutionState> {
  const taskPlan = state.task_plan;
  if (taskPlan?.clarification_required) {
    return { ...state, clarification: taskPlan.clarification_message };
  }
  return state;
}

export async function executeTaskPlan(state: ExecutionState): Promise<ExecutionState> {
  const taskPlan = state.task_plan;
  const completedTasks = state.completed_tasks || {};

  if (!taskPlan) {
    return { ...state, completed_tasks: completedTasks };
  }

  const priorityGroups: Record<number, Task[]> = {};
  for (const task of taskPlan.tasks) {
    if (!priorityGroups[task.priority]) {
      priorityGroups[task.priority] = [];
    }
    priorityGroups[task.priority].push(task);
  }

  for (const priority of Object.keys(priorityGroups).map(Number).sort((a, b) => a - b)) {
    const tasksAtPriority = priorityGroups[priority];
    const readyTasks = tasksAtPriority.filter(task =>
      task.depends_on.every(dep => dep in completedTasks)
    );

    for (const task of readyTasks) {
      completedTasks[task.task_id] = await executeSingleTask(task, completedTasks);
    }
  }

  return { ...state, completed_tasks: completedTasks };
}

export async function executeSingleTask(task: Task, context: Record<string, any>): Promise<any> {
  return {
    status: 'not_implemented',
    message: `Connect this action to a provider or internal service. Agent=${task.agent}, action=${task.action}, parameters=${JSON.stringify(task.parameters)}.`,
  };
}

export async function synthesizeResponse(state: ExecutionState): Promise<ExecutionState> {
  const intent = state.intent;
  const completedTasks = state.completed_tasks || {};

  if (!intent) {
    return { ...state, final_response: "I wasn't able to parse that request." };
  }

  const prompt = `You are NomadSync, a friendly travel planning assistant.

The user asked: ${intent.original_message}

Use the data below to respond. If a task result has status=not_implemented, explain that integrations are pending and ask if the user wants you to continue once connected.

Flights: ${JSON.stringify(completedTasks.search_flights)}
Hotels: ${JSON.stringify(completedTasks.search_hotels)}
Weather: ${JSON.stringify(completedTasks.get_weather)}
Day 1: ${JSON.stringify(completedTasks.plan_day_1)}
Day 2: ${JSON.stringify(completedTasks.plan_day_2)}
Day 3: ${JSON.stringify(completedTasks.plan_day_3)}`;

  const client = openaiClient();
  const response = await client.chat.completions.create({
    model: config.openaiModel,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
  });

  return { ...state, final_response: response.choices[0].message.content || '' };
}

function shouldExecute(state: ExecutionState): string {
  if (state.clarification) {
    return 'end';
  }
  return 'execute';
}

// Simplified workflow runner (LangGraph TypeScript API may differ)
// This implements the workflow manually until proper LangGraph TypeScript support
export async function runAgentWorkflow(initialState: ExecutionState): Promise<ExecutionState> {
  let state = initialState;
  
  // Parse intent
  state = await parseIntent(state);
  
  // Create task plan
  state = await createTaskPlan(state);
  
  // Check clarification
  state = await checkClarification(state);
  
  // If clarification needed, return early
  if (state.clarification) {
    return state;
  }
  
  // Execute task plan
  state = await executeTaskPlan(state);
  
  // Synthesize response
  state = await synthesizeResponse(state);
  
  return state;
}

// Keep buildAgentGraph for compatibility, but use runAgentWorkflow internally
export function buildAgentGraph() {
  return {
    invoke: runAgentWorkflow,
    ainvoke: runAgentWorkflow,
  };
}
