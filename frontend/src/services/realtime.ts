/**
 * Real-time Updates Service
 * Polls for updates to messages, votes, and plan versions
 */

import { messagesService, Message } from './messages';
import { planService, PlanVersion } from './plan';
import { conflictsService, Conflict } from './conflicts';

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
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private lastMessageId: Map<string, string | null> = new Map();
  private lastPlanVersion: Map<string, number | null> = new Map();
  private pollingInterval = 3000; // 3 seconds

  /**
   * Start polling for updates on a trip
   */
  startPolling(tripId: string, callbacks: RealtimeCallbacks): () => void {
    // Stop existing polling for this trip
    this.stopPolling(tripId);

    const interval = setInterval(async () => {
      try {
        // Poll for new messages
        const messages = await messagesService.getByTrip(tripId, 50);
        if (messages.length > 0) {
          const lastId = this.lastMessageId.get(tripId);
          const newMessages = lastId
            ? messages.filter(msg => {
                // Find messages after the last known message
                const msgIndex = messages.findIndex(m => m.id === lastId);
                return msgIndex >= 0 && messages.indexOf(msg) > msgIndex;
              })
            : messages.slice(-5); // First load: get last 5

          if (newMessages.length > 0) {
            this.lastMessageId.set(tripId, messages[messages.length - 1].id);
            newMessages.forEach(msg => callbacks.onMessage?.(msg));
          }
        }

        // Poll for plan updates
        try {
          const latestPlan = await planService.get(tripId);
          const lastVersion = this.lastPlanVersion.get(tripId);
          
          if (!lastVersion || latestPlan.version > lastVersion) {
            this.lastPlanVersion.set(tripId, latestPlan.version);
            callbacks.onPlanUpdate?.(latestPlan);
          }
        } catch {
          // Plan may not exist yet
        }

        // Note: Vote updates are handled through message reloads
        // When a vote is cast, the conflict message is updated, which triggers message polling
      } catch (error) {
        console.error('[REALTIME] Polling error:', error);
      }
    }, this.pollingInterval);

    this.intervals.set(tripId, interval);

    // Return cleanup function
    return () => this.stopPolling(tripId);
  }

  /**
   * Stop polling for a trip
   */
  stopPolling(tripId: string): void {
    const interval = this.intervals.get(tripId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(tripId);
      this.lastMessageId.delete(tripId);
      this.lastPlanVersion.delete(tripId);
    }
  }

  /**
   * Set the last known message ID (after initial load)
   */
  setLastMessageId(tripId: string, messageId: string): void {
    this.lastMessageId.set(tripId, messageId);
  }

  /**
   * Set the last known plan version (after initial load)
   */
  setLastPlanVersion(tripId: string, version: number): void {
    this.lastPlanVersion.set(tripId, version);
  }

  /**
   * Update polling interval
   */
  setPollingInterval(ms: number): void {
    this.pollingInterval = ms;
  }
}

export const realtimeService = new RealtimeService();
