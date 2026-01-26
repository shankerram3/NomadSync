/**
 * Real-time Updates Service using Server-Sent Events (SSE)
 * Connects to SSE endpoint for push-based updates
 */

import { Message } from './messages';
import { PlanVersion } from './plan';
import { Conflict } from './conflicts';
import { apiClient } from '../lib/api';

export interface RealtimeUpdate {
  type: 'message' | 'plan' | 'conflict' | 'vote';
  data: Message | PlanVersion | Conflict | { conflict_id: string; option_key: string; votes: number };
  timestamp: Date;
}

export interface RealtimeCallbacks {
  onMessage?: (message: Message) => void;
  onPlanUpdate?: (plan: PlanVersion) => void;
  onConflictUpdate?: (conflict: Conflict) => void;
  onVoteUpdate?: (conflictId: string, optionKey: string, votes: number) => void;
}

class RealtimeService {
  private eventSources: Map<string, EventSource> = new Map();
  private lastPlanVersion: Map<string, number | null> = new Map();

  /**
   * Start SSE connection for real-time updates on a trip
   */
  startPolling(tripId: string, callbacks: RealtimeCallbacks): () => void {
    // Stop existing connection for this trip
    this.stopPolling(tripId);

    // Get auth token from localStorage
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('[REALTIME] No auth token found');
      return () => {};
    }

    // Create SSE connection with token as query parameter
    // (EventSource doesn't support custom headers)
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const url = `${baseUrl}/api/trips/${tripId}/realtime?token=${encodeURIComponent(token)}`;
    
    const eventSource = new EventSource(url);

    // Handle message events
    eventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.connected) {
          console.log('[REALTIME] Connected to SSE stream');
          return;
        }
        const message = data as Message;
        callbacks.onMessage?.(message);
      } catch (error) {
        console.error('[REALTIME] Error parsing message event:', error);
      }
    });

    // Handle plan events
    eventSource.addEventListener('plan', (event) => {
      try {
        const plan = JSON.parse(event.data) as PlanVersion;
        const lastVersion = this.lastPlanVersion.get(tripId);
        
        // Only trigger callback if version is newer
        if (!lastVersion || plan.version > lastVersion) {
          this.lastPlanVersion.set(tripId, plan.version);
          callbacks.onPlanUpdate?.(plan);
        }
      } catch (error) {
        console.error('[REALTIME] Error parsing plan event:', error);
      }
    });

    // Handle conflict events
    eventSource.addEventListener('conflict', (event) => {
      try {
        const conflict = JSON.parse(event.data) as Conflict;
        callbacks.onConflictUpdate?.(conflict);
      } catch (error) {
        console.error('[REALTIME] Error parsing conflict event:', error);
      }
    });

    // Handle vote events
    eventSource.addEventListener('vote', (event) => {
      try {
        const data = JSON.parse(event.data);
        callbacks.onVoteUpdate?.(data.conflict_id, data.option_key, data.votes);
      } catch (error) {
        console.error('[REALTIME] Error parsing vote event:', error);
      }
    });

    // Handle connection errors
    eventSource.onerror = (error) => {
      console.error('[REALTIME] SSE connection error:', error);
      // EventSource will automatically attempt to reconnect
    };

    // Handle connection open
    eventSource.onopen = () => {
      console.log('[REALTIME] SSE connection opened');
    };

    this.eventSources.set(tripId, eventSource);

    // Return cleanup function
    return () => this.stopPolling(tripId);
  }

  /**
   * Stop SSE connection for a trip
   */
  stopPolling(tripId: string): void {
    const eventSource = this.eventSources.get(tripId);
    if (eventSource) {
      eventSource.close();
      this.eventSources.delete(tripId);
      this.lastPlanVersion.delete(tripId);
    }
  }

  /**
   * Set the last known message ID (after initial load)
   * Note: No longer needed with SSE, but kept for compatibility
   */
  setLastMessageId(tripId: string, messageId: string): void {
    // No-op with SSE
  }

  /**
   * Set the last known plan version (after initial load)
   */
  setLastPlanVersion(tripId: string, version: number): void {
    this.lastPlanVersion.set(tripId, version);
  }

  /**
   * Update polling interval
   * Note: No longer applicable with SSE, but kept for compatibility
   */
  setPollingInterval(ms: number): void {
    // No-op with SSE
  }
}

export const realtimeService = new RealtimeService();
