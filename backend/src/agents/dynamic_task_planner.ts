/**
 * Dynamic Task Planner
 * Uses tool registry to dynamically create tasks based on available tools
 */

import { TripIntent } from './langgraph_workflow.js';
import { toolRegistry } from '../services/tool_registry.js';
import { Task } from './langgraph_workflow.js';

/**
 * Dynamically create tasks based on intent and available tools
 */
export function createDynamicTasks(
  intent: TripIntent,
  tripMemory: Record<string, any> = {}
): Task[] {
  const tasks: Task[] = [];
  const availableTools = toolRegistry.getAll();

  // Map requested tasks to tool categories
  const taskCategoryMap: Record<string, string[]> = {
    flights: ['research'],
    hotels: ['research'],
    itinerary: ['research', 'itinerary'],
    weather: ['research'],
    attractions: ['research'],
  };

  // Create tasks for each requested task
  for (const requestedTask of intent.requested_tasks || []) {
    const categories = taskCategoryMap[requestedTask] || ['research'];
    
    // Find tools that match the requested task
    const matchingTools = availableTools.filter(tool => {
      const toolName = tool.metadata.name.toLowerCase();
      const toolDesc = tool.metadata.description.toLowerCase();
      const taskLower = requestedTask.toLowerCase();
      
      return (
        toolName.includes(taskLower) ||
        toolDesc.includes(taskLower) ||
        tool.metadata.action.includes(taskLower)
      );
    });

    // If no matching tools, try category-based search
    if (matchingTools.length === 0) {
      for (const category of categories) {
        const categoryTools = toolRegistry.getByCategory(category as any);
        matchingTools.push(...categoryTools);
      }
    }

    // Create task for each matching tool
    for (const tool of matchingTools) {
      const taskId = `${tool.metadata.action}_${Date.now()}`;
      const parameters = extractParametersForTool(tool, intent, tripMemory);
      
      tasks.push({
        task_id: taskId,
        agent: tool.metadata.agent,
        action: tool.metadata.action,
        parameters,
        depends_on: tool.metadata.dependencies || [],
        priority: getTaskPriority(tool.metadata.category),
      });
    }
  }

  return tasks;
}

/**
 * Extract parameters for a tool based on intent and memory
 */
function extractParametersForTool(
  tool: { metadata: { parameters: Array<{ name: string; type: string }> } },
  intent: TripIntent,
  tripMemory: Record<string, any>
): Record<string, any> {
  const parameters: Record<string, any> = {};

  // Map common parameter names
  const parameterMapping: Record<string, (intent: TripIntent, memory: Record<string, any>) => any> = {
    origin: () => intent.origin,
    destination: () => intent.destinations?.[0],
    departure_date: () => intent.start_date,
    return_date: () => intent.end_date,
    passengers: () => intent.group_size || tripMemory.group_size || 1,
    group_size: () => intent.group_size || tripMemory.group_size || 1,
    checkin: () => intent.start_date,
    checkout: () => intent.end_date,
    guests: () => intent.group_size || tripMemory.group_size || 1,
    rooms: () => Math.max(1, Math.floor((intent.group_size || tripMemory.group_size || 2) / 2)),
    start_date: () => intent.start_date,
    end_date: () => intent.end_date,
    duration_days: () => intent.duration_days,
    interests: () => intent.interests || [],
    budget: () => intent.budget_total || intent.budget_per_person,
  };

  // Extract parameters based on tool requirements
  for (const param of tool.metadata.parameters) {
    const mapper = parameterMapping[param.name];
    if (mapper) {
      const value = mapper(intent, tripMemory);
      if (value !== undefined && value !== null) {
        parameters[param.name] = value;
      }
    }
  }

  return parameters;
}

/**
 * Get task priority based on category
 */
function getTaskPriority(category: string): number {
  const priorities: Record<string, number> = {
    research: 1,
    booking: 2,
    itinerary: 3,
    communication: 4,
    utility: 5,
  };
  return priorities[category] || 3;
}

/**
 * Validate if all required parameters are available for a task
 */
export function validateTaskParameters(
  task: Task,
  intent: TripIntent,
  tripMemory: Record<string, any>
): { valid: boolean; missing: string[] } {
  const tool = toolRegistry.get(task.agent, task.action);
  if (!tool) {
    return { valid: false, missing: ['tool_not_found'] };
  }

  const requiredParams = tool.metadata.parameters.filter(p => p.required);
  const missing: string[] = [];

  for (const param of requiredParams) {
    if (!(param.name in task.parameters) || task.parameters[param.name] === null || task.parameters[param.name] === undefined) {
      missing.push(param.name);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
