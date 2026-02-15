from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from .database import engine, Base, SessionLocal
from . import database
from .config import CORS_ORIGINS
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
database.ensure_sqlite_compat_columns()

from .logger import setup_logger
from .services.admin_seed_service import seed_admin_account
from .services.sitemap_batch_service import sitemap_batch_service

logger = setup_logger("api.main")

app = FastAPI(
    title="Advanced SEO/GEO Analysis Platform",
    description="API for SEO/AEO/GEO analysis tool",
    version="1.0.0",
)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    logger.info("Application starting up...")
    db = SessionLocal()
    try:
        seed_result = seed_admin_account(db)
        if seed_result.get("executed"):
            logger.info(
                f"Admin seed {seed_result.get('status')} for {seed_result.get('email')}"
            )
        else:
            logger.info(f"Admin seed skipped: {seed_result.get('reason')}")
    finally:
        db.close()

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
from .routes import provider_capabilities

app.include_router(provider_capabilities.router, prefix="/api", tags=["Providers"])
from .routes import prompt_tracking

app.include_router(prompt_tracking.router, prefix="/api", tags=["Prompt Tracking"])
from .routes import aeo_optimizer

app.include_router(aeo_optimizer.router, prefix="/api", tags=["AEO Optimizer"])
from .routes import billing

app.include_router(billing.router, prefix="/api", tags=["Billing"])


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
