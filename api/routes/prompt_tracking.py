import json
import math
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .. import auth, database, models
from ..services.prompt_tracking_service import PromptTrackingService
from ..services.search_tracking_service import SearchTrackingService

router = APIRouter(tags=["Prompt Tracking"])

PROMPT_INCLUDED_COUNT = 30
PROMPT_ADDON_BLOCK_SIZE = 5
PROMPT_ADDON_BLOCK_PRICE_USD = 10


class SearchRankRequest(BaseModel):
    query: Optional[str] = None
    queries: Optional[List[str]] = None
    target_url: str
    engines: List[str] = Field(default_factory=lambda: ["google", "bing", "naver"])


class PromptTrackRequest(BaseModel):
    query: Optional[str] = None
    queries: Optional[List[str]] = None
    target_url: str
    brand_name: Optional[str] = None
    llm_sources: List[str] = Field(default_factory=lambda: ["gpt", "gemini"])
    search_engines: List[str] = Field(
        default_factory=lambda: ["google", "bing", "naver"]
    )


def _normalize_queries(query: Optional[str], queries: Optional[List[str]]) -> List[str]:
    normalized = [item.strip() for item in (queries or []) if item and item.strip()]
    if query and query.strip():
        normalized.insert(0, query.strip())

    deduped: List[str] = []
    seen = set()
    for item in normalized:
        if item not in seen:
            deduped.append(item)
            seen.add(item)
    return deduped


@router.post("/search-rank")
async def search_rank(
    request: SearchRankRequest,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
):
    dedup_queries = _normalize_queries(request.query, request.queries)
    if not dedup_queries:
        raise HTTPException(status_code=400, detail="At least one query is required.")

    tier = (
        (getattr(current_user, "tier", None) or "free").lower()
        if current_user
        else "free"
    )
    if len(dedup_queries) > 1 and tier not in {"pro", "enterprise"}:
        raise HTTPException(
            status_code=403,
            detail="Multi-keyword rank tracking is a paid feature (pro or enterprise).",
        )

    results = {
        query: SearchTrackingService.run_search_rank(
            query=query,
            target_url=request.target_url,
            engines=request.engines,
        )
        for query in dedup_queries
    }

    return {
        "query": dedup_queries[0],
        "queries": dedup_queries,
        "target_url": request.target_url,
        "results": results,
        "tracking_mode": "daily",
    }


@router.post("/prompt-track")
async def prompt_track(
    request: PromptTrackRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    tier = (getattr(current_user, "tier", "free") or "free").lower()
    if tier not in {"pro", "enterprise"}:
        raise HTTPException(
            status_code=403,
            detail="Prompt tracking is a paid feature (pro or enterprise).",
        )

    dedup_queries = _normalize_queries(request.query, request.queries)
    if not dedup_queries:
        raise HTTPException(
            status_code=400, detail="At least one prompt query is required."
        )
    extra_prompts = max(0, len(dedup_queries) - PROMPT_INCLUDED_COUNT)
    add_on_units = (
        math.ceil(extra_prompts / PROMPT_ADDON_BLOCK_SIZE) if extra_prompts else 0
    )
    add_on_usd_monthly = add_on_units * PROMPT_ADDON_BLOCK_PRICE_USD

    results = []
    try:
        for query in dedup_queries:
            result = PromptTrackingService.run_prompt_tracking(
                query=query,
                target_url=request.target_url,
                brand_name=request.brand_name,
                llm_sources=request.llm_sources,
                search_engines=request.search_engines,
            )
            run = models.PromptTrackRun(
                user_id=current_user.id,
                target_url=request.target_url,
                query_text=query,
                status="completed",
                result_json=json.dumps(result, default=str),
            )
            db.add(run)
            results.append(result)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    db.commit()

    return {
        "query": dedup_queries[0],
        "queries": dedup_queries,
        "target_url": request.target_url,
        "results": results,
        "tracking_mode": "weekly",
        "pricing_meta": {
            "included_prompts": PROMPT_INCLUDED_COUNT,
            "extra_prompts": extra_prompts,
            "add_on_units": add_on_units,
            "add_on_usd_monthly": add_on_usd_monthly,
            "add_on_block_size": PROMPT_ADDON_BLOCK_SIZE,
        },
    }
