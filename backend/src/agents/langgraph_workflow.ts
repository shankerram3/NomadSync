import OpenAI from 'openai';
import { traceable } from 'langsmith/traceable';
import { config } from '../config.js';

// Note: LangGraph TypeScript API differs significantly from Python.
// This implements the workflow manually for now.

// Initialize LangSmith tracing if enabled
if (config.langsmithTracing && config.langsmithApiKey) {
  process.env.LANGSMITH_TRACING = 'true';
  process.env.LANGSMITH_ENDPOINT = config.langsmithEndpoint;
  process.env.LANGSMITH_API_KEY = config.langsmithApiKey;
  process.env.LANGSMITH_PROJECT = config.langsmithProject;
  console.log('[LANGSMITH] Tracing enabled for project:', config.langsmithProject);
}

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
  const client = new OpenAI({ apiKey: config.openaiApiKey });
  
  // Enable LangSmith tracing for OpenAI if configured
  if (config.langsmithTracing && config.langsmithApiKey) {
    // LangSmith automatically traces OpenAI calls when environment variables are set
    // No additional configuration needed
  }
  
  return client;
}

export const parseIntent = traceable(
  async (state: ExecutionState): Promise<ExecutionState> => {
    // Load tools to get available capabilities for better intent parsing
    await ensureToolsLoaded();
    const { getAvailableToolsForLLM } = await import('../services/tool_loader.js');
    const availableTools = getAvailableToolsForLLM();
    
    // Build trip memory context for the LLM
    const memoryContext = state.trip_memory || {};
    const memoryInfo: string[] = [];
    if (memoryContext.destination?.value) {
      memoryInfo.push(`Previous destination: ${memoryContext.destination.value}`);
    }
    if (memoryContext.dates?.value) {
      memoryInfo.push(`Previous dates: ${memoryContext.dates.value}`);
    }
    if (memoryContext.duration?.value) {
      memoryInfo.push(`Previous duration: ${memoryContext.duration.value}`);
    }
    
    const memoryContextStr = memoryInfo.length > 0 
      ? `\n\nPrevious conversation context (trip memory):\n${memoryInfo.join('\n')}\n\nUse this context to fill in missing information. For example, if dates were mentioned before but not in the current message, extract them from the memory context.`
      : '';
    
    const systemPrompt = `Extract structured trip planning details from the user's message. Return JSON only.

Available tools/capabilities:
${availableTools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}
${memoryContextStr}

Rules:
- Convert relative dates to YYYY-MM-DD format. Handle various date formats:
  * "feb 12th to 16th" -> start_date: "2026-02-12", end_date: "2026-02-16" (use current year if not specified)
  * "February 12 to 16" -> start_date: "2026-02-12", end_date: "2026-02-16"
  * "12/02 to 16/02" -> start_date: "2026-02-12", end_date: "2026-02-16"
  * "next week" -> calculate dates for next week
  * If only one date is given, use it as start_date
- If dates conflict with duration, keep dates and update duration_days.
- ALWAYS extract location information when present:
  * If user says "from X to Y", "X to Y", "travel from X to Y", extract:
    - origin: X (the departure location)
    - destinations: [Y] (the arrival location)
  * Examples: "from New York to Tokyo" -> origin: "New York", destinations: ["Tokyo"]
  * Examples: "tempe arizona to san francisco" -> origin: "tempe arizona", destinations: ["san francisco"]
  * Examples: "plan a trip from Phoenix to LA" -> origin: "Phoenix", destinations: ["LA"]
- Extract flight-specific information:
  * origin: Departure city/airport (e.g., "New York", "JFK", "NYC", "Tempe Arizona", "Phoenix")
  * destination: Arrival city/airport (e.g., "Tokyo", "NRT", "San Francisco", "SFO")
  * start_date: Departure date in YYYY-MM-DD format
  * end_date: Return date in YYYY-MM-DD format (if round trip)
  * departure_date: Same as start_date (for flight tools)
  * return_date: Same as end_date (for flight tools)
  * passengers/group_size: Number of travelers
- Use trip memory context to fill in missing information:
  * If dates were mentioned in previous messages (check memory context), extract them even if not in current message
  * If destination was mentioned before, use it if not in current message
  * Combine information from current message with memory context
- ONLY add tasks to requested_tasks if the user EXPLICITLY mentions them OR if the context strongly implies them:
  * "flights" - Add if user mentions: "flight", "fly", "airplane", "airline", "book flight", "search flights", OR if user provides origin/destination (implies travel/flights needed)
  * "hotels" - Add if user mentions: "hotel", "accommodation", "stay", "book hotel", or similar
  * "itinerary" - Add if user mentions: "itinerary", "plan", "schedule", "activities", "things to do", "plan a trip", or similar
- If user says 'plan everything', 'plan my trip', or 'plan a trip', set requested_tasks to include flights (if origin/destination provided), hotels, itinerary.
- Extract airport codes or city names from messages like "fly from JFK to Tokyo" or "book flight NYC to LAX".
- If the message is unclear or doesn't contain enough information, set clarifications_needed with specific questions.
- Be smart about inference: if user provides origin and destination, they likely want flight information even if not explicitly stated.`;

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
    
    // Ensure arrays are initialized
    const destinations = data.destinations || [];
    const requestedTasks = data.requested_tasks || [];
    
    // Fill in missing information from trip memory
    const memory = state.trip_memory || {};
    
    // Use memory for dates if not in current message
    if (!data.start_date && !data.departure_date) {
      // First try structured dates from memory
      if (memory.dates?.start_date) {
        data.start_date = memory.dates.start_date;
        data.departure_date = memory.dates.start_date;
      }
      // If still missing, the LLM should extract from memory.dates.value in the prompt
    }
    
    if (!data.end_date && !data.return_date) {
      // First try structured dates from memory
      if (memory.dates?.end_date) {
        data.end_date = memory.dates.end_date;
        data.return_date = memory.dates.end_date;
      }
    }
    
    // Use memory for destination if not in current message
    if (destinations.length === 0 && memory.destination?.value) {
      destinations.push(memory.destination.value);
    }
    
    // Use memory for origin if not in current message
    if (!data.origin && memory.origin?.value) {
      data.origin = memory.origin.value;
    }
    
    // Ensure start_date and departure_date are synced
    if (data.start_date && !data.departure_date) {
      data.departure_date = data.start_date;
    }
    if (data.departure_date && !data.start_date) {
      data.start_date = data.departure_date;
    }
    
    // Ensure end_date and return_date are synced
    if (data.end_date && !data.return_date) {
      data.return_date = data.end_date;
    }
    if (data.return_date && !data.end_date) {
      data.end_date = data.return_date;
    }
    
    // Auto-add "flights" to requested_tasks if origin and destination are provided
    // but flights aren't explicitly mentioned
    const hasOrigin = data.origin && data.origin.trim().length > 0;
    const hasDestination = destinations.length > 0 && destinations[0]?.trim().length > 0;
    const hasFlightsTask = Array.isArray(requestedTasks) && requestedTasks.includes('flights');
    
    if (hasOrigin && hasDestination && !hasFlightsTask) {
      // User provided travel locations, so they likely want flight information
      requestedTasks.push('flights');
    }
    
    const intent: TripIntent = {
      ...data,
      original_message: state.user_message,
      destinations,
      traveler_names: data.traveler_names || [],
      interests: data.interests || [],
      constraints: data.constraints || [],
      requested_tasks: requestedTasks,
      clarifications_needed: data.clarifications_needed || [],
    };

    return { ...state, intent };
  },
  { name: 'parseIntent', run_type: 'chain' }
);

