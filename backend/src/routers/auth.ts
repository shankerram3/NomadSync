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
    const validated = UserCreateSchema.parse(req.body);
    const db = getDatabase();
    
    // Check if user exists
    const existing = await db.collection('users').findOne({ email: validated.email });
    if (existing) {
      res.status(409).json({ detail: 'Email already registered' });
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
    
    res.status(201).json({
      id: result.insertedId.toString(),
      email: userDoc.email,
      name: userDoc.name,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ detail: 'Validation error', errors: error.errors });
      return;
    }
    res.status(500).json({ detail: error.message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      res.status(400).json({ detail: 'Username and password required' });
      return;
    }
    
    const db = getDatabase();
    const user = await db.collection('users').findOne({ email: username });
    
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      res.status(401).json({ detail: 'Incorrect email or password' });
      return;
    }
    
    const accessToken = createAccessToken({ sub: user._id.toString() });
    const refreshToken = createRefreshToken({ sub: user._id.toString() });
    
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
    res.status(500).json({ detail: error.message });
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
