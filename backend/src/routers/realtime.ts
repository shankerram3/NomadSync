/**
 * Real-time updates router using Server-Sent Events (SSE)
 */

import { Router, Response, Request } from 'express';
import { sseService } from '../services/sse.js';
import { verifyToken } from '../utils/auth.js';
import { checkTripAccess } from '../utils/trip_permissions.js';

const router = Router({ mergeParams: true });

/**
 * SSE endpoint for real-time trip updates
 * GET /api/trips/:trip_id/realtime?token=...
 * Note: EventSource doesn't support custom headers, so we accept token as query param
 */
router.get('', async (req: Request, res: Response) => {
  try {
    const { trip_id } = req.params;
    
    // Get token from query param (EventSource doesn't support headers) or Authorization header
    const token = (req.query.token as string) || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ detail: 'Authentication required' });
      return;
    }

    // Verify token and get user ID
    const userId = verifyToken(token);
    if (!userId) {
      res.status(401).json({ detail: 'Invalid token' });
      return;
    }

    // Verify trip access
    await checkTripAccess(trip_id, userId);

    // Register SSE client
    const cleanup = sseService.addClient(trip_id, userId, res);

    // Keep connection alive with periodic heartbeat
    const heartbeatInterval = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch (error) {
        clearInterval(heartbeatInterval);
        cleanup();
      }
    }, 30000); // 30 second heartbeat

    // Cleanup on disconnect
    res.on('close', () => {
      clearInterval(heartbeatInterval);
      cleanup();
    });
  } catch (error: any) {
    if (error.message === 'Trip not found' || error.message === 'Access denied') {
      res.status(error.message === 'Trip not found' ? 404 : 403).json({ detail: error.message });
    } else {
      res.status(500).json({ detail: error.message });
    }
  }
});

export default router;