export const createTaskPlan = traceable(
  async (state: ExecutionState): Promise<ExecutionState> => {
  const intent = state.intent;
  const tripMemory = state.trip_memory || {};

  if (!intent) {
    return { ...state, task_plan: { tasks: [], clarification_required: false } };
  }

  // Load tools to dynamically discover available capabilities
  await ensureToolsLoaded();
  const { findToolsForTask } = await import('../services/tool_loader.js');
  const { createDynamicTasks, validateTaskParameters } = await import('./dynamic_task_planner.js');
  
  const tasks: Task[] = [];
  
  // Try dynamic task creation first
  let invalidTasks: { task: Task; missing: string[] }[] = [];
  try {
    const dynamicTasks = createDynamicTasks(intent, tripMemory);
    if (dynamicTasks.length > 0) {
      // Validate and separate valid/invalid tasks
      for (const task of dynamicTasks) {
        const validation = validateTaskParameters(task, intent, tripMemory);
        if (validation.valid) {
          tasks.push(task);
        } else {
          console.warn(`[TASK_PLANNER] Task ${task.task_id} missing parameters: ${validation.missing.join(', ')}`);
          invalidTasks.push({ task, missing: validation.missing });
        }
      }
    }
  } catch (error) {
    console.warn('[TASK_PLANNER] Dynamic task creation failed, falling back to static:', error);
  }
  
  // If we have invalid tasks, determine what clarification is needed
  if (invalidTasks.length > 0 && tasks.length === 0) {
    // Check what's missing - prioritize critical parameters
    const missingParams = new Set<string>();
    for (const { missing } of invalidTasks) {
      missing.forEach(param => missingParams.add(param));
    }
    
    // Check if flights are requested
    const flightsRequested = intent.requested_tasks && Array.isArray(intent.requested_tasks) && intent.requested_tasks.includes('flights');
    
    if (flightsRequested) {
      const hasOrigin = intent.origin && intent.origin.trim().length > 0;
      const hasDestination = intent.destinations && intent.destinations.length > 0 && intent.destinations[0]?.trim().length > 0;
      const hasDate = intent.start_date && intent.start_date.trim().length > 0;
      const hasGroupSize = intent.group_size || tripMemory.group_size;
      
      // Prioritize asking for origin/destination/dates before group size
      const missing: string[] = [];
      if (!hasOrigin) missing.push('departure city/airport');
      if (!hasDestination) missing.push('destination');
      if (!hasDate) missing.push('travel dates');
      if (!hasGroupSize && missing.length === 0) missing.push('number of travelers');
      
      if (missing.length > 0) {
        return {
          ...state,
          task_plan: {
            tasks: [],
            clarification_required: true,
            clarification_message: `To help you with your trip, I need: ${missing.join(', ')}. Could you provide this information?`,
          },
        };
      }
    }
  }
  
  // Fallback to static task creation if dynamic didn't work
  if (tasks.length === 0) {
    if (!intent.group_size && tripMemory.group_size) {
      intent.group_size = tripMemory.group_size;
    }

    // Check for flights/hotels and missing critical parameters first
    const flightsRequested = intent.requested_tasks && Array.isArray(intent.requested_tasks) && intent.requested_tasks.includes('flights');
    const hotelsRequested = intent.requested_tasks && Array.isArray(intent.requested_tasks) && intent.requested_tasks.includes('hotels');
    
    if (flightsRequested || hotelsRequested) {
      const hasOrigin = intent.origin && intent.origin.trim().length > 0;
      const hasDestination = intent.destinations && intent.destinations.length > 0 && intent.destinations[0]?.trim().length > 0;
      const hasDate = intent.start_date && intent.start_date.trim().length > 0;
      const hasGroupSize = intent.group_size || tripMemory.group_size;
      
      // Prioritize critical parameters
      const missing: string[] = [];
      if (flightsRequested && !hasOrigin) missing.push('departure city/airport');
      if ((flightsRequested || hotelsRequested) && !hasDestination) missing.push('destination');
      if ((flightsRequested || hotelsRequested) && !hasDate) missing.push('travel dates');
      if (!hasGroupSize && missing.length === 0) missing.push('number of travelers');
      
      if (missing.length > 0) {
        return {
          ...state,
          task_plan: {
            tasks: [],
            clarification_required: true,
            clarification_message: `To search for ${flightsRequested && hotelsRequested ? 'flights and hotels' : flightsRequested ? 'flights' : 'hotels'}, I need: ${missing.join(', ')}. Could you provide this information?`,
          },
        };
      }
    }

    // Dynamically create flight search task if flights are requested AND we have required parameters
    if (intent.requested_tasks && Array.isArray(intent.requested_tasks) && intent.requested_tasks.includes('flights')) {
      // Only create flight task if we have minimum required parameters
      const hasOrigin = intent.origin && intent.origin.trim().length > 0;
      const hasDestination = intent.destinations && intent.destinations.length > 0 && intent.destinations[0]?.trim().length > 0;
      const hasDate = intent.start_date && intent.start_date.trim().length > 0;
      
      if (!hasOrigin || !hasDestination || !hasDate) {
        // Missing required parameters - ask for clarification instead
        return {
          ...state,
          task_plan: {
            tasks: [],
            clarification_required: true,
            clarification_message: 'To search for flights, I need to know: ' +
              (!hasOrigin ? 'your departure city/airport, ' : '') +
              (!hasDestination ? 'your destination, ' : '') +
              (!hasDate ? 'your travel dates. ' : '') +
              'Could you provide this information?',
          },
        };
      }
      
      // Find available flight tools
      const flightTools = findToolsForTask('flight search');
      
      if (flightTools.length > 0) {
        // Use the first available flight tool
        const flightTool = flightTools[0];
        tasks.push({
          task_id: 'search_flights',
          agent: flightTool.metadata.agent,
          action: flightTool.metadata.action,
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
      } else {
        // Fallback to hardcoded task if no tool found
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
    }

    if (intent.requested_tasks && Array.isArray(intent.requested_tasks) && intent.requested_tasks.includes('hotels')) {
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

    if (intent.requested_tasks && Array.isArray(intent.requested_tasks) && intent.requested_tasks.includes('itinerary')) {
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
  }

    return { ...state, task_plan: { tasks, clarification_required: false } };
  },
  { name: 'createTaskPlan', run_type: 'chain' }
);

export async function checkClarification(state: ExecutionState): Promise<ExecutionState> {
  const taskPlan = state.task_plan;
  if (taskPlan?.clarification_required) {
    return { ...state, clarification: taskPlan.clarification_message };
  }
  return state;
}

export const executeTaskPlan = traceable(
  async (state: ExecutionState): Promise<ExecutionState> => {
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
        
        // Automatically format flights for UI display after flight search (success or partial)
        // Check by action name since task_id may be dynamic (e.g., search_flights_123456)
        const flightResult = completedTasks[task.task_id];
        if (task.action === 'search_flights' && flightResult && 
            (flightResult.status === 'success' || flightResult.status === 'partial') &&
            flightResult.data && Array.isArray(flightResult.data) && flightResult.data.length > 0) {
          try {
            await ensureToolsLoaded();
            const { toolRegistry } = await import('../services/tool_registry.js');
            const displayResult = await toolRegistry.execute(
              'research',
              'display_flights',
              { flight_data: completedTasks[task.task_id] },
              completedTasks
            );
            if (displayResult.status === 'success') {
              completedTasks.display_flights = displayResult;
              console.log(`[AGENT] Successfully formatted ${displayResult.data?.length || 0} flight(s) for UI display`);
            } else {
              console.warn('[AGENT] Display flights tool returned non-success status:', displayResult.status, displayResult.message);
            }
          } catch (error) {
            console.warn('[AGENT] Failed to format flights for display:', error);
            // Don't fail the workflow if display formatting fails
          }
        }
      }
    }

    return { ...state, completed_tasks: completedTasks };
  },
  { name: 'executeTaskPlan', run_type: 'chain' }
);

// Lazy load tool registry
let toolRegistryLoaded = false;

async function ensureToolsLoaded() {
  if (!toolRegistryLoaded) {
    const { loadAllTools } = await import('../services/tool_loader.js');
    await loadAllTools();
    toolRegistryLoaded = true;
  }
}

export const executeSingleTask = traceable(
  async (task: Task, context: Record<string, any>): Promise<any> => {
    // Ensure tools are loaded
    await ensureToolsLoaded();
    
    const { toolRegistry } = await import('../services/tool_registry.js');
    
    const toolKey = `${task.agent}:${task.action}`;
    
    console.log(`[AGENT] Executing task: ${task.task_id} (${toolKey})`);
    console.log(`[AGENT] Parameters:`, JSON.stringify(task.parameters, null, 2));
    
    // Use the dynamic tool registry
    const result = await toolRegistry.execute(
      task.agent,
      task.action,
      task.parameters,
      context
    );
    
    console.log(`[AGENT] Task ${task.task_id} completed with status: ${result.status}`);
    
    // Convert ToolResult to the format expected by the workflow
    return result;
  },
  { name: 'executeSingleTask', run_type: 'tool' }
);

export const synthesizeResponse = traceable(
  async (state: ExecutionState): Promise<ExecutionState> => {
    const intent = state.intent;
    const completedTasks = state.completed_tasks || {};

    if (!intent) {
      return { ...state, final_response: "I wasn't able to parse that request." };
    }

    // Only include flight info if flights were actually requested or searched
    const flightsRequested = intent.requested_tasks && Array.isArray(intent.requested_tasks) && intent.requested_tasks.includes('flights');
    
    // Find flight search result (task_id may be dynamic like search_flights_123456)
    let flightResults: any = null;
    for (const [taskId, result] of Object.entries(completedTasks)) {
      if (taskId.startsWith('search_flights') && result && typeof result === 'object' && 'status' in result) {
        flightResults = result;
        break;
      }
    }
    
    // Also check for display_flights result
    const displayFlightsResult = completedTasks.display_flights;
    
    // Determine if flights are available in structured format for UI
    const hasStructuredFlights = displayFlightsResult?.status === 'success' && 
                                  displayFlightsResult.data && 
                                  Array.isArray(displayFlightsResult.data) && 
                                  displayFlightsResult.data.length > 0;

    // Build response context
    const responseParts: string[] = [];
    
    // Only include flight info in text if structured flights are NOT available
    // If structured flights are available, they will be shown in UI cards, so don't duplicate in text
    if (flightsRequested && flightResults && !hasStructuredFlights) {
      // No structured flights available - provide error or status info
      if (flightResults.status === 'error') {
        responseParts.push(`FLIGHT SEARCH RESULTS:\nFlight search encountered an error: ${flightResults.message || 'Unknown error'}`);
      } else if (flightResults.status === 'no_results') {
        responseParts.push(`FLIGHT SEARCH RESULTS:\nNo flights found for the given criteria. Try adjusting dates or destinations.`);
      } else if (flightResults.status === 'not_implemented') {
        responseParts.push(`FLIGHT SEARCH RESULTS:\nFlight search is not yet connected.`);
      } else if (flightResults.status === 'partial' || flightResults.status === 'success') {
        // Flight search completed but formatting failed - mention briefly without details
        responseParts.push(`FLIGHT SEARCH RESULTS:\nFlight search completed. Processing results...`);
      }
    } else if (flightsRequested && hasStructuredFlights) {
      // Structured flights are available - just mention success, no details
      responseParts.push(`FLIGHT SEARCH RESULTS:\nFound ${displayFlightsResult.data.length} flight option(s) for you.`);
    }
    
    const otherResults: string[] = [];
    if (completedTasks.search_hotels) {
      otherResults.push(`Hotels: ${JSON.stringify(completedTasks.search_hotels)}`);
    }
    if (completedTasks.get_weather) {
      otherResults.push(`Weather: ${JSON.stringify(completedTasks.get_weather)}`);
    }
    if (completedTasks.plan_day_1 || completedTasks.plan_day_2 || completedTasks.plan_day_3) {
      otherResults.push(`Itinerary: ${JSON.stringify({
        day1: completedTasks.plan_day_1,
        day2: completedTasks.plan_day_2,
        day3: completedTasks.plan_day_3,
      })}`);
    }
    
    if (otherResults.length > 0) {
      responseParts.push(`\nOTHER RESULTS:\n${otherResults.join('\n')}`);
    }

    const prompt = `You are NomadSync, a friendly travel planning assistant.

The user asked: "${intent.original_message}"

${responseParts.length > 0 ? `\nHere's what I found:\n${responseParts.join('\n')}\n` : ''}

Instructions:
- Respond naturally and conversationally to what the user actually asked.
- ${hasStructuredFlights ? 'CRITICAL: Flight search was successful and flight data is available in structured format. The flight details will be displayed as interactive cards in the UI. DO NOT list flight details, prices, times, airlines, departure/arrival times, durations, layovers, or ANY flight information in your text response. Keep your response very brief - just acknowledge that you found flights. Example responses: "I found some flight options for you! Check out the flight cards below." or "Great! I found flight options for your trip. See the details in the cards below." DO NOT include any flight details, prices, or times in your response.' : ''}
- ${flightsRequested && flightResults?.status === 'success' && !hasStructuredFlights ? 'Flight search was successful but formatting for UI failed. Provide a brief summary without listing all details.' : ''}
- ${flightsRequested && flightResults?.status === 'partial' && hasStructuredFlights ? 'Flight search completed with partial results. Flight data is available in structured format. DO NOT list flight details in text - they will be shown in UI cards. Just acknowledge you found some options.' : ''}
- ${flightsRequested && flightResults?.status === 'error' ? `IMPORTANT: The flight search failed with error: ${flightResults.message || 'Unknown error'}. DO NOT invent or make up flight details. Explain the error honestly and suggest the user try different search terms (e.g., use airport codes like PHX instead of "Tempe Arizona", or try "Phoenix" instead).` : ''}
- ${flightsRequested && !flightResults ? 'Flight search was requested but no results are available. DO NOT make up flight details. Ask the user to provide more specific information.' : ''}
- ${!flightsRequested ? 'DO NOT mention flights unless the user explicitly asked about them.' : ''}
- If the user's message was vague or unclear, ask clarifying questions about what they'd like help with.
- Be helpful and friendly, but don't assume they want information they didn't ask for.
- NEVER invent or make up flight prices, times, or airline names. Only use real data from successful searches.
- When structured flight data is available for UI display, keep your response brief and let the UI show the details.`;

    const client = openaiClient();
    const response = await client.chat.completions.create({
      model: config.openaiModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
    });

    return { ...state, final_response: response.choices[0].message.content || '' };
  },
  { name: 'synthesizeResponse', run_type: 'chain' }
);

function shouldExecute(state: ExecutionState): string {
  if (state.clarification) {
    return 'end';
  }
  return 'execute';
}

// Simplified workflow runner (LangGraph TypeScript API may differ)
// This implements the workflow manually until proper LangGraph TypeScript support
export const runAgentWorkflow = traceable(
  async (initialState: ExecutionState): Promise<ExecutionState> => {
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
  },
  { name: 'runAgentWorkflow', run_type: 'chain' }
);

// Keep buildAgentGraph for compatibility, but use runAgentWorkflow internally
export function buildAgentGraph() {
  return {
    invoke: runAgentWorkflow,
    ainvoke: runAgentWorkflow,
  };
}
