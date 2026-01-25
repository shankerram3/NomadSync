import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../database.js';
import { UserCreateSchema } from '../models/user.js';
import { getPasswordHash, verifyPassword, createAccessToken, createRefreshToken, getCurrentUser, AuthRequest } from '../utils/auth.js';
import { config } from '../config.js';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    console.log('[AUTH] Register attempt for email:', req.body?.email);
    const validated = UserCreateSchema.parse(req.body);
    const db = getDatabase();
    
    // Check if user exists
    const existing = await db.collection('users').findOne({ email: validated.email });
    if (existing) {
      console.log('[AUTH] Register failed: Email already registered:', validated.email);
      const errorResponse = { detail: 'Email already registered' };
      console.log('[AUTH] Sending 409 response:', JSON.stringify(errorResponse));
      res.status(409).json(errorResponse);
      return;
    }
    
    // Create user
    const now = new Date();
    const userId = new ObjectId().toString();
    const userDoc = {
      userId,
      email: validated.email,
      name: validated.name,
      avatar_emoji: validated.avatar_emoji,
      password_hash: await getPasswordHash(validated.password),
      createdAt: now,
      updatedAt: now,
    };
    
    const result = await db.collection('users').insertOne(userDoc);
    
    console.log('[AUTH] Register successful for email:', userDoc.email);
    res.status(201).json({
      id: result.insertedId.toString(),
      email: userDoc.email,
      name: userDoc.name,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      console.error('[AUTH] Register validation error:', error.errors);
      const errorResponse = { detail: 'Validation error', errors: error.errors };
      console.log('[AUTH] Sending 400 validation error response:', JSON.stringify(errorResponse));
      res.status(400).json(errorResponse);
      return;
    }
    console.error('[AUTH] Register error:', error);
    console.error('  Stack:', error.stack);
    const errorResponse = { detail: error.message };
    console.log('[AUTH] Sending 500 error response:', JSON.stringify(errorResponse));
    res.status(500).json(errorResponse);
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    console.log('[AUTH] Login attempt for username:', req.body?.username);
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.error('[AUTH] Login failed: Missing username or password');
      console.error('  Request body keys:', Object.keys(req.body || {}));
      console.error('  Request body:', JSON.stringify(req.body, null, 2));
      const errorResponse = { detail: 'Username and password required' };
      console.log('[AUTH] Sending 400 response:', JSON.stringify(errorResponse));
      res.status(400).json(errorResponse);
      return;
    }
    
    const db = getDatabase();
    const user = await db.collection('users').findOne({ email: username });
    
    if (!user) {
      console.error('[AUTH] Login failed: User not found for email:', username);
      const errorResponse = { detail: 'Incorrect email or password' };
      console.log('[AUTH] Sending 401 response:', JSON.stringify(errorResponse));
      res.status(401).json(errorResponse);
      return;
    }
    
    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      console.error('[AUTH] Login failed: Invalid password for email:', username);
      const errorResponse = { detail: 'Incorrect email or password' };
      console.log('[AUTH] Sending 401 response:', JSON.stringify(errorResponse));
      res.status(401).json(errorResponse);
      return;
    }
    
    const accessToken = createAccessToken({ sub: user._id.toString() });
    const refreshToken = createRefreshToken({ sub: user._id.toString() });
    
    console.log('[AUTH] Login successful for email:', username);
    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error('[AUTH] Login error:', error);
    console.error('  Stack:', error.stack);
    const errorResponse = { detail: error.message };
    console.log('[AUTH] Sending 500 error response:', JSON.stringify(errorResponse));
    res.status(500).json(errorResponse);
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      res.status(400).json({ detail: 'refresh_token required' });
      return;
    }
    
    try {
      const payload = jwt.verify(refresh_token, config.jwtSecret) as { sub?: string; type?: string };
      
      if (!payload.sub || payload.type !== 'refresh') {
        res.status(401).json({ detail: 'Invalid refresh token' });
        return;
      }
      
      const accessToken = createAccessToken({ sub: payload.sub });
      
      res.json({ access_token: accessToken, token_type: 'bearer' });
    } catch (error) {
      res.status(401).json({ detail: 'Invalid refresh token' });
    }
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

router.get('/me', getCurrentUser, (req: AuthRequest, res: Response) => {
  res.json(req.user);
});

export default router;
