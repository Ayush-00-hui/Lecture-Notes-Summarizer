import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.app.core.config import settings
from backend.app.core.logging import StructuredLoggingMiddleware, logger
from backend.app.db.database import init_db, AsyncSessionLocal
from backend.app.routers.prompts import ensure_prompts_seeded

# Import routers
from backend.app.routers import (
    upload, summarize, compare, history, prompts, export, settings as settings_router, health
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schemas
    logger.info("Initializing SQLite database tables...")
    await init_db()
    async with AsyncSessionLocal() as session:
        await ensure_prompts_seeded(session)
    logger.info("NoteNest backend initialized successfully.")
    yield
    logger.info("NoteNest backend shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Production-grade AI Lecture Notes Summarizer & Prompt Comparison Lab. "
        "Transforms lecture materials into summaries, key concepts, revision points, "
        "and flashcards with side-by-side prompt experimentation."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request ID & Structured Logging Middleware
app.add_middleware(StructuredLoggingMiddleware)

# Include API Routers
app.include_router(upload.router, prefix=settings.API_PREFIX)
app.include_router(summarize.router, prefix=settings.API_PREFIX)
app.include_router(compare.router, prefix=settings.API_PREFIX)
app.include_router(history.router, prefix=settings.API_PREFIX)
app.include_router(prompts.router, prefix=settings.API_PREFIX)
app.include_router(export.router, prefix=settings.API_PREFIX)
app.include_router(settings_router.router, prefix=settings.API_PREFIX)
app.include_router(health.router, prefix=settings.API_PREFIX)

# Serve built frontend static assets if dist exists
dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))
if os.path.exists(dist_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_dir, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Don't intercept API routes or docs
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return None
        file_path = os.path.join(dist_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_dir, "index.html"))
