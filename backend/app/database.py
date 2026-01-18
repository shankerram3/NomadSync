from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
from app.config import settings

class Database:
    client: AsyncIOMotorClient = None

db = Database()

async def connect_to_mongo():
    """Create database connection"""
    # Use ServerApi for MongoDB Atlas compatibility
    server_api = ServerApi('1')
    db.client = AsyncIOMotorClient(settings.mongodb_uri, server_api=server_api)
    print(f"Connected to MongoDB Atlas: {settings.mongodb_db}")
    
    # Verify connection by pinging
    try:
        await db.client.admin.command('ping')
        print("Successfully connected to MongoDB Atlas!")
    except Exception as e:
        print(f"Warning: Could not ping MongoDB Atlas: {e}")

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        print("Disconnected from MongoDB")

def get_database():
    """Get database instance"""
    return db.client[settings.mongodb_db]
