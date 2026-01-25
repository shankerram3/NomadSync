import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectToMongo, closeMongoConnection } from './database.js';
import { config } from './config.js';

// Import routers
import authRouter from './routers/auth.js';
import tripsRouter from './routers/trips.js';
import messagesRouter from './routers/messages.js';
import conflictsRouter from './routers/conflicts.js';
import planRouter from './routers/plan.js';
import memoryRouter from './routers/memory.js';
import agentRouter from './routers/agent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS middleware
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (must be before catch-all routes)
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

// API root endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'NomadSync API', version: '1.0.0' });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/trips/:trip_id/messages', messagesRouter);
app.use('/api/trips/:trip_id/conflicts', conflictsRouter);
app.use('/api/trips/:trip_id/plan', planRouter);
app.use('/api/trips/:trip_id/memory', memoryRouter);
app.use('/api/agents', agentRouter);

// Serve static files (frontend build)
const staticDir = path.join(__dirname, '..', 'static');
const assetsDir = path.join(staticDir, 'assets');

// Serve static assets
app.use('/assets', express.static(assetsDir));

// Serve favicon
app.get('/favicon.ico', (req: Request, res: Response) => {
  const faviconPath = path.join(staticDir, 'favicon.ico');
  res.sendFile(faviconPath, (err) => {
    if (err) {
      res.status(404).json({ detail: 'Not found' });
    }
  });
});

// Serve index.html for root
app.get('/', (req: Request, res: Response) => {
  const indexPath = path.join(staticDir, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
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
      res.status(404).json({ detail: 'Frontend not built. Please build the frontend first.' });
    }
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    detail: err.message || 'Internal server error',
  });
});

// Database connection
let server: any;

async function startServer() {
  try {
    await connectToMongo();
    
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
