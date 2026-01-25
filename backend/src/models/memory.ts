import { z } from 'zod';

export const MemoryFieldSchema = z.object({
  value: z.string().optional(),
  confidence: z.number().min(0).max(100).default(0),
  sources: z.array(z.string()).default([]),
});

export const TripMemoryBaseSchema = z.object({
  destination: MemoryFieldSchema.optional(),
  dates: MemoryFieldSchema.optional(),
  budget: MemoryFieldSchema.optional(),
  pace: MemoryFieldSchema.optional(),
  duration: MemoryFieldSchema.optional(),
});

export const TripMemoryUpdateSchema = TripMemoryBaseSchema;

export type MemoryField = z.infer<typeof MemoryFieldSchema>;
export type TripMemoryBase = z.infer<typeof TripMemoryBaseSchema>;
export type TripMemoryUpdate = z.infer<typeof TripMemoryUpdateSchema>;

export interface TripMemoryInDB extends TripMemoryBase {
  _id?: string;
  tripId?: string;
  updatedAt?: Date;
}

export interface TripMemory extends TripMemoryBase {
  id: string | null;
  trip_id: string;
  updated_at: Date | null;
}
