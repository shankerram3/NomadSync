import { apiClient } from '../lib/api';

export interface Message {
  id: string;
  trip_id: string;
  author_id?: string;
  type: 'human' | 'agent' | 'conflict';
  content: string;
  summary?: string;
  questions?: string[];
  conflict_id?: string;
  plan_version_id?: string | null;
  has_view_plan: boolean;
  flights?: Array<{
    airline: string;
    departure: { date: string; time: string };
    arrival: { date: string; time: string };
    price: string;
    returnFlight?: {
      departure: { date: string; time: string };
      arrival: { date: string; time: string };
    };
    isBestValue?: boolean;
  }>;
  created_at: string;
}

export interface CreateMessageData {
  type: 'human' | 'agent';
  content: string;
  summary?: string;
  questions?: string[];
  has_view_plan?: boolean;
  plan_version_id?: string;
  flights?: Array<{
    airline: string;
    departure: { date: string; time: string };
    arrival: { date: string; time: string };
    price: string;
    returnFlight?: {
      departure: { date: string; time: string };
      arrival: { date: string; time: string };
    };
    isBestValue?: boolean;
  }>;
}

export const messagesService = {
  async getByTrip(tripId: string, limit: number = 200, cursor?: string): Promise<Message[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (cursor) {
      params.append('cursor', cursor);
    }
    return apiClient.get<Message[]>(`/api/trips/${tripId}/messages?${params.toString()}`);
  },

  async create(tripId: string, data: CreateMessageData): Promise<Message> {
    return apiClient.post<Message>(`/api/trips/${tripId}/messages`, data);
  },
};
