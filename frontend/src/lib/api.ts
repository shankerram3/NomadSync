const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ApiError {
  detail: string;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage on init
    this.accessToken = localStorage.getItem('access_token');
  }

  /**
   * Normalize endpoint to avoid double /api prefix.
   * If baseUrl already ends with /api and endpoint starts with /api/, remove one /api.
   */
  private normalizeEndpoint(endpoint: string): string {
    // Normalize both baseUrl and endpoint
    const baseUrlTrimmed = this.baseUrl.trim().replace(/\/+$/, ''); // Remove trailing slashes
    const endpointTrimmed = endpoint.trim();
    
    // If baseUrl ends with '/api' (including just '/api'), and endpoint starts with '/api/', remove '/api' from endpoint
    if (baseUrlTrimmed === '/api' || baseUrlTrimmed.endsWith('/api')) {
      if (endpointTrimmed.startsWith('/api/')) {
        // Remove '/api' prefix from endpoint
        const normalized = endpointTrimmed.substring(4);
        // Ensure it starts with '/' (in case endpoint was just '/api/')
        return normalized.startsWith('/') ? normalized : '/' + normalized;
      } else if (endpointTrimmed === '/api') {
        return ''; // Edge case: endpoint is just '/api'
      }
    }
    return endpointTrimmed;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  getAccessToken(): string | null {
    // Always read from localStorage to get the latest token
    // This ensures we have the most up-to-date token even after navigation
    const token = localStorage.getItem('access_token');
    // Keep cached value in sync
    this.accessToken = token;
    return token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    let url = `${this.baseUrl}${normalizedEndpoint}`;
    
    // Final safety check: remove double /api if somehow it slipped through
    // Replace /api/api/ with /api/ (but preserve single /api/)
    url = url.replace(/\/api\/api\//g, '/api/');
    const token = this.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid - clear token and let ProtectedRoute handle redirect
        this.setAccessToken(null);
        // Dispatch a custom event that components can listen to
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw new Error('Unauthorized');
      }

      let errorMessage = 'An error occurred';
      try {
        const error: ApiError = await response.json();
        errorMessage = error.detail || errorMessage;
      } catch {
        errorMessage = response.statusText;
      }
      throw new Error(errorMessage);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return {} as T;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Form data for OAuth2 login
  async postForm<T>(endpoint: string, formData: FormData): Promise<T> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    let url = `${this.baseUrl}${normalizedEndpoint}`;
    
    // Final safety check: remove double /api if somehow it slipped through
    url = url.replace(/\/api\/api\//g, '/api/');
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.setAccessToken(null);
        throw new Error('Unauthorized');
      }

      let errorMessage = 'An error occurred';
      try {
        const error: ApiError = await response.json();
        errorMessage = error.detail || errorMessage;
      } catch {
        errorMessage = response.statusText;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
