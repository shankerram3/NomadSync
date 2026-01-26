import { Router, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../database.js';
import { ConflictCreateSchema } from '../models/conflict.js';
import { getCurrentUserId, AuthRequest } from '../utils/auth.js';
import { checkTripAccess } from '../utils/trip_permissions.js';
import { sseService } from '../services/sse.js';

const router = Router({ mergeParams: true });

router.post('', getCurrentUserId, async (req: AuthRequest, res: Response) => {
  try {
    const { trip_id } = req.params;
    const validated = ConflictCreateSchema.parse(req.body);
    
    await checkTripAccess(trip_id, req.userId!);
    
    const db = getDatabase();
    
    // Verify message exists and belongs to trip
    const message = await db.collection('messages').findOne({
      _id: new ObjectId(validated.message_id),
      tripId: new ObjectId(trip_id),
    });
    
    if (!message) {
      res.status(404).json({ detail: 'Message not found' });
      return;
    }
    
    const now = new Date();
    const conflictDoc = {
      tripId: new ObjectId(trip_id),
      messageId: new ObjectId(validated.message_id),
      options: validated.options,
      createdAt: now,
    };
    
    const result = await db.collection('conflicts').insertOne(conflictDoc);
    
    // Update message with conflict reference
    await db.collection('messages').updateOne(
      { _id: new ObjectId(validated.message_id) },
      { $set: { conflictId: result.insertedId } }
    );
    
    const conflictResponse = {
      id: result.insertedId.toString(),
      trip_id,
      message_id: validated.message_id,
      options: conflictDoc.options,
      created_at: conflictDoc.createdAt,
    };
    
    // Broadcast conflict via SSE
    sseService.broadcastConflict(trip_id, conflictResponse);
    
    res.status(201).json(conflictResponse);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ detail: 'Validation error', errors: error.errors });
      return;
    }
    if (error.message === 'Trip not found' || error.message === 'Access denied') {
      res.status(error.message === 'Trip not found' ? 404 : 403).json({ detail: error.message });
    } else {
      res.status(500).json({ detail: error.message });
    }
  }
});

router.post('/:conflict_id/vote', getCurrentUserId, async (req: AuthRequest, res: Response) => {
  try {
    const { trip_id, conflict_id } = req.params;
    const { option_key, key } = req.body;
    const optionKey = option_key || key;
    
    await checkTripAccess(trip_id, req.userId!);
    
    const db = getDatabase();
    const conflict = await db.collection('conflicts').findOne({
      _id: new ObjectId(conflict_id),
      tripId: new ObjectId(trip_id),
    });
    
    if (!conflict) {
      res.status(404).json({ detail: 'Conflict not found' });
      return;
    }
    
    const optionIndex = conflict.options.findIndex((opt: any) => opt.key === optionKey);
    if (optionIndex === -1) {
      res.status(404).json({ detail: 'Option not found' });
      return;
    }
    
    const userObjId = new ObjectId(req.userId!);
    
    // Remove old vote from all options
    for (const opt of conflict.options) {
      opt.votes = (opt.votes || []).filter((v: any) => !v.userId.equals(userObjId));
    }
    
    // Add new vote
    if (!conflict.options[optionIndex].votes) {
      conflict.options[optionIndex].votes = [];
    }
    conflict.options[optionIndex].votes.push({
      userId: userObjId,
      at: new Date(),
    });
    
    await db.collection('conflicts').updateOne(
      { _id: new ObjectId(conflict_id) },
      { $set: { options: conflict.options } }
    );
    
    // Broadcast vote update via SSE
    const voteCount = conflict.options[optionIndex].votes.length;
    sseService.broadcastVote(trip_id, conflict_id, optionKey, voteCount);
    
    res.json({ message: 'Vote recorded' });
  } catch (error: any) {
    if (error.message === 'Trip not found' || error.message === 'Access denied') {
      res.status(error.message === 'Trip not found' ? 404 : 403).json({ detail: error.message });
    } else {
      res.status(500).json({ detail: error.message });
    }
  }
});

router.get('/:conflict_id', getCurrentUserId, async (req: AuthRequest, res: Response) => {
  try {
    const { trip_id, conflict_id } = req.params;
    await checkTripAccess(trip_id, req.userId!);
    
    const db = getDatabase();
    const conflict = await db.collection('conflicts').findOne({
      _id: new ObjectId(conflict_id),
      tripId: new ObjectId(trip_id),
    });
    
    if (!conflict) {
      res.status(404).json({ detail: 'Conflict not found' });
      return;
    }
    
    res.json({
      id: conflict._id.toString(),
      trip_id,
      message_id: conflict.messageId.toString(),
      options: conflict.options,
      created_at: conflict.createdAt,
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
