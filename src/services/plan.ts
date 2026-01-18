import { apiClient } from '../lib/api';

export interface PlanVersion {
  id: string;
  trip_id: string;
  version: number;
  itinerary: Record<string, unknown>;
  created_by?: string;
  created_at: string;
}

export interface CreatePlanData {
  version: number;
  itinerary: Record<string, unknown>;
  created_by?: string;
}

export const planService = {
  async get(tripId: string, version?: number): Promise<PlanVersion> {
    const params = version ? `?version=${version}` : '';
    return apiClient.get<PlanVersion>(`/api/trips/${tripId}/plan${params}`);
  },

  async create(tripId: string, data: CreatePlanData): Promise<PlanVersion> {
    return apiClient.post<PlanVersion>(`/api/trips/${tripId}/plan`, data);
  },

  async listVersions(tripId: string): Promise<PlanVersion[]> {
    return apiClient.get<PlanVersion[]>(`/api/trips/${tripId}/plan/versions`);
  },
};
