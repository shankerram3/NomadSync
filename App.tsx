import React, { useState } from 'react';
import { Planner } from './components/Planner';
import { ExpenseSplitter } from './components/ExpenseSplitter';
import { ItineraryBuilder } from './components/ItineraryBuilder';
import { ChatSidebar } from './components/ChatSidebar';
import { AppView } from './types';
import { MapIcon, DollarSignIcon, UserGroupIcon, MessageSquareIcon, XIcon } from './components/Icons';
import { ChatProvider, useChat } from './contexts/ChatContext';
import { ItineraryProvider } from './contexts/ItineraryContext';
import { ExpenseProvider } from './contexts/ExpenseContext';

// Inner App component that uses hooks
const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.PLANNER);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(true); // Open by default on desktop
  const [isRightSidePanelOpen, setIsRightSidePanelOpen] = useState(false);
  const { 
    sessions, 
    currentSessionId, 
    createNewSession, 
    selectSession, 
    deleteSession 
  } = useChat();

  const toggleChatSidebar = () => {
    setIsChatSidebarOpen(!isChatSidebarOpen);
  };

  const toggleRightSidePanel = () => {
    if (currentView === AppView.PLANNER) return;
    setIsRightSidePanelOpen(!isRightSidePanelOpen);
  };

  const handleViewChange = (view: AppView) => {
    setCurrentView(view);
    if (view === AppView.PLANNER) {
      setIsRightSidePanelOpen(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-100 font-sans text-slate-900 overflow-hidden relative">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between flex-shrink-0 z-20 relative shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white">
            <MapIcon className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            NomadSync
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Chat Sidebar Toggle - Only in Planner View */}
           {currentView === AppView.PLANNER && (
               <button 
                onClick={toggleChatSidebar}
                className={`p-2 rounded-lg transition-colors relative ${isChatSidebarOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
                title="Toggle Chat History"
               >
                   <MessageSquareIcon className="w-5 h-5" />
               </button>
           )}
           
           {/* Chat History Toggle - Visible if not in Planner View */}
           {currentView !== AppView.PLANNER && (
               <button 
                onClick={toggleRightSidePanel}
                className={`p-2 rounded-lg transition-colors relative ${isRightSidePanelOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
                title="Toggle Chat History"
               >
                   <MessageSquareIcon className="w-5 h-5" />
                   {isRightSidePanelOpen && <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>}
               </button>
           )}

          <div className="hidden sm:flex items-center gap-4 border-l border-slate-200 pl-4">
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900">My Trips</button>
            <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
              <img src="https://picsum.photos/100/100" alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex">
        {/* Chat Sidebar - Only visible in Planner view */}
        {currentView === AppView.PLANNER && (
          <ChatSidebar
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={selectSession}
            onNewChat={createNewSession}
            onDeleteSession={deleteSession}
            isOpen={isChatSidebarOpen}
            onClose={() => setIsChatSidebarOpen(false)}
          />
        )}

        {/* Content Container */}
        <div className={`
          flex-1 flex flex-col relative transition-all duration-300
          ${currentView === AppView.PLANNER && isChatSidebarOpen ? 'lg:ml-64 xl:ml-72' : ''}
          ${isRightSidePanelOpen && currentView !== AppView.PLANNER ? 'mr-0 lg:mr-96' : ''}
        `}>
            {currentView === AppView.PLANNER && <Planner />}
            {currentView === AppView.EXPENSES && <ExpenseSplitter />}
            {currentView === AppView.ITINERARY && <ItineraryBuilder />}
        </div>

        {/* Right Side Panel (Drawer) - For non-Planner views */}
        {/* Overlay for mobile */}
        {isRightSidePanelOpen && currentView !== AppView.PLANNER && (
            <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
                onClick={() => setIsRightSidePanelOpen(false)}
            />
        )}
        
        {/* Drawer Content - Right Side */}
        {currentView !== AppView.PLANNER && (
          <div className={`fixed top-[61px] bottom-[64px] right-0 w-full sm:w-96 bg-white shadow-2xl border-l border-slate-200 z-40 transform transition-transform duration-300 ease-in-out flex flex-col
              ${isRightSidePanelOpen ? 'translate-x-0' : 'translate-x-full'}
          `}>
              <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                      <MessageSquareIcon className="w-4 h-4 text-blue-500" />
                      Chat History
                  </h3>
                  <button onClick={() => setIsRightSidePanelOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200">
                      <XIcon className="w-5 h-5" />
                  </button>
              </div>
              <div className="flex-1 overflow-hidden">
                  <Planner />
              </div>
          </div>
        )}
      </main>

      {/* Bottom Tab Navigation (Mobile First Design) */}
      <nav className="bg-white border-t border-slate-200 pb-safe flex-shrink-0 z-50">
        <div className="flex justify-around items-center h-16 max-w-3xl mx-auto">
          <button 
            onClick={() => handleViewChange(AppView.PLANNER)}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${currentView === AppView.PLANNER ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <MapIcon className={`w-6 h-6 ${currentView === AppView.PLANNER ? 'fill-current opacity-20' : ''}`} />
            <span className="text-[10px] font-semibold uppercase tracking-wide">Plan</span>
          </button>
          
          <button 
            onClick={() => handleViewChange(AppView.ITINERARY)}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${currentView === AppView.ITINERARY ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <UserGroupIcon className={`w-6 h-6 ${currentView === AppView.ITINERARY ? 'fill-current opacity-20' : ''}`} />
            <span className="text-[10px] font-semibold uppercase tracking-wide">Itinerary</span>
          </button>

          <button 
            onClick={() => handleViewChange(AppView.EXPENSES)}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${currentView === AppView.EXPENSES ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <DollarSignIcon className={`w-6 h-6 ${currentView === AppView.EXPENSES ? 'fill-current opacity-20' : ''}`} />
            <span className="text-[10px] font-semibold uppercase tracking-wide">Split</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

// Main App component with providers
const App: React.FC = () => {
  return (
    <ItineraryProvider>
      <ChatProvider>
        <ExpenseProvider>
          <AppContent />
        </ExpenseProvider>
      </ChatProvider>
    </ItineraryProvider>
  );
};

export default App;