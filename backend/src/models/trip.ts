import { z } from 'zod';

export const TripMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(['owner', 'editor', 'viewer']).default('editor'),
});

export const TripDatesSchema = z.object({
  start: z.date().optional(),
  end: z.date().optional(),
});

export const TripBaseSchema = z.object({
  title: z.string(),
  destination: z.string().optional(),
  dates: TripDatesSchema.optional(),
  status: z.enum(['draft', 'planned', 'booked']).default('draft'),
  readiness: z.number().min(0).max(100).default(0),
  cover_image: z.string().optional(),
});

export const TripCreateSchema = TripBaseSchema;

export type TripMember = z.infer<typeof TripMemberSchema>;
export type TripDates = z.infer<typeof TripDatesSchema>;
export type TripBase = z.infer<typeof TripBaseSchema>;
export type TripCreate = z.infer<typeof TripCreateSchema>;

export interface TripInDB extends TripBase {
  _id?: string;
  tripId?: string;
  members: TripMember[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Trip extends TripBase {
  id: string;
  members: Array<{ userId: string; role: string }>;
  created_at: Date;
  updated_at: Date;
}
