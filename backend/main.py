"""Interview Helper — Main FastAPI Application."""
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import CORS_ORIGINS, HOST, PORT, SKILL_MD_CONTENT
from .routes import session, commands, resume, config_routes, report, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown."""
    print(f"Skill MD loaded: {len(SKILL_MD_CONTENT)} chars")
    print(f"Skill scripts dir: {Path(__file__).resolve().parent.parent.parent.parent / 'scripts'}")
    yield


app = FastAPI(
    title="Interview Helper",
    description="CS Technical Interview Web UI — frontend for cs-tech-interviewer skill",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
app.include_router(session.router)
app.include_router(commands.router)
app.include_router(resume.router)
app.include_router(config_routes.router)
app.include_router(report.router)
app.include_router(chat.router)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "skill_loaded": len(SKILL_MD_CONTENT) > 0,
        "model": os.environ.get("ANTHROPIC_MODEL", "deepseek-v4-pro"),
    }


# Serve static frontend in production
static_dir = Path(__file__).resolve().parent / "static"
if static_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(static_dir / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve frontend SPA — return index.html for all non-API routes."""
        import fastapi.responses
        index_path = static_dir / "index.html"
        if index_path.exists():
            return fastapi.responses.FileResponse(str(index_path))
        return fastapi.responses.JSONResponse(
            {"error": "Frontend not built. Run: cd frontend && npm run build"},
            status_code=404,
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=HOST,
        port=PORT,
        reload=True,
    )
