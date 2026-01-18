import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TripSidebar } from './TripSidebar';
import { ChatPanel } from './ChatPanel';
import { MemoryPlanPanel } from './MemoryPlanPanel';
import { messagesService, Message } from '../services/messages';
import { memoryService, TripMemory } from '../services/memory';
import { planService, PlanVersion } from '../services/plan';
import { conflictsService } from '../services/conflicts';
import { agentService } from '../services/agent';
import { tripsService, Trip } from '../services/trips';

export function TripPlanner() {
  const { id } = useParams<{ id: string }>();
  const [activeRightTab, setActiveRightTab] = useState<'memory' | 'plan'>('memory');
  const [messages, setMessages] = useState<Message[]>([]);
  const [tripMemory, setTripMemory] = useState<TripMemory | null>(null);
  const [planVersion, setPlanVersion] = useState<PlanVersion | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadTripData();
    }
  }, [id]);

  const loadTripData = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const [messagesData, memoryData, planData, tripData] = await Promise.all([
        messagesService.getByTrip(id),
        memoryService.get(id).catch(() => null),
        planService.get(id).catch(() => null),
        tripsService.getById(id).catch(() => null),
      ]);

      setMessages(messagesData);
      setTripMemory(memoryData);
      setPlanVersion(planData);
      setTrip(tripData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trip data');
    } finally {
      setIsLoading(false);
    }
  };

  const [isAgentThinking, setIsAgentThinking] = useState(false);

  const handleSendMessage = async (content: string) => {
    if (!id) return;

    try {
      // Create human message
      const newMessage = await messagesService.create(id, {
        type: 'human',
        content,
      });
      setMessages([...messages, newMessage]);

      // Trigger agent processing
      setIsAgentThinking(true);
      
      try {
        // Prepare trip context and memory for agent
        const tripContext = trip ? {
          title: trip.title,
          destination: trip.destination,
          dates: trip.dates,
          status: trip.status,
        } : {};
        
        const memoryData = tripMemory ? {
          destination: tripMemory.destination,
          dates: tripMemory.dates,
          budget: tripMemory.budget,
          pace: tripMemory.pace,
          duration: tripMemory.duration,
        } : {};

        // Run agent workflow
        const agentResponse = await agentService.runAgent({
          message: content,
          trip_id: id,
          trip_context: tripContext,
          trip_memory: memoryData,
        });

        // Handle clarification if needed
        if (agentResponse.clarification) {
          const clarificationMessage: Message = {
            id: `clarification-${Date.now()}`,
            trip_id: id,
            type: 'agent',
            content: agentResponse.clarification,
            created_at: new Date().toISOString(),
            has_view_plan: false,
          };
          setMessages(prev => [...prev, clarificationMessage]);
          setIsAgentThinking(false);
          return;
        }

        // Create agent response message if available
        if (agentResponse.response) {
          const agentMessage = await messagesService.create(id, {
            type: 'agent',
            content: agentResponse.response,
          });
          setMessages(prev => [...prev, agentMessage]);
        }

        // Update memory if intent was extracted
        if (agentResponse.intent) {
          // Memory will be updated by backend or we can update here
          // For now, reload memory
          try {
            const updatedMemory = await memoryService.get(id);
            setTripMemory(updatedMemory);
          } catch {
            // Memory may not exist yet, that's okay
          }
        }

        // Reload plan if agent generated one
        if (agentResponse.completed_tasks && Object.keys(agentResponse.completed_tasks).length > 0) {
          try {
            const updatedPlan = await planService.get(id);
            setPlanVersion(updatedPlan);
          } catch {
            // Plan may not exist yet, that's okay
          }
        }

        // Reload all data to ensure consistency
        await loadTripData();
      } catch (agentErr) {
        console.error('Agent error:', agentErr);
        // Don't fail the entire message, just log the error
        // In production, you might want to show a user-friendly error
      } finally {
        setIsAgentThinking(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setIsAgentThinking(false);
    }
  };

  const handleVote = async (messageId: string, conflictId: string, optionKey: string) => {
    if (!id) return;

    try {
      await conflictsService.vote(id, conflictId, optionKey);
      // Reload messages to get updated vote counts
      const updatedMessages = await messagesService.getByTrip(id);
      setMessages(updatedMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to vote');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-gray-600">Loading trip...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <TripSidebar 
        isAgentThinking={isAgentThinking}
        trip={trip}
        tripMemory={tripMemory}
      />
      
      {/* Center Chat Panel */}
      <ChatPanel 
        messages={messages}
        onSendMessage={handleSendMessage}
        onVote={handleVote}
        onViewPlan={() => setActiveRightTab('plan')}
      />
      
      {/* Right Memory/Plan Panel */}
      <MemoryPlanPanel 
        activeTab={activeRightTab}
        setActiveTab={setActiveRightTab}
        tripMemory={tripMemory}
        planVersion={planVersion}
        messages={messages}
      />
    </div>
  );
}
