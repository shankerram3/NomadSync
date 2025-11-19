import React, { useState, useEffect, useRef } from 'react';
import { MessageSender } from '../types';
import { SendIcon, MapPinIcon } from './Icons';
import { PlaceCard } from './PlaceCard';
import { MarkdownRenderer } from './MarkdownRenderer';
import { RouteMap } from './RouteMap';
import { SUGGESTED_PROMPTS } from '../constants';
import { useChat } from '../contexts/ChatContext';

export const Planner: React.FC = () => {
  const { messages, isChatLoading, userLocation, sendMessage, addToItinerary } = useChat();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isChatLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    sendMessage(prompt);
  };

  // Extract location names from message text for route mapping
  const extractLocations = (text: string): string[] => {
    const locations: string[] = [];
    
    // Words/phrases that are NOT location names (should be filtered out)
    const invalidLocationWords = [
      'route', 'scenic stops', 'scenic stop', 'stops', 'stop',
      'waypoint', 'destination', 'origin', 'start', 'end',
      'directions', 'map', 'location', 'place', 'places'
    ];
    
    // Helper to check if a location name is valid
    const isValidLocation = (loc: string): boolean => {
      const lower = loc.toLowerCase().trim();
      if (lower.length < 2) return false;
      
      // Check against invalid words
      if (invalidLocationWords.includes(lower)) return false;
      if (invalidLocationWords.some(word => lower === word || lower.includes(` ${word}`) || lower.startsWith(`${word} `))) {
        return false;
      }
      
      // Skip if it's just descriptive text
      if (/^(route|scenic|stops?|waypoint|destination|origin)$/i.test(loc)) return false;
      if (/\b(route|scenic|stops?|waypoint)\b/i.test(loc)) return false;
      
      return true;
    };
    
    // Pattern 1: Numbered list with bold locations (1. **Location Name**)
    const numberedBoldPattern = /\d+\.\s+\*\*([^*]+)\*\*/g;
    let match;
    while ((match = numberedBoldPattern.exec(text)) !== null) {
      const location = match[1].trim();
      // Clean up location name (remove trailing colons, etc.)
      const cleanLocation = location.replace(/[:;]$/, '').trim();
      if (cleanLocation && isValidLocation(cleanLocation) && !locations.includes(cleanLocation)) {
        locations.push(cleanLocation);
      }
    }
    
    // Pattern 2: Bold text followed by colon (**Location:**) - but skip if it's descriptive
    const boldColonPattern = /\*\*([^*:]+):\*\*/g;
    while ((match = boldColonPattern.exec(text)) !== null) {
      const location = match[1].trim();
      if (location && isValidLocation(location) && !locations.includes(location)) {
        locations.push(location);
      }
    }
    
    // Only use explicitly mentioned locations, don't add common locations automatically
    // This prevents adding locations that aren't actually in the route
    
    // If we found locations, try to order them logically (SF -> LA route)
    if (locations.length > 0) {
      const orderedLocations: string[] = [];
      const locationOrder = ['San Francisco', 'SF', 'Monterey', 'Carmel', 'Carmel-by-the-Sea', 
                             'Big Sur', 'Bixby Bridge', 'San Simeon', 'Hearst Castle',
                             'Morro Bay', 'Pismo Beach', 'Santa Barbara', 'Malibu', 
                             'Los Angeles', 'LA'];
      
      // Add locations in route order if they exist
      locationOrder.forEach(loc => {
        const found = locations.find(l => 
          l.toLowerCase() === loc.toLowerCase() || 
          (loc === 'SF' && l === 'San Francisco') ||
          (loc === 'LA' && l === 'Los Angeles')
        );
        if (found) {
          orderedLocations.push(found);
        }
      });
      
      // Add any remaining locations that weren't in the predefined order
      locations.forEach(loc => {
        if (!orderedLocations.includes(loc)) {
          orderedLocations.push(loc);
        }
      });
      
      return orderedLocations;
    }
    
    return locations;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-32 sm:pb-24 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === MessageSender.USER ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-5 py-3.5 shadow-sm text-sm sm:text-base leading-relaxed
              ${msg.sender === MessageSender.USER 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              } ${msg.isThinking ? 'animate-pulse opacity-70' : ''}`}>
              
              {/* Render text with markdown formatting */}
              {msg.sender === MessageSender.USER ? (
                // User messages: simple text
                msg.text.split('\n').map((line, i) => (
                  <p key={i} className="min-h-[1rem] mb-1 last:mb-0">{line}</p>
                ))
              ) : (
                // AI messages: formatted markdown
                <MarkdownRenderer text={msg.text} />
              )}
            </div>
            
            {/* Route Map - Show for AI messages with locations */}
            {msg.sender === MessageSender.AI && !msg.isThinking && (
              <RouteMap 
                groundingChunks={msg.groundingChunks}
                locations={extractLocations(msg.text)}
              />
            )}
            
            {/* Map Cards Horizontal Scroll */}
            {msg.groundingChunks && msg.groundingChunks.length > 0 && (
              <div className="w-full mt-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex gap-3">
                  {msg.groundingChunks.map((chunk, idx) => (
                    <PlaceCard 
                        key={`${msg.id}-chunk-${idx}`} 
                        chunk={chunk} 
                        onAddToItinerary={addToItinerary}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <span className="text-xs text-slate-400 mt-1 px-1">
              {msg.sender === 'ai' ? 'NomadSync AI' : 'You'} • {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
        {/* Suggestions - Only show if messages length is small (just welcome) */}
        {messages.length < 2 && (
           <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide">
             {SUGGESTED_PROMPTS.map((prompt, i) => (
               <button 
                key={i}
                onClick={() => handleSuggestionClick(prompt)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100 hover:bg-blue-100 transition-colors"
               >
                 {prompt}
               </button>
             ))}
           </div>
        )}

        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about hotels, routes, or places to eat..."
              className="w-full pl-4 pr-12 py-3 bg-slate-100 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none text-slate-800 placeholder-slate-400 max-h-32 min-h-[3rem]"
              rows={1}
              style={{ minHeight: '48px' }}
            />
            <div className="absolute right-3 bottom-3 text-slate-400">
               {userLocation && <MapPinIcon className="w-4 h-4 text-blue-500" title="Location active" />}
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={isChatLoading || !input.trim()}
            className={`p-3 rounded-xl flex items-center justify-center transition-all duration-200
              ${isChatLoading || !input.trim() 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30'
              }`}
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};