import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TripSidebar } from './TripSidebar';
import { ChatPanel } from './ChatPanel';
import { MemoryPlanPanel } from './MemoryPlanPanel';
import { messagesService, Message } from '../services/messages';
import { memoryService, TripMemory } from '../services/memory';
import { planService, PlanVersion } from '../services/plan';
import { conflictsService } from '../services/conflicts';

export function TripPlanner() {
  const { id } = useParams<{ id: string }>();
  const [activeRightTab, setActiveRightTab] = useState<'memory' | 'plan'>('memory');
  const [messages, setMessages] = useState<Message[]>([]);
  const [tripMemory, setTripMemory] = useState<TripMemory | null>(null);
  const [planVersion, setPlanVersion] = useState<PlanVersion | null>(null);
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
      const [messagesData, memoryData, planData] = await Promise.all([
        messagesService.getByTrip(id),
        memoryService.get(id).catch(() => null),
        planService.get(id).catch(() => null),
      ]);

      setMessages(messagesData);
      setTripMemory(memoryData);
      setPlanVersion(planData);
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
      const newMessage = await messagesService.create(id, {
        type: 'human',
        content,
      });
      setMessages([...messages, newMessage]);

      // TODO: Trigger agent processing
      // For now, just reload messages after a delay
      setIsAgentThinking(true);
      setTimeout(async () => {
        await loadTripData();
        setIsAgentThinking(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
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
      <TripSidebar isAgentThinking={isAgentThinking} />
      
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
