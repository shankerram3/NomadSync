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
      res.status(401).json({ detail: 'Authentication required. Please provide a valid Bearer token.' });
      return;
    }

    const token = authHeader.substring(7);
    
    if (!token || token.trim().length === 0) {
      res.status(401).json({ detail: 'Invalid token format. Token cannot be empty.' });
      return;
    }
    
    try {
      const payload = jwt.verify(token, config.jwtSecret) as { sub?: string; type?: string };
      
      if (!payload.sub || payload.type !== 'access') {
        res.status(401).json({ detail: 'Invalid token. Token must be an access token.' });
        return;
      }

      const db = getDatabase();
      const user = await db.collection('users').findOne({ _id: new ObjectId(payload.sub) });
      
      if (!user) {
        res.status(401).json({ detail: 'User not found. Token may be invalid or user may have been deleted.' });
        return;
      }

      req.user = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      };
      
      next();
    } catch (error: any) {
      // Provide more specific error messages
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({ detail: 'Token has expired. Please login again.', code: 'TOKEN_EXPIRED' });
        return;
      } else if (error.name === 'JsonWebTokenError') {
        res.status(401).json({ detail: 'Invalid token. Please login again.', code: 'INVALID_TOKEN' });
        return;
      } else if (error.name === 'CastError' || error.message?.includes('ObjectId')) {
        res.status(401).json({ detail: 'Invalid user ID in token.', code: 'INVALID_USER_ID' });
        return;
      }
      
      // Generic error
      console.error('[AUTH] Authentication error:', error);
      res.status(401).json({ detail: 'Could not validate credentials.', code: 'AUTH_ERROR' });
      return;
    }
  } catch (error: any) {
    console.error('[AUTH] Unexpected authentication error:', error);
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

/**
 * Verify a JWT token and return the user ID
 * Used for SSE connections where we can't use middleware
 */
export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub?: string; type?: string };
    
    if (!payload.sub || payload.type !== 'access') {
      return null;
    }
    
    return payload.sub;
  } catch (error) {
    return null;
  }
}
