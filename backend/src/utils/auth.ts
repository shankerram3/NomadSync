import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { config } from '../config.js';
import { getDatabase } from '../database.js';

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function getPasswordHash(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function createAccessToken(data: { sub: string }, expiresDelta?: number): string {
  const expiresIn = expiresDelta 
    ? expiresDelta * 60 // Convert minutes to seconds
    : config.accessTokenExpireMinutes * 60;
  
  return jwt.sign(
    { ...data, type: 'access' },
    config.jwtSecret,
    { expiresIn }
  );
}

export function createRefreshToken(data: { sub: string }): string {
  return jwt.sign(
    { ...data, type: 'refresh' },
    config.jwtSecret,
    { expiresIn: config.refreshTokenExpireDays * 24 * 60 * 60 } // Convert days to seconds
  );
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  userId?: string;
}

export async function getCurrentUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ detail: 'Could not validate credentials' });
      return;
    }

    const token = authHeader.substring(7);
    
    try {
      const payload = jwt.verify(token, config.jwtSecret) as { sub?: string; type?: string };
      
      if (!payload.sub || payload.type !== 'access') {
        res.status(401).json({ detail: 'Could not validate credentials' });
        return;
      }

      const db = getDatabase();
      const user = await db.collection('users').findOne({ _id: new ObjectId(payload.sub) });
      
      if (!user) {
        res.status(401).json({ detail: 'Could not validate credentials' });
        return;
      }

      req.user = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      };
      
      next();
    } catch (error) {
      res.status(401).json({ detail: 'Could not validate credentials' });
      return;
    }
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUserId(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  await getCurrentUser(req, res, () => {
    if (req.user) {
      req.userId = req.user.id;
    }
    next();
  });
}
