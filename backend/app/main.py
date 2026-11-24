from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.logging import setup_logging
from app.db.database import init_db
from app.api.v1.router import api_router

# Import all models so SQLAlchemy registers them before create_all()
from app.models import email_record, verification_job, known_email  # noqa: F401

setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database tables on startup
    await init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pathlib import Path
from fastapi.responses import FileResponse
from fastapi import HTTPException

# Include API endpoints
app.include_router(api_router, prefix=settings.API_V1_STR)

# Serve built frontend if available (unified full-stack deployment)
static_dir = Path(__file__).resolve().parent.parent / "static"
if not (static_dir / "index.html").exists():
    static_dir = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if static_dir.exists() and (static_dir / "index.html").exists():
    assets_dir = static_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Pass through API and docs requests
        if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json"):
            raise HTTPException(status_code=404, detail="Not Found")
        
        target = static_dir / full_path
        if target.is_file():
            return FileResponse(str(target))
        return FileResponse(str(static_dir / "index.html"))
else:
    @app.get("/")
    async def root():
        return {
            "message": "Welcome to Production Email Verification API",
            "docs": "/docs",
            "health": f"{settings.API_V1_STR}/health"
        }
