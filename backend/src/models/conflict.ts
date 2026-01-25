import { z } from 'zod';

export const ConflictVoteSchema = z.object({
  userId: z.string(),
  at: z.date().optional(),
});

export const ConflictOptionSchema = z.object({
  key: z.string(),
  title: z.string(),
  description: z.string().optional(),
  votes: z.array(ConflictVoteSchema).default([]),
});

export const ConflictBaseSchema = z.object({
  options: z.array(ConflictOptionSchema),
});

export const ConflictCreateSchema = ConflictBaseSchema.extend({
  message_id: z.string(),
});

export type ConflictVote = z.infer<typeof ConflictVoteSchema>;
export type ConflictOption = z.infer<typeof ConflictOptionSchema>;
export type ConflictBase = z.infer<typeof ConflictBaseSchema>;
export type ConflictCreate = z.infer<typeof ConflictCreateSchema>;

export interface ConflictInDB extends ConflictBase {
  _id?: string;
  tripId?: string;
  messageId?: string;
  createdAt?: Date;
}

export interface Conflict extends ConflictBase {
  id: string;
  trip_id: string;
  message_id: string;
  created_at: Date;
}
