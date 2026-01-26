import { Router, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../database.js';
import { getCurrentUserId, AuthRequest } from '../utils/auth.js';
import { checkTripAccess } from '../utils/trip_permissions.js';
import { buildAgentGraph, TripIntent, ExecutionState } from '../agents/langgraph_workflow.js';
import { sseService } from '../services/sse.js';
import { z } from 'zod';

const router = Router();

const AgentRequestSchema = z.object({
  message: z.string(),
  trip_id: z.string().optional(),
  trip_context: z.record(z.any()).optional(),
  trip_memory: z.record(z.any()).optional(),
});

router.post('/plan', getCurrentUserId, async (req: AuthRequest, res: Response) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({ detail: 'OPENAI_API_KEY is not configured' });
      return;
    }

    const validated = AgentRequestSchema.parse(req.body);
    
    // If trip_id is provided, verify access
    if (validated.trip_id) {
      await checkTripAccess(validated.trip_id, req.userId!);
    }

    const graph = buildAgentGraph();
    const initialState: ExecutionState = {
      user_message: validated.message,
      trip_context: validated.trip_context || {},
      trip_memory: validated.trip_memory || {},
      completed_tasks: {},
    };

    const finalState = await graph.invoke(initialState);

    const intent = finalState.intent;
    const taskPlan = finalState.task_plan;

    // Auto-update trip memory from intent if trip_id is provided
    if (validated.trip_id && intent) {
      await updateMemoryFromIntent(validated.trip_id, intent, validated.message.substring(0, 50));
    }

    // Auto-generate plan from task execution if trip_id is provided and tasks completed
    const completedTasks = finalState.completed_tasks || {};
    let planVersionId: string | null = null;
    if (validated.trip_id && Object.keys(completedTasks).length > 0 && intent) {
      planVersionId = await generatePlanFromTasks(validated.trip_id, intent, completedTasks);
    }

    // Extract formatted flight data if available
    const formattedFlights = completedTasks.display_flights?.status === 'success' 
      ? completedTasks.display_flights.data 
      : null;
    
    if (formattedFlights) {
      console.log(`[AGENT_ROUTER] Found ${formattedFlights.length} formatted flight(s) for UI display`);
    } else {
      console.log('[AGENT_ROUTER] No formatted flights available (display_flights may not have been called or failed)');
    }

    res.json({
      clarification: finalState.clarification,
      response: finalState.final_response,
      plan_version_id: planVersionId,
      flights: formattedFlights, // Add structured flight data for UI
      intent: intent ? {
        original_message: intent.original_message,
        destinations: intent.destinations,
        origin: intent.origin,
        start_date: intent.start_date,
        end_date: intent.end_date,
        duration_days: intent.duration_days,
        group_size: intent.group_size,
        traveler_names: intent.traveler_names,
        budget_total: intent.budget_total,
        budget_per_person: intent.budget_per_person,
        interests: intent.interests,
        constraints: intent.constraints,
        requested_tasks: intent.requested_tasks,
        clarifications_needed: intent.clarifications_needed,
      } : null,
      task_plan: taskPlan ? {
        tasks: taskPlan.tasks,
        clarification_required: taskPlan.clarification_required,
        clarification_message: taskPlan.clarification_message,
      } : null,
      completed_tasks: completedTasks,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ detail: 'Validation error', errors: error.errors });
      return;
    }
    if (error.message === 'Trip not found' || error.message === 'Access denied') {
      res.status(error.message === 'Trip not found' ? 404 : 403).json({ detail: error.message });
    } else {
      console.error('Agent workflow error:', error);
      res.status(500).json({ detail: error.message });
    }
  }
});

