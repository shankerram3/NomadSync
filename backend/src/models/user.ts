import { z } from 'zod';

export const UserBaseSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  avatar_emoji: z.string().default('😊'),
});

export const UserCreateSchema = UserBaseSchema.extend({
  password: z.string().min(8),
});

export type UserBase = z.infer<typeof UserBaseSchema>;
export type UserCreate = z.infer<typeof UserCreateSchema>;

export interface UserInDB extends UserBase {
  _id?: string;
  userId?: string;
  password_hash: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User extends UserBase {
  id: string;
  created_at: Date;
  updated_at: Date;
}
