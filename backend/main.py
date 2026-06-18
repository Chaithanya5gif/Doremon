"""
DORAEMON - Personal AI Life Companion System
FastAPI Backend Application
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os
import sys

# Add the backend directory to path
sys.path.insert(0, os.path.dirname(__file__))

# Import routers
from routers.user import router as user_router
from routers.quests import router as quests_router
from routers.planning import router as planning_router
from routers.sessions import router as sessions_router
from routers.chat import router as chat_router

# Import database
import database as db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    print("=" * 60)
    print("  DORAEMON AI Companion System - Starting Up")
    print("  'A true friend doesn't let you fail.'")
    print("=" * 60)
    db.init_db()
    yield
    print("\n[DORAEMON] Shutting down. Hunter, don't give up.")


# Create FastAPI app
app = FastAPI(
    title="DORAEMON AI Companion",
    description="Voice-first, AI-powered life companion with Solo Leveling gamification",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "system": "DORAEMON",
        "version": "1.0.0",
        "message": "A true friend doesn't let you fail."
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "DORAEMON AI Companion",
        "version": "1.0.0",
        "tagline": "A true friend doesn't let you fail.",
        "endpoints": {
            "user": "/api/stats",
            "quests": "/api/quests",
            "planning": "/api/weekly-plan",
            "sessions": "/api/session",
            "chat": "/api/chat",
            "health": "/health"
        }
    }


# Include all routers
app.include_router(user_router)
app.include_router(quests_router)
app.include_router(planning_router)
app.include_router(sessions_router)
app.include_router(chat_router)


# Serve frontend static files
static_path = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_path):
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve SPA for all non-API routes."""
        # API routes are handled by routers above
        index_file = os.path.join(static_path, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"error": "Frontend not built"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
