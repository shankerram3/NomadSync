import { apiClient } from '../lib/api';

export interface Trip {
  id: string;
  title: string;
  destination?: string;
  dates?: {
    start?: string;
    end?: string;
  };
  status: 'draft' | 'planned' | 'booked';
  readiness: number;
  cover_image?: string;
  members: Array<{
    userId: string;
    role: 'owner' | 'editor' | 'viewer';
  }>;
  created_at: string;
  updated_at: string;
}

export interface CreateTripData {
  title: string;
  destination?: string;
  dates?: {
    start?: string;
    end?: string;
  };
  status?: 'draft' | 'planned' | 'booked';
  readiness?: number;
  cover_image?: string;
}

export interface UpdateTripData {
  title?: string;
  destination?: string;
  dates?: {
    start?: string;
    end?: string;
  };
  status?: 'draft' | 'planned' | 'booked';
  readiness?: number;
  cover_image?: string;
}

export const tripsService = {
  async getAll(): Promise<Trip[]> {
    return apiClient.get<Trip[]>('/trips');
  },

  async getById(id: string): Promise<Trip> {
    return apiClient.get<Trip>(`/trips/${id}`);
  },

  async create(data: CreateTripData): Promise<Trip> {
    return apiClient.post<Trip>('/trips', data);
  },

  async update(id: string, data: UpdateTripData): Promise<Trip> {
    return apiClient.patch<Trip>(`/trips/${id}`, data);
  },

  async inviteMember(tripId: string, email: string, role: string = 'editor'): Promise<void> {
    await apiClient.post(`/trips/${tripId}/invite`, { email, role });
  },
};
