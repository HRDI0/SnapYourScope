import json
import hashlib
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .. import auth, database, models
from ..config import SEARCH_RANK_TEMP_DISABLED
from ..services.prompt_tracking_service import PromptTrackingService
from ..services.search_tracking_service import SearchTrackingService

router = APIRouter(tags=["Prompt Tracking"])

PROMPT_INCLUDED_COUNT = 5
PROMPT_ADDON_BLOCK_SIZE = 5
PROMPT_ADDON_BLOCK_PRICE_USD = 0
DEMO_ENABLED_LLM_SOURCES = {"gpt"}
DEMO_ENABLED_SEARCH_ENGINES = set()


class SearchRankRequest(BaseModel):
    query: Optional[str] = None
    queries: Optional[List[str]] = None
    target_url: str
    engines: List[str] = Field(default_factory=lambda: ["google", "naver"])


class PromptTrackRequest(BaseModel):
    query: Optional[str] = None
    queries: Optional[List[str]] = None
    target_url: str
    demo_client_id: Optional[str] = None
    brand_name: Optional[str] = None
    llm_sources: List[str] = Field(default_factory=lambda: ["gpt", "gemini"])
    search_engines: List[str] = Field(default_factory=list)


def _normalize_queries(
    query: Optional[str],
    queries: Optional[List[str]],
    dedup: bool = True,
) -> List[str]:
    normalized = [item.strip() for item in (queries or []) if item and item.strip()]

    query_value = (query or "").strip()
    if query_value and (not normalized or normalized[0] != query_value):
        normalized.insert(0, query_value)

    if not dedup:
        return normalized

    deduped: List[str] = []
    seen = set()
    for item in normalized:
        if item not in seen:
            deduped.append(item)
            seen.add(item)
    return deduped


def _summarize_prompt_result(result: Dict[str, Any]) -> Dict[str, Any]:
    llm_results = result.get("llm_results", []) if isinstance(result, dict) else []
    compact_llm = []
    for item in llm_results:
        compact_llm.append(
            {
                "source": item.get("source"),
                "provider_used": item.get("provider_used"),
                "model": item.get("model"),
                "tier": item.get("tier"),
                "score": item.get("score"),
                "reason": item.get("reason"),
                "latency_ms": item.get("latency_ms", 0),
                "error_type": item.get("error_type"),
                "estimated_cost_usd": item.get("estimated_cost_usd", 0.0),
                "response_share_url": item.get("response_share_url"),
            }
        )

    return {
        "query": result.get("query"),
        "target_url": result.get("target_url"),
        "brand": result.get("brand"),
        "share_of_model_score": result.get("share_of_model_score", 0),
        "llm_results": compact_llm,
        "search_rank_results": result.get("search_rank_results", {}),
        "tracking_meta": result.get("tracking_meta", {}),
    }


def _primary_llm_result(summary: Dict[str, Any]) -> Dict[str, Any]:
    llm_results = summary.get("llm_results", [])
    for item in llm_results:
        if item.get("tier") != "not_available":
            return item
    return llm_results[0] if llm_results else {}


def _normalize_options(values: List[str], allowed: set[str]) -> List[str]:
    normalized: List[str] = []
    seen = set()
    for value in values:
        key = (value or "").strip().lower()
        if not key or key not in allowed or key in seen:
            continue
        normalized.append(key)
        seen.add(key)
    return normalized


def _ensure_search_rank_enabled() -> None:
    if SEARCH_RANK_TEMP_DISABLED:
        raise HTTPException(
            status_code=503,
            detail="Search rank tracking is temporarily paused during open beta.",
        )


@router.post("/search-rank")
async def search_rank(
    request: SearchRankRequest,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
):
    _ensure_search_rank_enabled()

    dedup_queries = _normalize_queries(request.query, request.queries, dedup=True)
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
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db=Depends(database.get_db),
):
    dedup_queries = _normalize_queries(request.query, request.queries, dedup=False)
    if not dedup_queries:
        raise HTTPException(
            status_code=400, detail="At least one prompt query is required."
        )

    llm_sources = _normalize_options(request.llm_sources, DEMO_ENABLED_LLM_SOURCES)
    if not llm_sources:
        raise HTTPException(
            status_code=400,
            detail="No enabled LLM source selected. Available in demo: gpt.",
        )

    search_engines = _normalize_options(
        request.search_engines, DEMO_ENABLED_SEARCH_ENGINES
    )

    if len(dedup_queries) > PROMPT_INCLUDED_COUNT:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Prompt tracking accepts up to {PROMPT_INCLUDED_COUNT} prompts per request."
            ),
        )

    demo_client_id = (request.demo_client_id or "").strip()
    if current_user is None and not demo_client_id:
        raise HTTPException(
            status_code=400,
            detail="demo_client_id is required for guest open beta prompt tracking.",
        )

    extra_prompts = max(0, len(dedup_queries) - PROMPT_INCLUDED_COUNT)
    add_on_units = 0
    add_on_usd_monthly = add_on_units * PROMPT_ADDON_BLOCK_PRICE_USD

    results = []
    try:
        for query in dedup_queries:
            result = PromptTrackingService.run_prompt_tracking(
                query=query,
                target_url=request.target_url,
                brand_name=request.brand_name,
                llm_sources=llm_sources,
                search_engines=search_engines,
            )
            summary = _summarize_prompt_result(result)
            primary = _primary_llm_result(summary)
            is_failed = primary.get("tier") == "not_available"
            run = models.PromptTrackRun(
                user_id=current_user.id if current_user is not None else 0,
                target_url=request.target_url,
                query_text=(
                    "[not_stored]"
                    if current_user is not None
                    else f"[guest_demo:{demo_client_id}]"
                ),
                query_hash=hashlib.sha256(query.encode("utf-8")).hexdigest(),
                status="failed" if is_failed else "completed",
                provider_used=primary.get("provider_used"),
                model_name=primary.get("model"),
                mention_tier=primary.get("tier"),
                share_of_model_score=int(summary.get("share_of_model_score", 0) or 0),
                latency_ms=int(primary.get("latency_ms", 0) or 0),
                error_message=primary.get("reason") if is_failed else None,
                response_share_url=primary.get("response_share_url"),
                result_summary_json=json.dumps(summary, default=str),
                result_json=json.dumps(
                    {
                        "storage_policy": "no_raw_prompt_or_llm_response",
                        "query": "[not_stored]",
                    },
                    default=str,
                ),
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
            "beta_mode": "open_beta",
            "used_prompts": len(dedup_queries),
            "remaining_prompts": max(0, PROMPT_INCLUDED_COUNT - len(dedup_queries)),
            "enabled_llm_sources": sorted(DEMO_ENABLED_LLM_SOURCES),
            "enabled_search_engines": sorted(DEMO_ENABLED_SEARCH_ENGINES),
        },
    }
