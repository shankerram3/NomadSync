import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectToMongo, closeMongoConnection } from './database.js';
import { config } from './config.js';
import { loadAllTools } from './services/tool_loader.js';

// Import routers
import authRouter from './routers/auth.js';
import tripsRouter from './routers/trips.js';
import messagesRouter from './routers/messages.js';
import conflictsRouter from './routers/conflicts.js';
import planRouter from './routers/plan.js';
import memoryRouter from './routers/memory.js';
import agentRouter from './routers/agent.js';
import realtimeRouter from './routers/realtime.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS middleware
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// Body parsing middleware (must be before request logging)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: any) => {
  const timestamp = new Date().toISOString();
  const hasAuth = !!req.headers.authorization;
  
  // Only log requests that aren't static files or health checks
  const isStaticFileRequest = req.path === '/' || req.path.startsWith('/assets/') || req.path === '/favicon.ico';
  const isHealthCheck = req.path === '/health' || req.path === '/api';
  
  if (!isStaticFileRequest && !isHealthCheck) {
    console.log(`[${timestamp}] ${req.method} ${req.path}${hasAuth ? ' [AUTH]' : ' [NO AUTH]'}`);
    
    if (req.body && Object.keys(req.body).length > 0) {
      // Log request body but mask sensitive fields
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) sanitizedBody.password = '***';
      if (sanitizedBody.refresh_token) sanitizedBody.refresh_token = '***';
      console.log('  Request body:', JSON.stringify(sanitizedBody, null, 2));
    }
  }
  
  // Response logging
  res.on('finish', () => {
    const timestamp = new Date().toISOString();
    // Suppress logging for common non-error cases in development
    const isExpected404 = isStaticFileRequest && res.statusCode === 404;
    const is304 = res.statusCode === 304;
    
    // For 401 errors, only log if it's unexpected (i.e., user had auth token)
    const isExpected401 = res.statusCode === 401 && !hasAuth;
    
    // Only log if it's an actual error or not a common development case
    if (!isExpected404 && !is304 && (!isExpected401 || hasAuth)) {
      if (res.statusCode >= 400) {
        console.log(`[${timestamp}] ${req.method} ${req.path} -> ${res.statusCode}${hasAuth ? ' [AUTH FAILED]' : ' [NO AUTH]'}`);
      } else {
        console.log(`[${timestamp}] ${req.method} ${req.path} -> ${res.statusCode}`);
      }
    }
  });
  
  next();
});

// Handle CORS preflight requests
app.options('*', (req: Request, res: Response) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(204).send();
});

// Health check endpoint (must be before catch-all routes)
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

// API root endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({ message: 'NomadSync API', version: '1.0.0' });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/trips/:trip_id/messages', messagesRouter);
app.use('/api/trips/:trip_id/conflicts', conflictsRouter);
app.use('/api/trips/:trip_id/plan', planRouter);
app.use('/api/trips/:trip_id/memory', memoryRouter);
app.use('/api/trips/:trip_id/realtime', realtimeRouter);
app.use('/api/agents', agentRouter);

// Serve static files (frontend build)
const staticDir = path.join(__dirname, '..', 'static');
const assetsDir = path.join(staticDir, 'assets');

// Serve static assets
app.use('/assets', express.static(assetsDir));

// Serve favicon
app.get('/favicon.ico', (_req: Request, res: Response) => {
  const faviconPath = path.join(staticDir, 'favicon.ico');
  res.sendFile(faviconPath, (err) => {
    if (err) {
      res.status(404).json({ detail: 'Not found' });
    }
  });
});

// Serve index.html for root
app.get('/', (_req: Request, res: Response) => {
  const indexPath = path.join(staticDir, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // In development, frontend runs separately - this is expected
      // Silently return 404 without logging (logging middleware will suppress it)
      res.status(404).json({ detail: 'Frontend not built. Please build the frontend first.' });
    }
  });
});

// Catch-all route for SPA routing (must be last)
app.get('*', (req: Request, res: Response) => {
  // Don't interfere with API routes, health check, or assets
  if (
    req.path.startsWith('/api/') ||
    req.path === '/health' ||
    req.path.startsWith('/assets/') ||
    req.path === '/favicon.ico'
  ) {
    res.status(404).json({ detail: 'Not found' });
    return;
  }

  // Serve index.html for all other routes (React Router will handle routing)
  const indexPath = path.join(staticDir, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // In development, frontend runs separately - this is expected
      // Silently return 404 without logging (logging middleware will suppress it)
      res.status(404).json({ detail: 'Frontend not built. Please build the frontend first.' });
    }
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, _next: any) => {
  console.error(`[${new Date().toISOString()}] Unhandled Error on ${req.method} ${req.path}:`, err);
  console.error('  Stack:', err.stack);
  res.status(err.status || 500).json({
    detail: err.message || 'Internal server error',
  });
});

// Database connection
let server: any;

async function startServer() {
  try {
    await connectToMongo();
    
    // Load all tools on server startup
    try {
      await loadAllTools();
    } catch (error) {
      console.warn('Warning: Some tools failed to load:', error);
      // Continue anyway - tools can be loaded lazily
    }
    
    const port = config.port;
    server = app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  if (server) {
    server.close(async () => {
      await closeMongoConnection();
      process.exit(0);
    });
  } else {
    await closeMongoConnection();
    process.exit(0);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  if (server) {
    server.close(async () => {
      await closeMongoConnection();
      process.exit(0);
    });
  } else {
    await closeMongoConnection();
    process.exit(0);
  }
});

// Start the server
startServer();