async function updateMemoryFromIntent(tripId: string, intent: TripIntent, messageRef: string): Promise<void> {
  try {
    const db = getDatabase();
    const memoryUpdates: Record<string, any> = {};

    // Update origin
    if (intent.origin) {
      memoryUpdates.origin = {
        value: intent.origin,
        confidence: 80,
        sources: messageRef ? [messageRef] : [],
      };
    }

    // Update destination
    if (intent.destinations && intent.destinations.length > 0) {
      const destinationStr = intent.destinations.join(', ');
      memoryUpdates.destination = {
        value: destinationStr,
        confidence: 80,
        sources: messageRef ? [messageRef] : [],
      };
    }

    // Update dates - store both formatted string and structured dates
    if (intent.start_date || intent.end_date) {
      let datesStr = '';
      if (intent.start_date && intent.end_date) {
        datesStr = `${intent.start_date} to ${intent.end_date}`;
      } else if (intent.start_date) {
        datesStr = `Starting ${intent.start_date}`;
      } else if (intent.end_date) {
        datesStr = `Ending ${intent.end_date}`;
      }

      if (datesStr) {
        memoryUpdates.dates = {
          value: datesStr,
          confidence: 85,
          sources: messageRef ? [messageRef] : [],
          // Also store structured dates for easier retrieval
          start_date: intent.start_date,
          end_date: intent.end_date,
        };
      }
    }

    // Update duration
    if (intent.duration_days) {
      memoryUpdates.duration = {
        value: `${intent.duration_days} days`,
        confidence: 80,
        sources: messageRef ? [messageRef] : [],
      };
    }

    // Update budget
    if (intent.budget_total) {
      memoryUpdates.budget = {
        value: `$${intent.budget_total} total`,
        confidence: 75,
        sources: messageRef ? [messageRef] : [],
      };
    } else if (intent.budget_per_person && intent.group_size) {
      const total = intent.budget_per_person * intent.group_size;
      memoryUpdates.budget = {
        value: `$${intent.budget_per_person} per person ($${total} total)`,
        confidence: 75,
        sources: messageRef ? [messageRef] : [],
      };
    }

    // Update pace (from interests/constraints)
    if (intent.interests && intent.interests.length > 0) {
      const paceHints = ['relaxed', 'slow', 'leisurely', 'fast', 'packed', 'intensive'];
      let paceValue: string | undefined;
      
      for (const interest of intent.interests) {
        const interestLower = interest.toLowerCase();
        if (paceHints.some(hint => interestLower.includes(hint))) {
          paceValue = interest;
          break;
        }
      }

      if (!paceValue) {
        paceValue = intent.interests.length <= 3 ? 'moderate' : 'active';
      }

      memoryUpdates.pace = {
        value: paceValue,
        confidence: 60,
        sources: messageRef ? [messageRef] : [],
      };
    }

    // Update memory in database if there are updates
    if (Object.keys(memoryUpdates).length > 0) {
      memoryUpdates.updatedAt = new Date();

      // Merge with existing memory, updating confidence and sources
      const existingMemory = await db.collection('trip_memory').findOne({ tripId: new ObjectId(tripId) });

      if (existingMemory) {
        // Merge updates, increasing confidence if value already exists
        for (const [key, newValue] of Object.entries(memoryUpdates)) {
          if (key === 'updatedAt') continue;
          
          const existingValue = existingMemory[key];
          if (existingValue && existingValue.value === newValue.value) {
            // Same value, increase confidence
            newValue.confidence = Math.min(100, (existingValue.confidence || 0) + 10);
            newValue.sources = [...new Set([...(existingValue.sources || []), ...newValue.sources])];
          }
        }
      }

      await db.collection('trip_memory').updateOne(
        { tripId: new ObjectId(tripId) },
        { $set: memoryUpdates },
        { upsert: true }
      );
    }
  } catch (error) {
    // Log error but don't fail the agent workflow
    console.error('Error updating memory from intent:', error);
  }
}

