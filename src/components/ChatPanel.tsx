import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Send, Bot, ArrowRight, Sparkles, MapPin, Calendar, DollarSign, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '../services/messages';
import { Conflict, conflictsService } from '../services/conflicts';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  onVote: (messageId: string, conflictId: string, optionKey: string) => void;
  onViewPlan: () => void;
}

export function ChatPanel({ messages, onSendMessage, onVote, onViewPlan }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const quickReplies = ["Budget-friendly options", "More cultural experiences", "Add food tours"];

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h2>Planning Chat</h2>
        <p className="text-sm text-gray-500 mt-1">Collaborate and refine your trip</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <WelcomeMessage />
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {message.type === 'human' ? (
                  <HumanMessage message={message} />
                ) : message.type === 'agent' ? (
                  <AgentMessage message={message} onViewPlan={onViewPlan} />
                ) : message.type === 'conflict' && message.conflict_id ? (
                  <ConflictMessage message={message} onVote={onVote} />
                ) : null}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      <div className="px-6 py-3 border-t border-gray-100">
        <div className="flex gap-2 flex-wrap">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              onClick={() => onSendMessage(reply)}
              className="px-3 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 px-6 py-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add your thoughts, questions, or preferences..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

function WelcomeMessage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center h-full py-12"
    >
      <div className="max-w-2xl w-full space-y-6">
        {/* Welcome Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900">Welcome to your trip planning chat!</h3>
          <p className="text-gray-600">
            I'm your AI travel assistant. Let's start planning your perfect trip together.
          </p>
        </div>

        {/* Suggestion Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">Tell me where to go</h4>
                <p className="text-sm text-gray-600">
                  "I want to visit Tokyo for 7 days in March"
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">Share your dates</h4>
                <p className="text-sm text-gray-600">
                  "Planning a trip from March 15-22, 2024"
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">Set your budget</h4>
                <p className="text-sm text-gray-600">
                  "My budget is $3000 for two people"
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">Describe your group</h4>
                <p className="text-sm text-gray-600">
                  "Traveling with family, need kid-friendly activities"
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Helper Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-500">
            💡 <span className="font-medium">Tip:</span> You can share details naturally, and I'll extract what I need to build your trip plan.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

function HumanMessage({ message }: { message: Message }) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
          {message.author_id ? message.author_id.slice(0, 2).toUpperCase() : 'U'}
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">User</span>
          <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
        </div>
        <div className="bg-gray-50 px-4 py-3 rounded-lg inline-block max-w-2xl">
          <p className="text-sm text-gray-800">{message.content}</p>
        </div>
      </div>
    </div>
  );
}

function AgentMessage({ message, onViewPlan }: { message: Message; onViewPlan: () => void }) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-blue-600" />
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium text-blue-600">Travel Agent</span>
          <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
        </div>
        <div className="bg-blue-50 border border-blue-100 px-4 py-3 rounded-lg max-w-2xl">
          <p className="text-sm text-gray-800 mb-2">{message.content}</p>
          {message.summary && (
            <p className="text-xs text-blue-700 mb-3 border-t border-blue-200 pt-2">
              {message.summary}
            </p>
          )}
          {message.questions && message.questions.length > 0 && (
            <div className="space-y-2 mt-3">
              <p className="text-xs font-medium text-gray-700">Questions:</p>
              {message.questions.map((q, i) => (
                <div key={i} className="bg-white px-3 py-2 rounded text-xs text-gray-700">
                  {q}
                </div>
              ))}
            </div>
          )}
          {message.has_view_plan && (
            <button
              onClick={onViewPlan}
              className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View updated plan
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ConflictMessage({ message, onVote }: { message: Message; onVote: (messageId: string, conflictId: string, optionKey: string) => void }) {
  const [conflict, setConflict] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userVote, setUserVote] = useState<string | null>(null);
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    const fetchConflict = async () => {
      if (!message.conflict_id || !message.trip_id) return;
      
      try {
        setIsLoading(true);
        const conflictData = await conflictsService.getById(message.trip_id, message.conflict_id);
        setConflict(conflictData);
        
        // Find user's vote (if any)
        // Note: We'd need user ID from context, for now we'll just display votes
        const allVotes = conflictData.options.flatMap((opt: any) => opt.votes || []);
        // In a real implementation, we'd check against current user ID
        // setUserVote(option key that user voted for)
      } catch (err) {
        console.error('Failed to fetch conflict:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConflict();
  }, [message.conflict_id, message.trip_id]);

  if (!message.conflict_id) return null;

  const handleVoteClick = async (optionKey: string) => {
    if (!message.conflict_id || !message.trip_id) return;
    
    try {
      await onVote(message.id, message.conflict_id, optionKey);
      setUserVote(optionKey);
      // Reload conflict to get updated vote counts
      const conflictData = await conflictsService.getById(message.trip_id, message.conflict_id);
      setConflict(conflictData);
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-yellow-600" />
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium text-yellow-600">Travel Agent</span>
          <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-lg max-w-2xl">
          <p className="text-sm text-gray-800 mb-3">{message.content}</p>
          
          {isLoading ? (
            <p className="text-xs text-gray-600">Loading conflict options...</p>
          ) : conflict && conflict.options && conflict.options.length > 0 ? (
            <div className="space-y-2 mt-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Vote on your preference:</p>
              {conflict.options.map((option: any) => {
                const voteCount = option.votes?.length || 0;
                const isSelected = userVote === option.key;
                return (
                  <button
                    key={option.key}
                    onClick={() => handleVoteClick(option.key)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-yellow-500 bg-yellow-100'
                        : 'border-yellow-200 bg-white hover:border-yellow-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{option.title}</p>
                        {option.description && (
                          <p className="text-xs text-gray-600 mt-1">{option.description}</p>
                        )}
                      </div>
                      <div className="ml-3 text-xs text-gray-500">
                        {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-600">No conflict options available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
