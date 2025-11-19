import React from 'react';
import { ChatSession } from '../types';
import { PlusIcon, MessageSquareIcon, TrashIcon } from './Icons';

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen,
  onClose
}) => {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getSessionPreview = (session: ChatSession) => {
    const userMessage = session.messages.find(m => m.sender === 'user');
    if (userMessage) {
      return userMessage.text.length > 50 
        ? userMessage.text.substring(0, 50) + '...' 
        : userMessage.text;
    }
    return 'New conversation';
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-[61px] bottom-[64px] left-0 w-64 sm:w-72 bg-white border-r border-slate-200 z-50
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        shadow-lg lg:shadow-none
      `}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Chat History</h2>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-b border-slate-200">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm shadow-blue-500/20"
          >
            <PlusIcon className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              <MessageSquareIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No chat history yet</p>
              <p className="text-xs mt-1">Start a new conversation!</p>
            </div>
          ) : (
            <div className="p-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`
                    group relative p-3 rounded-lg mb-1 cursor-pointer transition-all
                    ${currentSessionId === session.id 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-slate-50 border border-transparent'
                    }
                  `}
                  onClick={() => onSelectSession(session.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquareIcon className={`w-4 h-4 flex-shrink-0 ${currentSessionId === session.id ? 'text-blue-600' : 'text-slate-400'}`} />
                        <h3 className={`font-semibold text-sm truncate ${currentSessionId === session.id ? 'text-blue-900' : 'text-slate-800'}`}>
                          {session.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-1">
                        {getSessionPreview(session)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(session.updatedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all rounded"
                      title="Delete chat"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

