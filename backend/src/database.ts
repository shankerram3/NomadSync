import { MongoClient, Db, ServerApi } from 'mongodb';
import { config } from './config.js';

class Database {
  client: MongoClient | null = null;
  db: Db | null = null;
}

const db = new Database();

export async function connectToMongo(): Promise<void> {
  try {
    const serverApi = new ServerApi('1');
    db.client = new MongoClient(config.mongodbUri, {
      serverApi,
    });
    
    await db.client.connect();
    db.db = db.client.db(config.mongodbDb);
    
    console.log(`Connected to MongoDB: ${config.mongodbDb}`);
    
    // Verify connection
    try {
      await db.db.admin().ping();
      console.log('Successfully connected to MongoDB!');
    } catch (error) {
      console.warn(`Warning: Could not ping MongoDB: ${error}`);
    }
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function closeMongoConnection(): Promise<void> {
  if (db.client) {
    await db.client.close();
    console.log('Disconnected from MongoDB');
  }
}

export function getDatabase(): Db {
  if (!db.db) {
    throw new Error('Database not connected. Call connectToMongo() first.');
  }
  return db.db;
}
