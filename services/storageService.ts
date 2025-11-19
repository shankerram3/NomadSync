import { ChatMessage, ItineraryItem, Expense, ChatSession } from '../types';

const STORAGE_KEYS = {
  MESSAGES: 'nomadsync_messages',
  CHAT_SESSIONS: 'nomadsync_chat_sessions',
  CURRENT_SESSION_ID: 'nomadsync_current_session_id',
  ITINERARY: 'nomadsync_itinerary',
  EXPENSES: 'nomadsync_expenses',
  USER_LOCATION: 'nomadsync_user_location',
} as const;

// Helper to serialize/deserialize Date objects
const serializeMessages = (messages: ChatMessage[]): string => {
  return JSON.stringify(messages.map(msg => ({
    ...msg,
    timestamp: msg.timestamp.toISOString()
  })));
};

const deserializeMessages = (data: string): ChatMessage[] => {
  try {
    const parsed = JSON.parse(data);
    return parsed.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
  } catch {
    return [];
  }
};

export const storageService = {
  // Messages
  saveMessages: (messages: ChatMessage[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, serializeMessages(messages));
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  },

  loadMessages: (): ChatMessage[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (!data) return [];
      return deserializeMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
      return [];
    }
  },

  // Itinerary Items
  saveItinerary: (items: ItineraryItem[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.ITINERARY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save itinerary:', error);
    }
  },

  loadItinerary: (): ItineraryItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ITINERARY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load itinerary:', error);
      return [];
    }
  },

  // Expenses
  saveExpenses: (expenses: Expense[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch (error) {
      console.error('Failed to save expenses:', error);
    }
  },

  loadExpenses: (): Expense[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      return [];
    }
  },

  // User Location
  saveUserLocation: (location: { latitude: number; longitude: number }): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_LOCATION, JSON.stringify(location));
    } catch (error) {
      console.error('Failed to save user location:', error);
    }
  },

  loadUserLocation: (): { latitude: number; longitude: number } | undefined => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_LOCATION);
      if (!data) return undefined;
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load user location:', error);
      return undefined;
    }
  },

  // Chat Sessions
  saveChatSessions: (sessions: ChatSession[]): void => {
    try {
      const serialized = sessions.map(session => ({
        ...session,
        messages: session.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        })),
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString()
      }));
      localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(serialized));
    } catch (error) {
      console.error('Failed to save chat sessions:', error);
    }
  },

  loadChatSessions: (): ChatSession[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return parsed.map((session: any) => ({
        ...session,
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })),
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt)
      }));
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      return [];
    }
  },

  saveCurrentSessionId: (sessionId: string): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION_ID, sessionId);
    } catch (error) {
      console.error('Failed to save current session ID:', error);
    }
  },

  loadCurrentSessionId: (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION_ID);
    } catch (error) {
      console.error('Failed to load current session ID:', error);
      return null;
    }
  },

  // Clear all data
  clearAll: (): void => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
};

