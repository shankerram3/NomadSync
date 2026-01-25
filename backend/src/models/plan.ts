import { z } from 'zod';

export const PlanVersionBaseSchema = z.object({
  version: z.number(),
  itinerary: z.record(z.any()),
  created_by: z.string().optional(),
});

export const PlanVersionCreateSchema = PlanVersionBaseSchema;

export type PlanVersionBase = z.infer<typeof PlanVersionBaseSchema>;
export type PlanVersionCreate = z.infer<typeof PlanVersionCreateSchema>;

export interface PlanVersionInDB extends PlanVersionBase {
  _id?: string;
  tripId?: string;
  createdAt?: Date;
}

export interface PlanVersion extends PlanVersionBase {
  id: string;
  trip_id: string;
  created_at: Date;
}
