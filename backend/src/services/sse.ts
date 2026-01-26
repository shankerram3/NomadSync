/**
 * Server-Sent Events (SSE) Service
 * Manages SSE connections and broadcasts updates to connected clients
 */

import { Response } from 'express';

export interface SSEClient {
  tripId: string;
  userId: string;
  response: Response;
}

export type EventType = 'message' | 'plan' | 'conflict' | 'vote';

export interface SSEEvent {
  type: EventType;
  trip_id: string;
  data: any;
}

class SSEService {
  private clients: Map<string, SSEClient[]> = new Map(); // tripId -> clients[]

  /**
   * Register a new SSE client connection
   */
  addClient(tripId: string, userId: string, response: Response): () => void {
    const client: SSEClient = { tripId, userId, response };
    
    if (!this.clients.has(tripId)) {
      this.clients.set(tripId, []);
    }
    
    this.clients.get(tripId)!.push(client);
    
    // Set up SSE headers
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    
    // Send initial connection message
    this.sendToClient(client, { type: 'message', trip_id: tripId, data: { connected: true } });
    
    // Handle client disconnect
    response.on('close', () => {
      this.removeClient(tripId, userId, response);
    });
    
    // Return cleanup function
    return () => this.removeClient(tripId, userId, response);
  }

  /**
   * Remove a client connection
   */
  private removeClient(tripId: string, userId: string, response: Response): void {
    const clients = this.clients.get(tripId);
    if (clients) {
      const index = clients.findIndex(
        c => c.userId === userId && c.response === response
      );
      if (index >= 0) {
        clients.splice(index, 1);
        if (clients.length === 0) {
          this.clients.delete(tripId);
        }
      }
    }
  }

  /**
   * Send an event to a specific client
   */
  private sendToClient(client: SSEClient, event: SSEEvent): void {
    try {
      const data = JSON.stringify(event.data);
      client.response.write(`event: ${event.type}\n`);
      client.response.write(`data: ${data}\n\n`);
    } catch (error) {
      console.error('[SSE] Error sending to client:', error);
      this.removeClient(client.tripId, client.userId, client.response);
    }
  }

  /**
   * Broadcast an event to all clients subscribed to a trip
   */
  broadcast(tripId: string, event: SSEEvent): void {
    const clients = this.clients.get(tripId);
    if (!clients) {
      return;
    }

    const data = JSON.stringify(event.data);
    const message = `event: ${event.type}\ndata: ${data}\n\n`;

    // Send to all clients, removing dead connections
    const activeClients: SSEClient[] = [];
    for (const client of clients) {
      try {
        client.response.write(message);
        activeClients.push(client);
      } catch (error) {
        // Client disconnected, skip it
        console.log(`[SSE] Client disconnected for trip ${tripId}`);
      }
    }

    // Update clients list
    if (activeClients.length === 0) {
      this.clients.delete(tripId);
    } else {
      this.clients.set(tripId, activeClients);
    }
  }

  /**
   * Broadcast a message event
   */
  broadcastMessage(tripId: string, message: any): void {
    this.broadcast(tripId, {
      type: 'message',
      trip_id: tripId,
      data: message,
    });
  }

  /**
   * Broadcast a plan update event
   */
  broadcastPlan(tripId: string, plan: any): void {
    this.broadcast(tripId, {
      type: 'plan',
      trip_id: tripId,
      data: plan,
    });
  }

  /**
   * Broadcast a conflict update event
   */
  broadcastConflict(tripId: string, conflict: any): void {
    this.broadcast(tripId, {
      type: 'conflict',
      trip_id: tripId,
      data: conflict,
    });
  }

  /**
   * Broadcast a vote update event
   */
  broadcastVote(tripId: string, conflictId: string, optionKey: string, votes: number): void {
    this.broadcast(tripId, {
      type: 'vote',
      trip_id: tripId,
      data: { conflict_id: conflictId, option_key: optionKey, votes },
    });
  }

  /**
   * Get number of connected clients for a trip
   */
  getClientCount(tripId: string): number {
    return this.clients.get(tripId)?.length || 0;
  }
}

export const sseService = new SSEService();
