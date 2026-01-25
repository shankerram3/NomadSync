import { apiClient } from '../lib/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
    if (response.access_token) {
      apiClient.setAccessToken(response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
    }
    return response;
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Backend expects JSON with username and password fields
    const response = await apiClient.post<AuthResponse>('/api/auth/login', {
      username: credentials.email,
      password: credentials.password,
    });
    if (response.access_token) {
      apiClient.setAccessToken(response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
    }
    return response;
  },

  async refreshToken(): Promise<{ access_token: string; token_type: string }> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<{ access_token: string; token_type: string }>(
      '/api/auth/refresh',
      { refresh_token: refreshToken }
    );
    
    if (response.access_token) {
      apiClient.setAccessToken(response.access_token);
    }
    return response;
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/api/auth/me');
  },

  logout() {
    apiClient.setAccessToken(null);
  },

  isAuthenticated(): boolean {
    return !!apiClient.getAccessToken();
  },
};
