export interface User {
  id: string;
  name: string;
  avatarColor: string;
}

export interface Expense {
  id: string;
  payerId: string;
  amount: number;
  description: string;
  date: string;
  involvedUserIds: string[];
}

export enum MessageSender {
  USER = 'user',
  AI = 'ai'
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeId?: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        content: string;
      }[];
    }[];
  };
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: MessageSender;
  timestamp: Date;
  groundingChunks?: GroundingChunk[];
  isThinking?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export enum AppView {
  PLANNER = 'PLANNER',
  EXPENSES = 'EXPENSES',
  ITINERARY = 'ITINERARY'
}

export type ItineraryType = 'activity' | 'food' | 'lodging' | 'travel';

export interface ItineraryItem {
  id: string;
  title: string;
  location?: string;
  startTime?: string; 
  cost?: number;
  suggestedBy: string;
  votes: string[];
  type: ItineraryType;
  description?: string;
  link?: string;
  isSuggestion: boolean; // true if it's just an idea, false if confirmed on schedule
}