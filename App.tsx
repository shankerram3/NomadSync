import React, { useState, useEffect } from 'react';
import { Planner } from './components/Planner';
import { ExpenseSplitter } from './components/ExpenseSplitter';
import { ItineraryBuilder } from './components/ItineraryBuilder';
import { AppView, ItineraryItem, ChatMessage, MessageSender } from './types';
import { INITIAL_USERS } from './constants';
import { MapIcon, DollarSignIcon, UserGroupIcon, MessageSquareIcon, XIcon } from './components/Icons';
import { sendMessageToGemini } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.PLANNER);
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      text: "Hi! I'm NomadSync. I can help you find hotels, rent cars, plan routes, and more using real-time Google Maps data. Where are we going?",
      sender: MessageSender.AI,
      timestamp: new Date()
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  
  // Side Panel State
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  // Initialize Location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => console.log("Location access denied or error:", error)
      );
    }
  }, []);

  // Handlers for collaborative features
  const handleAddItem = (item: ItineraryItem) => {
    setItineraryItems(prev => [...prev, item]);
  };

  const handleRemoveItem = (id: string) => {
      setItineraryItems(prev => prev.filter(i => i.id !== id));
  }

  const handleVote = (itemId: string, userId: string) => {
    setItineraryItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      
      const hasVoted = item.votes.includes(userId);
      return {
        ...item,
        votes: hasVoted 
          ? item.votes.filter(id => id !== userId) 
          : [...item.votes, userId]
      };
    }));
  };

  // Bridge function from Chat to Itinerary
  const handleAddFromChat = (title: string, uri: string) => {
    const newItem: ItineraryItem = {
        id: Date.now().toString(),
        title,
        location: title,
        type: 'activity',
        suggestedBy: INITIAL_USERS[0].id,
        votes: [INITIAL_USERS[0].id],
        isSuggestion: true,
        link: uri
    };
    handleAddItem(newItem);
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        text,
        sender: MessageSender.USER,
        timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    const thinkingMsgId = 'thinking-' + Date.now();
    setMessages(prev => [...prev, {
        id: thinkingMsgId,
        text: "Searching the map...",
        sender: MessageSender.AI,
        timestamp: new Date(),
        isThinking: true
    }]);

    try {
        const response = await sendMessageToGemini(text, messages, userLocation);
        
        setMessages(prev => {
            const filtered = prev.filter(m => m.id !== thinkingMsgId);
            return [...filtered, {
                id: Date.now().toString(),
                text: response.text,
                sender: MessageSender.AI,
                timestamp: new Date(),
                groundingChunks: response.groundingChunks
            }];
        });
    } catch (error) {
        console.error(error);
        setMessages(prev => prev.filter(m => m.id !== thinkingMsgId));
    } finally {
        setIsChatLoading(false);
    }
  };

  const toggleSidePanel = () => {
    if (currentView === AppView.PLANNER) return;
    setIsSidePanelOpen(!isSidePanelOpen);
  };

  const handleViewChange = (view: AppView) => {
      setCurrentView(view);
      // If switching TO planner, close side panel as it's redundant
      if (view === AppView.PLANNER) {
          setIsSidePanelOpen(false);
      }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-100 font-sans text-slate-900 overflow-hidden relative">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between flex-shrink-0 z-20 relative shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white">
            <MapIcon className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            NomadSync
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Chat History Toggle - Visible if not in Planner View */}
           {currentView !== AppView.PLANNER && (
               <button 
                onClick={toggleSidePanel}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors relative border ${isSidePanelOpen ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                title="Toggle Chat History"
               >
                   <MessageSquareIcon className="w-4 h-4" />
                   <span className="text-sm font-medium">Chat</span>
                   {isSidePanelOpen && <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></span>}
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
        {/* Content Container */}
        <div className={`flex-1 flex flex-col relative transition-all duration-300 ${isSidePanelOpen ? 'ml-0 lg:ml-96' : ''}`}>
            {currentView === AppView.PLANNER && (
                <Planner 
                    messages={messages}
                    isLoading={isChatLoading}
                    onSendMessage={handleSendMessage}
                    onAddToItinerary={handleAddFromChat}
                    hasLocation={!!userLocation}
                />
            )}
            {currentView === AppView.EXPENSES && <ExpenseSplitter />}
            {currentView === AppView.ITINERARY && (
                <ItineraryBuilder 
                    items={itineraryItems} 
                    onAddItem={handleAddItem} 
                    onVote={handleVote}
                    onRemoveItem={handleRemoveItem}
                />
            )}
        </div>

        {/* Side Panel (Drawer) */}
        {/* Overlay for mobile */}
        {isSidePanelOpen && (
            <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
                onClick={() => setIsSidePanelOpen(false)}
            />
        )}
        
        {/* Drawer Content - Left Side */}
        <div className={`fixed top-16 bottom-16 left-0 w-full sm:w-96 bg-white shadow-2xl border-r border-slate-200 z-40 transform transition-transform duration-300 ease-in-out flex flex-col
            ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'}
            ${currentView === AppView.PLANNER ? 'hidden' : ''} 
        `}>
            <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50 h-[52px]">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <MessageSquareIcon className="w-4 h-4 text-blue-500" />
                    Chat History
                </h3>
                <button onClick={() => setIsSidePanelOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200">
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-1 overflow-hidden">
                <Planner 
                    messages={messages}
                    isLoading={isChatLoading}
                    onSendMessage={handleSendMessage}
                    onAddToItinerary={handleAddFromChat}
                    hasLocation={!!userLocation}
                />
            </div>
        </div>
      </main>

      {/* Bottom Tab Navigation (Mobile First Design) */}
      <nav className="bg-white border-t border-slate-200 pb-safe flex-shrink-0 z-50 h-16">
        <div className="flex justify-around items-center h-full max-w-3xl mx-auto">
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

export default App;