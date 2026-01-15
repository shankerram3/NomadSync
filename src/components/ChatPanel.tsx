import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Send, Bot, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '../services/messages';
import { Conflict } from '../services/conflicts';

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
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // For now, show a simple conflict message
  // TODO: Fetch conflict details to show options
  if (!message.conflict_id) return null;

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
          <p className="text-xs text-gray-600">Conflict resolution needed. Options will be loaded when conflict details are fetched.</p>
        </div>
      </div>
    </div>
  );
}
