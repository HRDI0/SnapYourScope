import json
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .. import auth, database, models
from ..logger import setup_logger
from ..services.analysis_service import AnalysisService
from ..services.blob_storage_service import BlobStorageService
from ..services.sitemap_batch_service import sitemap_batch_service

router = APIRouter(tags=["Analysis"])
logger = setup_logger("api.analyze")


def _build_report_summary(results: Dict[str, Any]) -> Dict[str, Any]:
    seo_result = results.get("seo_result", {}) if isinstance(results, dict) else {}
    aeo_result = results.get("aeo_result") if isinstance(results, dict) else None
    geo_result = results.get("geo_result") if isinstance(results, dict) else None

    summary = {
        "seo_score": seo_result.get("score", 0),
        "seo_checks_total": len(seo_result.get("checks", []) or []),
        "aeo_score": (aeo_result or {}).get("score", 0)
        if isinstance(aeo_result, dict)
        else 0,
        "geo_regions": list((geo_result or {}).keys())
        if isinstance(geo_result, dict)
        else [],
    }
    return summary


class AnalyzeRequest(BaseModel):
    url: str
    include_aeo: bool = True
    include_pagespeed: bool = False


class AnalyzeResponse(BaseModel):
    url: str
    seo_result: Dict[str, Any]
    aeo_result: Optional[Dict[str, Any]] = None
    geo_result: Optional[Dict[str, Any]] = None
    pagespeed_result: Optional[Any] = None
    status: str


class SitemapBatchRequest(BaseModel):
    sitemap_url: str
    max_urls: int = Field(default=200, ge=1, le=2000)
    include_aeo: bool = True


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_url(
    request: AnalyzeRequest,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(database.get_db),
):
    user_marker = f"user_id={current_user.id}" if current_user else "guest"
    logger.info(f"Received analysis request for URL: {request.url} from {user_marker}")

    tier = (
        (getattr(current_user, "tier", None) or "free").lower()
        if current_user
        else "free"
    )
    allow_pagespeed = request.include_pagespeed and tier in {"pro", "enterprise"}

    try:
        results = await AnalysisService.analyze_url(
            url=request.url,
            include_aeo=request.include_aeo,
            include_pagespeed=allow_pagespeed,
        )
    except Exception as e:
        logger.error(f"Analysis process failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    if current_user:
        seo_results = results.get("seo_result", {})
        pagespeed_results = results.get("pagespeed_result", {})
        blob_meta = BlobStorageService.save_json_blob(
            namespace="analysis_report",
            payload={
                "url": request.url,
                "user_id": current_user.id,
                "result": results,
            },
        )
        report = models.AnalysisReport(
            user_id=current_user.id,
            target_url=request.url,
            seo_score=seo_results.get("score", 0) if seo_results else 0,
            performance_score=pagespeed_results.get("performance_score", 0)
            if isinstance(pagespeed_results, dict)
            else 0,
            report_json=json.dumps(
                {
                    "storage_policy": "full_result_blob_with_db_summary",
                    "blob_meta": blob_meta,
                    "summary": _build_report_summary(results),
                },
                default=str,
            ),
        )
        db.add(report)
        db.commit()
        logger.info("Report saved successfully.")

    return {
        "url": request.url,
        "seo_result": results.get("seo_result", {}),
        "aeo_result": results.get("aeo_result"),
        "geo_result": results.get("geo_result"),
        "pagespeed_result": results.get("pagespeed_result"),
        "status": "completed",
    }


@router.post("/analyze/sitemap-batch")
async def create_sitemap_batch_job(
    request: SitemapBatchRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    tier = (getattr(current_user, "tier", "free") or "free").lower()
    if tier not in {"pro", "enterprise"}:
        raise HTTPException(
            status_code=403,
            detail="Full sitemap analysis requires a paid subscription (pro or enterprise).",
        )

    try:
        job = await sitemap_batch_service.create_batch_job(
            db=db,
            user=current_user,
            sitemap_url=request.sitemap_url,
            max_urls=request.max_urls,
            include_aeo=request.include_aeo,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create sitemap batch: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to create sitemap batch job"
        )

    return {
        "job_id": job.id,
        "status": job.status,
        "total_urls": job.total_urls,
        "queued_urls": job.queued_urls,
        "message": "Sitemap batch job queued.",
    }


@router.get("/analyze/sitemap-batch/{job_id}")
async def get_sitemap_batch_status(
    job_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    job = (
        db.query(models.SitemapBatchJob)
        .filter(
            models.SitemapBatchJob.id == job_id,
            models.SitemapBatchJob.user_id == current_user.id,
        )
        .first()
    )

    if not job:
        raise HTTPException(status_code=404, detail="Sitemap batch job not found")

    sample_items = (
        db.query(models.SitemapBatchItem)
        .filter(models.SitemapBatchItem.job_id == job.id)
        .order_by(models.SitemapBatchItem.id.asc())
        .limit(20)
        .all()
    )

    return {
        "job_id": job.id,
        "status": job.status,
        "sitemap_url": job.sitemap_url,
        "total_urls": job.total_urls,
        "queued_urls": job.queued_urls,
        "completed_urls": job.completed_urls,
        "failed_urls": job.failed_urls,
        "error_message": job.error_message,
        "items": [
            {
                "id": item.id,
                "url": item.target_url,
                "status": item.status,
                "attempts": item.attempts,
                "error_message": item.error_message,
            }
            for item in sample_items
        ],
    }
