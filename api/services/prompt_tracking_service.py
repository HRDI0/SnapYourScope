from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List, Optional
from urllib.parse import urlparse

from .ai_ops_service import AiOpsService
from .llm_service import LlmService
from .search_tracking_service import SearchTrackingService


@dataclass
class MentionScore:
    tier: str
    score: int
    reason: str


class PromptTrackingService:
    TIER_SCORES = {
        "not_mentioned": 0,
        "mentioned": 35,
        "mentioned_and_linked": 70,
        "core_mentioned": 100,
    }

    @staticmethod
    def extract_brand(target_url: str, brand_name: Optional[str] = None) -> str:
        if brand_name and brand_name.strip():
            return brand_name.strip().lower()

        parsed = urlparse(target_url.strip())
        host = (parsed.netloc or parsed.path).lower()
        host = host.replace("www.", "")
        return host.split(".")[0] if host else ""

    @staticmethod
    def evaluate_mention(
        response_text: str, target_url: str, brand: str
    ) -> MentionScore:
        text = (response_text or "").lower()
        domain = SearchTrackingService.normalize_domain(target_url)

        has_domain = domain and domain in text
        has_brand = brand and brand in text
        has_link = ("http://" in text or "https://" in text) and has_domain
        is_core = has_brand and text[:350].find(brand) >= 0

        if is_core:
            return MentionScore(
                tier="core_mentioned",
                score=PromptTrackingService.TIER_SCORES["core_mentioned"],
                reason="Brand appears in the core answer section.",
            )
        if has_link:
            return MentionScore(
                tier="mentioned_and_linked",
                score=PromptTrackingService.TIER_SCORES["mentioned_and_linked"],
                reason="Brand/domain is mentioned with link context.",
            )
        if has_brand or has_domain:
            return MentionScore(
                tier="mentioned",
                score=PromptTrackingService.TIER_SCORES["mentioned"],
                reason="Brand/domain appears in the answer.",
            )
        return MentionScore(
            tier="not_mentioned",
            score=PromptTrackingService.TIER_SCORES["not_mentioned"],
            reason="No brand/domain mention detected.",
        )

    @staticmethod
    def run_prompt_tracking(
        query: str,
        target_url: str,
        brand_name: Optional[str],
        llm_sources: List[str],
        search_engines: List[str],
    ) -> Dict:
        brand = PromptTrackingService.extract_brand(
            target_url=target_url, brand_name=brand_name
        )
        request_prompt = LlmService.build_prompt_tracking_request(
            query=query,
            brand_url=target_url,
        )

        llm_outputs = []
        for source in llm_sources:
            normalized = source.lower().strip()
            try:
                llm_result = LlmService.call_with_fallback(
                    prompt=request_prompt,
                    preferred_provider=normalized,
                )
                answer_text = llm_result[0]
                used_provider = llm_result[1]
                used_model = llm_result[2]
                latency_ms = llm_result[3]
                mention = PromptTrackingService.evaluate_mention(
                    response_text=answer_text,
                    target_url=target_url,
                    brand=brand,
                )
                llm_outputs.append(
                    {
                        "source": normalized,
                        "provider_used": used_provider,
                        "model": used_model,
                        "tier": mention.tier,
                        "score": mention.score,
                        "reason": mention.reason,
                        "latency_ms": latency_ms,
                        "error_type": None,
                        "estimated_cost_usd": AiOpsService.estimate_cost_usd(
                            provider=used_provider,
                            prompt_text=request_prompt,
                            response_text=answer_text,
                        ),
                        "response_excerpt": answer_text[:1500],
                        "response_share_url": None,
                    }
                )
            except Exception as e:
                error_message = str(e)
                llm_outputs.append(
                    {
                        "source": normalized,
                        "provider_used": None,
                        "model": None,
                        "tier": "not_available",
                        "score": 0,
                        "reason": error_message,
                        "latency_ms": 0,
                        "error_type": AiOpsService.classify_error(error_message),
                        "estimated_cost_usd": 0.0,
                        "response_excerpt": "",
                        "response_share_url": None,
                    }
                )

        ranking = SearchTrackingService.run_search_rank(
            query=query,
            target_url=target_url,
            engines=search_engines,
        )

        valid_scores = [
            item["score"] for item in llm_outputs if item.get("tier") != "not_available"
        ]
        share_of_model_score = (
            int(sum(valid_scores) / len(valid_scores)) if valid_scores else 0
        )

        return {
            "query": query,
            "target_url": target_url,
            "brand": brand,
            "share_of_model_score": share_of_model_score,
            "llm_results": llm_outputs,
            "search_rank_results": ranking,
            "tracking_meta": {
                "captured_at": datetime.now(timezone.utc).isoformat(),
                "storage_policy": "no_raw_prompt_or_llm_response",
                "retry_policy": {
                    "provider_fallback": "enabled",
                    "max_attempts_per_source": 1,
                },
                "quality": {
                    "tier_score_weights": PromptTrackingService.TIER_SCORES,
                    "share_of_model_score_method": "average_of_available_llm_scores",
                },
                "ops": AiOpsService.summarize_llm_runs(llm_outputs),
            },
        }