async function generatePlanFromTasks(
  tripId: string,
  intent: TripIntent,
  completedTasks: Record<string, any>
): Promise<string | null> {
  try {
    const db = getDatabase();

    // Only generate plan if itinerary tasks were completed
    const hasItineraryTasks = Object.keys(completedTasks).some(
      key => key.startsWith('plan_day_') || key === 'search_attractions'
    );

    if (!hasItineraryTasks) {
      return;
    }

    // Build itinerary structure from completed tasks
    const itinerary: Record<string, any> = {};
    const days = intent.duration_days || 1;

    // Extract day plans from completed tasks
    for (let day = 1; day <= days; day++) {
      const dayKey = `plan_day_${day}`;
      if (dayKey in completedTasks) {
        const dayData = completedTasks[dayKey];
        if (typeof dayData === 'object' && dayData !== null && !('status' in dayData)) {
          itinerary[`day_${day}`] = dayData;
        } else {
          // Fallback: create basic day structure
          itinerary[`day_${day}`] = {
            title: `Day ${day}`,
            activities: (typeof dayData === 'object' && dayData?.activities) ? dayData.activities : [],
            cost: (typeof dayData === 'object' && dayData?.cost) ? dayData.cost : '$0',
          };
        }
      }
    }

    // If no day plans, create a basic structure from attractions
    if (Object.keys(itinerary).length === 0 && 'search_attractions' in completedTasks) {
      const attractionsData = completedTasks.search_attractions;
      if (typeof attractionsData === 'object' && attractionsData !== null) {
        const attractions = attractionsData.attractions || [];
        // Distribute attractions across days
        const perDay = attractions.length > 0 ? Math.max(1, Math.floor(attractions.length / days)) : 0;
        for (let day = 1; day <= days; day++) {
          const startIdx = (day - 1) * perDay;
          const dayAttractions = attractions.slice(startIdx, startIdx + perDay);
          itinerary[`day_${day}`] = {
            title: `Day ${day}`,
            activities: dayAttractions.map((attr: any) =>
              typeof attr === 'object' ? attr.name || String(attr) : String(attr)
            ),
            cost: '$0',
          };
        }
      }
    }

    // Calculate budget breakdown if available
    const budget: Record<string, number> = {
      total: 0,
      accommodation: 0,
      activities: 0,
      food: 0,
      transport: 0,
    };

    // Extract budget from tasks
    if ('search_hotels' in completedTasks) {
      const hotelsData = completedTasks.search_hotels;
      if (typeof hotelsData === 'object' && hotelsData !== null) {
        budget.accommodation = hotelsData.total_cost || 0;
      }
    }

    // Calculate total from day costs
    let totalCost = 0;
    for (const dayData of Object.values(itinerary)) {
      if (typeof dayData === 'object' && dayData !== null) {
        const costStr = dayData.cost || '$0';
        const cost = typeof costStr === 'string'
          ? parseFloat(costStr.replace('$', '').replace(/,/g, '')) || 0
          : typeof costStr === 'number' ? costStr : 0;
        totalCost += cost;
      }
    }

    budget.total = totalCost;
    itinerary.budget = budget;

    // Get latest version to increment
    const latest = await db.collection('plan_versions')
      .findOne(
        { tripId: new ObjectId(tripId) },
        { sort: { version: -1 } }
      );

    const nextVersion = latest ? latest.version + 1 : 1;
    const now = new Date();

    // Create plan version
    const planDoc = {
      tripId: new ObjectId(tripId),
      version: nextVersion,
      itinerary,
      createdBy: 'agent',
      createdAt: now,
    };

    const result = await db.collection('plan_versions').insertOne(planDoc);
    
    // Broadcast plan update via SSE
    const planResponse = {
      id: result.insertedId.toString(),
      trip_id: tripId,
      version: planDoc.version,
      itinerary: planDoc.itinerary,
      created_by: planDoc.createdBy,
      created_at: now,
    };
    sseService.broadcastPlan(tripId, planResponse);
    
    return result.insertedId.toString();
  } catch (error) {
    // Log error but don't fail the agent workflow
    console.error('Error generating plan from tasks:', error);
    return null;
  }
}

export default router;
