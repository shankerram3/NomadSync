import { ObjectId } from 'mongodb';
import { getDatabase } from '../database.js';

export interface TripDocument {
  _id: ObjectId;
  members: Array<{ userId: ObjectId; role: string }>;
  [key: string]: any;
}

export async function checkTripAccess(
  tripId: string,
  userId: string,
  requireRole?: 'owner' | 'editor' | 'viewer'
): Promise<TripDocument> {
  const db = getDatabase();
  const trip = await db.collection('trips').findOne({ _id: new ObjectId(tripId) });

  if (!trip) {
    throw new Error('Trip not found');
  }

  const userObjId = new ObjectId(userId);
  const member = trip.members?.find((m: { userId: ObjectId }) => m.userId.equals(userObjId));

  if (!member) {
    throw new Error('Access denied');
  }

  if (requireRole && member.role !== requireRole) {
    throw new Error(`Requires ${requireRole} role`);
  }

  return trip as TripDocument;
}
