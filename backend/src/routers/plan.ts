import { Router, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../database.js';
import { PlanVersionCreateSchema } from '../models/plan.js';
import { getCurrentUserId, AuthRequest } from '../utils/auth.js';
import { checkTripAccess } from '../utils/trip_permissions.js';

const router = Router({ mergeParams: true });

router.get('', getCurrentUserId, async (req: AuthRequest, res: Response) => {
  try {
    const { trip_id } = req.params;
    const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;
    
    await checkTripAccess(trip_id, req.userId!);
    
    const db = getDatabase();
    let plan;
    
    if (version) {
      plan = await db.collection('plan_versions').findOne({
        tripId: new ObjectId(trip_id),
        version,
      });
    } else {
      plan = await db.collection('plan_versions')
        .findOne(
          { tripId: new ObjectId(trip_id) },
          { sort: { version: -1 } }
        );
    }
    
    if (!plan) {
      res.status(404).json({ detail: version ? 'Plan version not found' : 'No plan found' });
      return;
    }
    
    res.json({
      id: plan._id.toString(),
      trip_id,
      version: plan.version,
      itinerary: plan.itinerary,
      created_by: plan.createdBy,
      created_at: plan.createdAt,
    });
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
    const validated = PlanVersionCreateSchema.parse(req.body);
    
    await checkTripAccess(trip_id, req.userId!);
    
    const db = getDatabase();
    
    const latest = await db.collection('plan_versions')
      .findOne(
        { tripId: new ObjectId(trip_id) },
        { sort: { version: -1 } }
      );
    
    const nextVersion = latest ? latest.version + 1 : 1;
    const now = new Date();
    
    const planDoc = {
      tripId: new ObjectId(trip_id),
      version: nextVersion,
      itinerary: validated.itinerary,
      createdBy: validated.created_by || req.userId!,
      createdAt: now,
    };
    
    const result = await db.collection('plan_versions').insertOne(planDoc);
    
    res.status(201).json({
      id: result.insertedId.toString(),
      trip_id,
      version: planDoc.version,
      itinerary: planDoc.itinerary,
      created_by: planDoc.createdBy,
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

router.get('/versions', getCurrentUserId, async (req: AuthRequest, res: Response) => {
  try {
    const { trip_id } = req.params;
    await checkTripAccess(trip_id, req.userId!);
    
    const db = getDatabase();
    const versions = await db.collection('plan_versions')
      .find({ tripId: new ObjectId(trip_id) })
      .sort({ version: -1 })
      .limit(100)
      .toArray();
    
    res.json(versions.map(v => ({
      id: v._id.toString(),
      trip_id,
      version: v.version,
      itinerary: v.itinerary,
      created_by: v.createdBy,
      created_at: v.createdAt,
    })));
  } catch (error: any) {
    if (error.message === 'Trip not found' || error.message === 'Access denied') {
      res.status(error.message === 'Trip not found' ? 404 : 403).json({ detail: error.message });
    } else {
      res.status(500).json({ detail: error.message });
    }
  }
});

router.post('/rollback', getCurrentUserId, async (req: AuthRequest, res: Response) => {
  try {
    const { trip_id } = req.params;
    const { version } = req.body;
    
    if (!version || typeof version !== 'number') {
      res.status(400).json({ detail: 'Version number is required' });
      return;
    }
    
    await checkTripAccess(trip_id, req.userId!);
    
    const db = getDatabase();
    
    // Find the version to rollback to
    const targetVersion = await db.collection('plan_versions').findOne({
      tripId: new ObjectId(trip_id),
      version,
    });
    
    if (!targetVersion) {
      res.status(404).json({ detail: 'Plan version not found' });
      return;
    }
    
    // Get latest version
    const latest = await db.collection('plan_versions')
      .findOne(
        { tripId: new ObjectId(trip_id) },
        { sort: { version: -1 } }
      );
    
    if (!latest) {
      res.status(404).json({ detail: 'No plan found' });
      return;
    }
    
    // If already at this version, no need to rollback
    if (latest.version === version) {
      res.json({
        id: latest._id.toString(),
        trip_id,
        version: latest.version,
        itinerary: latest.itinerary,
        created_by: latest.createdBy,
        created_at: latest.createdAt,
      });
      return;
    }
    
    // Create a new version with the target version's itinerary
    const nextVersion = latest.version + 1;
    const now = new Date();
    
    const rollbackDoc = {
      tripId: new ObjectId(trip_id),
      version: nextVersion,
      itinerary: targetVersion.itinerary, // Copy from target version
      createdBy: `rollback:${req.userId!}`,
      createdAt: now,
    };
    
    const result = await db.collection('plan_versions').insertOne(rollbackDoc);
    
    res.status(201).json({
      id: result.insertedId.toString(),
      trip_id,
      version: rollbackDoc.version,
      itinerary: rollbackDoc.itinerary,
      created_by: rollbackDoc.createdBy,
      created_at: now,
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
