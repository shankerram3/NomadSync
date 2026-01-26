import { Router, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../database.js';
import { TripCreateSchema } from '../models/trip.js';
import { getCurrentUserId, AuthRequest } from '../utils/auth.js';
import { checkTripAccess } from '../utils/trip_permissions.js';

const router = Router();

router.get('', getCurrentUserId, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const userObjId = new ObjectId(req.userId!);
    
    const trips = await db.collection('trips')
      .find({ 'members.userId': userObjId })
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray();
    
    res.json(trips.map(trip => ({
      id: trip._id.toString(),
      title: trip.title,
      destination: trip.destination,
      dates: trip.dates,
      status: trip.status || 'draft',
      readiness: trip.readiness || 0,
      cover_image: trip.cover_image,
      members: trip.members?.map((m: any) => ({
        userId: m.userId instanceof ObjectId ? m.userId.toString() : m.userId,
        role: m.role,
      })) || [],
      created_at: trip.createdAt,
      updated_at: trip.updatedAt,
    })));
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

router.post('', getCurrentUserId, async (req: AuthRequest, res: Response) => {
  try {
    const validated = TripCreateSchema.parse(req.body);
    const db = getDatabase();
    
    const now = new Date();
    const tripId = new ObjectId().toString();
    const tripDoc = {
      tripId,
      title: validated.title,
      destination: validated.destination,
      dates: validated.dates ? {
        start: validated.dates.start,
        end: validated.dates.end,
      } : null,
      status: validated.status,
      readiness: validated.readiness,
      cover_image: validated.cover_image,
      members: [{ userId: new ObjectId(req.userId!), role: 'owner' }],
      createdAt: now,
      updatedAt: now,
    };
    
    const result = await db.collection('trips').insertOne(tripDoc);
    
    res.status(201).json({
      id: result.insertedId.toString(),
      title: tripDoc.title,
      destination: tripDoc.destination,
      dates: tripDoc.dates,
      status: tripDoc.status,
      readiness: tripDoc.readiness,
      cover_image: tripDoc.cover_image,
      members: tripDoc.members.map(m => ({
        userId: m.userId.toString(),
        role: m.role,
      })),
      created_at: tripDoc.createdAt,
      updated_at: tripDoc.updatedAt,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ detail: 'Validation error', errors: error.errors });
      return;
    }
    res.status(500).json({ detail: error.message });
  }
});

router.get('/:trip_id', getCurrentUserId, async (req: AuthRequest, res: Response) => {
  try {
    const trip = await checkTripAccess(req.params.trip_id, req.userId!);
    
    res.json({
      id: trip._id.toString(),
      title: trip.title,
      destination: trip.destination,
      dates: trip.dates,
      status: trip.status || 'draft',
      readiness: trip.readiness || 0,
      cover_image: trip.cover_image,
      members: trip.members?.map((m: any) => ({
        userId: m.userId instanceof ObjectId ? m.userId.toString() : m.userId,
        role: m.role,
      })) || [],
      created_at: trip.createdAt,
      updated_at: trip.updatedAt,
    });
  } catch (error: any) {
    if (error.message === 'Trip not found') {
      res.status(404).json({ detail: error.message });
    } else if (error.message === 'Access denied') {
      res.status(403).json({ detail: error.message });
    } else {
      res.status(500).json({ detail: error.message });
    }
  }
});

router.patch('/:trip_id', getCurrentUserId, async (req: AuthRequest, res: Response) => {
  try {
    await checkTripAccess(req.params.trip_id, req.userId!, 'owner');
    
    const db = getDatabase();
    const allowedFields = ['title', 'destination', 'dates', 'status', 'readiness', 'cover_image'];
    const updateDoc: any = {};
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateDoc[field] = req.body[field];
      }
    }
    
    if (Object.keys(updateDoc).length === 0) {
      res.status(400).json({ detail: 'No valid fields to update' });
      return;
    }
    
    const result = await db.collection('trips').updateOne(
      { _id: new ObjectId(req.params.trip_id) },
      { $set: updateDoc }
    );
    
    if (result.matchedCount === 0) {
      res.status(404).json({ detail: 'Trip not found' });
      return;
    }
    
    const updated = await db.collection('trips').findOne({ _id: new ObjectId(req.params.trip_id) });
    
    res.json({
      id: updated!._id.toString(),
      title: updated!.title,
      destination: updated!.destination,
      dates: updated!.dates,
      status: updated!.status || 'draft',
      readiness: updated!.readiness || 0,
      cover_image: updated!.cover_image,
      members: updated!.members?.map((m: any) => ({
        userId: m.userId instanceof ObjectId ? m.userId.toString() : m.userId,
        role: m.role,
      })) || [],
      created_at: updated!.createdAt,
      updated_at: updated!.updatedAt,
    });
  } catch (error: any) {
    if (error.message === 'Trip not found') {
      res.status(404).json({ detail: error.message });
    } else if (error.message.includes('Access denied') || error.message.includes('Requires')) {
      res.status(403).json({ detail: error.message });
    } else {
      res.status(500).json({ detail: error.message });
    }
  }
});

router.post('/:trip_id/invite', getCurrentUserId, async (req: AuthRequest, res: Response) => {
  try {
    await checkTripAccess(req.params.trip_id, req.userId!);
    
    const { email, role = 'editor' } = req.body;
    const db = getDatabase();
    
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      res.status(404).json({ detail: 'User not found' });
      return;
    }
    
    const userObjId = user._id;
    const trip = await db.collection('trips').findOne({ _id: new ObjectId(req.params.trip_id) });
    
    if (trip?.members?.some((m: any) => m.userId.equals(userObjId))) {
      res.status(409).json({ detail: 'User already a member' });
      return;
    }
    
    await db.collection('trips').updateOne(
      { _id: new ObjectId(req.params.trip_id) },
      { $push: { members: { userId: userObjId, role } } } as any
    );
    
    res.json({ message: 'User invited successfully' });
  } catch (error: any) {
    if (error.message === 'Trip not found') {
      res.status(404).json({ detail: error.message });
    } else if (error.message === 'Access denied') {
      res.status(403).json({ detail: error.message });
    } else {
      res.status(500).json({ detail: error.message });
    }
  }
});

export default router;
