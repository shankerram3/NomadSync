from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from pathlib import Path
import os
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

# CORS middleware - allow all origins when serving frontend from same origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Since we're serving from same origin, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint (must be before catch-all routes)
@app.get("/health")
async def health():
    return {"status": "healthy"}

# API root endpoint
@app.get("/api")
async def api_root():
    return {"message": "NomadSync API", "version": "1.0.0"}

# Include API routers with /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(trips.router, prefix="/api")
app.include_router(messages.router, prefix="/api")
app.include_router(conflicts.router, prefix="/api")
app.include_router(plan.router, prefix="/api")
app.include_router(memory.router, prefix="/api")
app.include_router(agent.router, prefix="/api")


# Serve static files (frontend build)
static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    # Mount static assets directory (JS, CSS, images, etc.)
    assets_dir = static_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
    
    # Serve other static files (favicon, etc.) - must be before catch-all
    @app.get("/favicon.ico")
    async def favicon():
        favicon_path = static_dir / "favicon.ico"
        if favicon_path.exists():
            return FileResponse(str(favicon_path))
        return {"detail": "Not found"}
    
    # Serve index.html for root
    @app.get("/")
    async def serve_index():
        index_path = static_dir / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        return {"detail": "Frontend not built. Please build the frontend first."}
    
    # Catch-all route for SPA routing (must be last)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't interfere with API routes, health check, or assets
        if (full_path.startswith("api/") or 
            full_path == "health" or 
            full_path.startswith("assets/") or
            full_path == "favicon.ico"):
            return {"detail": "Not found"}
        
        # Serve index.html for all other routes (React Router will handle routing)
        index_path = static_dir / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        return {"detail": "Frontend not built. Please build the frontend first."}


