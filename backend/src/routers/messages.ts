import { Router, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../database.js';
import { MessageCreateSchema } from '../models/message.js';
import { getCurrentUserId, AuthRequest } from '../utils/auth.js';
import { checkTripAccess } from '../utils/trip_permissions.js';

const router = Router({ mergeParams: true });

router.get('', getCurrentUserId, async (req: AuthRequest, res: Response) => {
  try {
    const { trip_id } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string || '200', 10), 500);
    const cursor = req.query.cursor as string | undefined;
    
    await checkTripAccess(trip_id, req.userId!);
    
    const db = getDatabase();
    const query: any = { tripId: new ObjectId(trip_id) };
    
    if (cursor) {
      try {
        query._id = { $gt: new ObjectId(cursor) };
      } catch {
        // Invalid cursor, ignore
      }
    }
    
    const messages = await db.collection('messages')
      .find(query)
      .sort({ createdAt: 1 })
      .limit(limit)
      .toArray();
    
    res.json(messages.map(msg => ({
      id: msg._id.toString(),
      trip_id: msg.tripId.toString(),
      author_id: msg.authorId?.toString() || null,
      type: msg.type,
      content: msg.content,
      summary: msg.summary,
      questions: msg.questions,
      conflict_id: msg.conflictId?.toString() || null,
      plan_version_id: msg.planVersionId?.toString() || null,
      has_view_plan: msg.hasViewPlan || false,
      created_at: msg.createdAt,
    })));
  } catch (error: any) {
    if (error.message === 'Trip not found' || error.message === 'Access denied') {
      res.status(error.message === 'Trip not found' ? 404 : 403).json({ detail: error.message });
    } else {
      res.status(500).json({ detail: error.message });
    }
  }
});

router.post('', getCurrentUserId, async (req: AuthRequest, res: Response) => {
  try {
    const { trip_id } = req.params;
    const validated = MessageCreateSchema.parse(req.body);
    
    await checkTripAccess(trip_id, req.userId!);
    
    const db = getDatabase();
    const now = new Date();
    const messageDoc = {
      tripId: new ObjectId(trip_id),
      authorId: validated.type === 'human' ? new ObjectId(req.userId!) : null,
      type: validated.type,
      content: validated.content,
      summary: validated.summary,
      questions: validated.questions,
      hasViewPlan: validated.has_view_plan,
      planVersionId: validated.plan_version_id ? new ObjectId(validated.plan_version_id) : undefined,
      createdAt: now,
    };
    
    const result = await db.collection('messages').insertOne(messageDoc);
    
    // Update trip's updated_at
    await db.collection('trips').updateOne(
      { _id: new ObjectId(trip_id) },
      { $set: { updatedAt: now } }
    );
    
    res.status(201).json({
      id: result.insertedId.toString(),
      trip_id,
      author_id: messageDoc.authorId?.toString() || null,
      type: messageDoc.type,
      content: messageDoc.content,
      summary: messageDoc.summary,
      questions: messageDoc.questions,
      conflict_id: null,
      plan_version_id: messageDoc.planVersionId?.toString() || null,
      has_view_plan: messageDoc.hasViewPlan,
      created_at: now,
    });
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

export default router;
