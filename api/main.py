from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from .database import engine, Base
from . import database
from .routes import auth, analyze
import sys
import asyncio

# Fix for Windows asyncio loop
if sys.platform.startswith("win"):
    import nest_asyncio

    nest_asyncio.apply()
    # Also try to enforce Proactor policy if possible, but nest_asyncio is safer
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    except Exception:
        pass

# Create Database Tables
Base.metadata.create_all(bind=engine)

from .logger import setup_logger
from .services.sitemap_batch_service import sitemap_batch_service

logger = setup_logger("api.main")

app = FastAPI(
    title="Advanced SEO/GEO Analysis Platform",
    description="API for SEO/AEO/GEO analysis tool",
    version="1.0.0",
)

from fastapi.middleware.cors import CORSMiddleware

# CORE FIX: Enable CORS for Frontend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    logger.info("Application starting up...")
    await sitemap_batch_service.start_workers(worker_count=2)


@app.on_event("shutdown")
async def shutdown_event():
    await sitemap_batch_service.stop_workers()
    logger.info("Application shutting down...")


from pydantic import BaseModel


class ClientLog(BaseModel):
    level: str
    message: str
    details: str | None = None


@app.post("/api/client-log")
async def log_client_error(log: ClientLog):
    """Endpoint for frontend to send logs to backend."""
    details = (log.details or "")[:2000]
    lower_message = log.message.lower()

    if (
        "login" in lower_message
        or "register" in lower_message
        or "auth" in lower_message
    ):
        details = "[REDACTED_AUTH_DETAILS]"

    log_msg = f"[FRONTEND] {log.message}"
    if details:
        log_msg += f" | Details: {details}"

    if log.level.lower() == "error":
        logger.error(log_msg)
    elif log.level.lower() == "warn":
        logger.warning(log_msg)
    else:
        logger.info(log_msg)
    return {"status": "logged"}


# Include Routers
app.include_router(auth.router, prefix="/api", tags=["Auth"])
from .routes import analyze

app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
from .routes import site_audit

app.include_router(site_audit.router, prefix="/api", tags=["Site Audit"])
from .routes import geo_analysis

app.include_router(geo_analysis.router, prefix="/api", tags=["GEO Analysis"])
from .routes import history

app.include_router(history.router, prefix="/api", tags=["History"])


# Dependency
def get_db():
    return database.get_db()


@app.get("/")
async def root():
    return {"message": "Welcome to Advanced SEO/GEO Analysis API"}


@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    return {"status": "ok", "database": "connected"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("api.main:app", host="127.0.0.1", port=8000, reload=True)
