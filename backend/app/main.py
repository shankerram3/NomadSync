from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routers import auth, trips, messages, conflicts, plan, memory, agent


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()


app = FastAPI(
    title="NomadSync API",
    description="Collaborative Travel Planner Backend API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(trips.router)
app.include_router(messages.router)
app.include_router(conflicts.router)
app.include_router(plan.router)
app.include_router(memory.router)
app.include_router(agent.router)


@app.get("/")
async def root():
    return {"message": "NomadSync API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
