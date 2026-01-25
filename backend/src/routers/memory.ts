import { Router, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../database.js';
import { TripMemoryUpdateSchema } from '../models/memory.js';
import { getCurrentUserId, AuthRequest } from '../utils/auth.js';
import { checkTripAccess } from '../utils/trip_permissions.js';

const router = Router({ mergeParams: true });

router.get('', getCurrentUserId, async (req: AuthRequest, res: Response) => {
  try {
    const { trip_id } = req.params;
    await checkTripAccess(trip_id, req.userId!);
    
    const db = getDatabase();
    const memory = await db.collection('trip_memory').findOne({ tripId: new ObjectId(trip_id) });
    
    if (!memory) {
      res.json({
        id: null,
        trip_id,
        destination: null,
        dates: null,
        budget: null,
        pace: null,
        duration: null,
        updated_at: null,
      });
      return;
    }
    
    res.json({
      id: memory._id.toString(),
      trip_id,
      destination: memory.destination,
      dates: memory.dates,
      budget: memory.budget,
      pace: memory.pace,
      duration: memory.duration,
      updated_at: memory.updatedAt,
    });
  } catch (error: any) {
    if (error.message === 'Trip not found' || error.message === 'Access denied') {
      res.status(error.message === 'Trip not found' ? 404 : 403).json({ detail: error.message });
    } else {
      res.status(500).json({ detail: error.message });
    }
  }
});

router.patch('', getCurrentUserId, async (req: AuthRequest, res: Response) => {
  try {
    const { trip_id } = req.params;
    const validated = TripMemoryUpdateSchema.parse(req.body);
    
    await checkTripAccess(trip_id, req.userId!);
    
    const db = getDatabase();
    const updateDoc: any = {};
    
    if (validated.destination) updateDoc.destination = validated.destination;
    if (validated.dates) updateDoc.dates = validated.dates;
    if (validated.budget) updateDoc.budget = validated.budget;
    if (validated.pace) updateDoc.pace = validated.pace;
    if (validated.duration) updateDoc.duration = validated.duration;
    
    if (Object.keys(updateDoc).length === 0) {
      res.status(400).json({ detail: 'No fields to update' });
      return;
    }
    
    updateDoc.updatedAt = new Date();
    
    await db.collection('trip_memory').updateOne(
      { tripId: new ObjectId(trip_id) },
      { $set: updateDoc },
      { upsert: true }
    );
    
    const memory = await db.collection('trip_memory').findOne({ tripId: new ObjectId(trip_id) });
    
    res.json({
      id: memory!._id.toString(),
      trip_id,
      destination: memory!.destination,
      dates: memory!.dates,
      budget: memory!.budget,
      pace: memory!.pace,
      duration: memory!.duration,
      updated_at: memory!.updatedAt,
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
