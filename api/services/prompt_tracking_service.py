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
        "tier4_not_mentioned": 0,
        "tier3_minor_mention": 35,
        "tier2_competitive_mention": 70,
        "tier1_core_mention": 100,
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

        has_domain = bool(domain and domain in text)
        has_brand = bool(brand and brand in text)
        has_mention = has_domain or has_brand

        if not has_mention:
            return MentionScore(
                tier="tier4_not_mentioned",
                score=PromptTrackingService.TIER_SCORES["tier4_not_mentioned"],
                reason="Tier 4: Brand is not mentioned in the response.",
            )

        mention_index = -1
        if has_brand and has_domain:
            mention_index = min(text.find(brand), text.find(domain))
        elif has_brand:
            mention_index = text.find(brand)
        else:
            mention_index = text.find(domain)

        competitor_cues = [
            " versus ",
            " vs ",
            "compared",
            "alternative",
            "other options",
            "competitor",
        ]
        has_competitor_context = any(cue in text for cue in competitor_cues)

        if mention_index >= 0 and mention_index <= 350 and not has_competitor_context:
            return MentionScore(
                tier="tier1_core_mention",
                score=PromptTrackingService.TIER_SCORES["tier1_core_mention"],
                reason="Tier 1: Brand is mentioned as a core answer element.",
            )

        if has_competitor_context:
            return MentionScore(
                tier="tier2_competitive_mention",
                score=PromptTrackingService.TIER_SCORES["tier2_competitive_mention"],
                reason="Tier 2: Brand is mentioned with competing alternatives.",
            )

        return MentionScore(
            tier="tier3_minor_mention",
            score=PromptTrackingService.TIER_SCORES["tier3_minor_mention"],
            reason="Tier 3: Brand is mentioned late or as low-priority reference.",
        )

    @staticmethod
    def run_prompt_tracking(
        query: str,
        target_url: str,
        brand_name: Optional[str],
        llm_sources: List[str],
        search_engines: List[str],
    ) -> Dict[str, object]:
        brand = PromptTrackingService.extract_brand(
            target_url=target_url, brand_name=brand_name
        )
        request_prompt = LlmService.build_prompt_tracking_request(query=query)

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
                response_share_url = llm_result[4]
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
                        "response_share_url": response_share_url,
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
