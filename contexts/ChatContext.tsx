import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ChatMessage, MessageSender, ItineraryItem, ChatSession } from '../types';
import { INITIAL_USERS } from '../constants';
import { sendMessageToGemini } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { useItinerary } from './ItineraryContext';

interface ChatContextType {
  messages: ChatMessage[];
  sessions: ChatSession[];
  currentSessionId: string | null;
  isChatLoading: boolean;
  userLocation: { latitude: number; longitude: number } | undefined;
  sendMessage: (text: string) => Promise<void>;
  addToItinerary: (title: string, uri: string) => void;
  createNewSession: () => void;
  selectSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { addItem } = useItinerary();
  
  // Load sessions from localStorage
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    return storageService.loadChatSessions();
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    return storageService.loadCurrentSessionId();
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Load user location from localStorage first, then try geolocation
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | undefined>(() => {
    return storageService.loadUserLocation();
  });

  // Initialize Location - Try geolocation if not already loaded
  useEffect(() => {
    if (!userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(location);
          storageService.saveUserLocation(location);
        },
        (error) => {
          console.log("Location access denied or error:", error);
          // Don't show error to user, app works without location
        }
      );
    }
  }, [userLocation]);

  // Load messages when session changes (but not when we're updating the session ourselves)
  useEffect(() => {
    if (currentSessionId) {
      const session = sessions.find(s => s.id === currentSessionId);
      if (session) {
        // Only update if messages are actually different (prevent infinite loop)
        setMessages(prev => {
          const sessionMessages = session.messages;
          // Compare by length and IDs to avoid unnecessary updates
          if (prev.length !== sessionMessages.length || 
              prev.some((msg, idx) => msg.id !== sessionMessages[idx]?.id)) {
            return sessionMessages;
          }
          return prev;
        });
      } else {
        setMessages([]);
      }
    } else {
      // No session selected, show welcome message
      setMessages(prev => {
        if (prev.length === 0 || prev[0]?.id !== 'welcome') {
          return [
            {
              id: 'welcome',
              text: "Hi! I'm NomadSync. I can help you find hotels, rent cars, plan routes, and more using real-time Google Maps data. Where are we going?",
              sender: MessageSender.AI,
              timestamp: new Date()
            }
          ];
        }
        return prev;
      });
    }
  }, [currentSessionId, sessions]);

  // Persist sessions to localStorage whenever they change
  useEffect(() => {
    storageService.saveChatSessions(sessions);
  }, [sessions]);

  // Persist current session ID
  useEffect(() => {
    if (currentSessionId) {
      storageService.saveCurrentSessionId(currentSessionId);
    }
  }, [currentSessionId]);

  // Update session when messages change (but prevent infinite loop)
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      setSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
          // Check if messages actually changed to prevent infinite loop
          const messagesChanged = session.messages.length !== messages.length ||
            session.messages.some((msg, idx) => msg.id !== messages[idx]?.id);
          
          if (!messagesChanged) {
            return session; // No change, return same session
          }

          // Generate title from first user message if not set
          let title = session.title;
          if (title === 'New Chat' || !title) {
            const firstUserMessage = messages.find(m => m.sender === MessageSender.USER);
            if (firstUserMessage) {
              title = firstUserMessage.text.length > 30 
                ? firstUserMessage.text.substring(0, 30) + '...' 
                : firstUserMessage.text;
            }
          }
          return {
            ...session,
            messages,
            title,
            updatedAt: new Date()
          };
        }
        return session;
      }));
    }
  }, [messages, currentSessionId]);

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [
        {
          id: 'welcome',
          text: "Hi! I'm NomadSync. I can help you find hotels, rent cars, plan routes, and more using real-time Google Maps data. Where are we going?",
          sender: MessageSender.AI,
          timestamp: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages(newSession.messages);
    return newSession.id;
  }, []);

  const sendMessage = async (text: string) => {
    // Create new session if none exists
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = createNewSession();
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: MessageSender.USER,
      timestamp: new Date()
    };

    let currentMessages: ChatMessage[] = [];
    setMessages(prev => {
      currentMessages = [...prev, userMsg];
      return currentMessages;
    });
    setIsChatLoading(true);

    const thinkingMsgId = 'thinking-' + Date.now();
    setMessages(prev => {
      currentMessages = [...prev, {
        id: thinkingMsgId,
        text: "Searching the map...",
        sender: MessageSender.AI,
        timestamp: new Date(),
        isThinking: true
      }];
      return currentMessages;
    });

    try {
      // Get current messages (excluding thinking message) for API call
      const messagesForAPI = currentMessages.filter(m => m.id !== thinkingMsgId && !m.isThinking);
      const response = await sendMessageToGemini(text, messagesForAPI, userLocation);
      
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
    } catch (error: any) {
      console.error('Error sending message:', error);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== thinkingMsgId);
        return [...filtered, {
          id: Date.now().toString(),
          text: error?.message || "Sorry, I encountered an unexpected error. Please try again.",
          sender: MessageSender.AI,
          timestamp: new Date()
        }];
      });
    } finally {
      setIsChatLoading(false);
    }
  };


  const selectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setMessages(session.messages);
    }
  }, [sessions]);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      // If deleting current session, select first remaining or create new
      if (currentSessionId === sessionId) {
        if (filtered.length > 0) {
          setCurrentSessionId(filtered[0].id);
          setMessages(filtered[0].messages);
        } else {
          setCurrentSessionId(null);
          setMessages([
            {
              id: 'welcome',
              text: "Hi! I'm NomadSync. I can help you find hotels, rent cars, plan routes, and more using real-time Google Maps data. Where are we going?",
              sender: MessageSender.AI,
              timestamp: new Date()
            }
          ]);
        }
      }
      return filtered;
    });
  }, [currentSessionId]);

  const addToItinerary = (title: string, uri: string) => {
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
    addItem(newItem);
  };

  const value: ChatContextType = {
    messages,
    sessions,
    currentSessionId,
    isChatLoading,
    userLocation,
    sendMessage,
    addToItinerary,
    createNewSession,
    selectSession,
    deleteSession
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

