import { apiClient } from '../lib/api';

export interface MemoryField {
  value?: string;
  confidence: number;
  sources: string[];
}

export interface TripMemory {
  id: string;
  trip_id: string;
  destination?: MemoryField;
  dates?: MemoryField;
  budget?: MemoryField;
  pace?: MemoryField;
  duration?: MemoryField;
  updated_at: string;
}

export interface UpdateMemoryData {
  destination?: MemoryField;
  dates?: MemoryField;
  budget?: MemoryField;
  pace?: MemoryField;
  duration?: MemoryField;
}

export const memoryService = {
  async get(tripId: string): Promise<TripMemory> {
    return apiClient.get<TripMemory>(`/trips/${tripId}/memory`);
  },

  async update(tripId: string, data: UpdateMemoryData): Promise<TripMemory> {
    return apiClient.patch<TripMemory>(`/trips/${tripId}/memory`, data);
  },
};
