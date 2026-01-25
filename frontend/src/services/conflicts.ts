import { apiClient } from '../lib/api';

export interface ConflictOption {
  key: string;
  title: string;
  description?: string;
  votes: Array<{
    userId: string;
    at: string;
  }>;
}

export interface Conflict {
  id: string;
  trip_id: string;
  message_id: string;
  options: ConflictOption[];
  created_at: string;
}

export interface CreateConflictData {
  message_id: string;
  options: Array<{
    key: string;
    title: string;
    description?: string;
  }>;
}

export const conflictsService = {
  async create(tripId: string, data: CreateConflictData): Promise<Conflict> {
    return apiClient.post<Conflict>(`/api/trips/${tripId}/conflicts`, data);
  },

  async getById(tripId: string, conflictId: string): Promise<Conflict> {
    return apiClient.get<Conflict>(`/api/trips/${tripId}/conflicts/${conflictId}`);
  },

  async vote(tripId: string, conflictId: string, optionKey: string): Promise<void> {
    await apiClient.post(`/api/trips/${tripId}/conflicts/${conflictId}/vote`, {
      option_key: optionKey,
    });
  },
};
