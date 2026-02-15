import os
from typing import Dict, List


class AiOpsService:
    @staticmethod
    def _provider_rate_usd_per_1k_chars(provider: str) -> float:
        normalized = (provider or "").strip().lower()
        if normalized == "gpt":
            return float(os.getenv("EST_COST_USD_PER_1K_CHARS_GPT", "0"))
        if normalized == "gemini":
            return float(os.getenv("EST_COST_USD_PER_1K_CHARS_GEMINI", "0"))
        if normalized == "perplexity":
            return float(os.getenv("EST_COST_USD_PER_1K_CHARS_PERPLEXITY", "0"))
        return 0.0

    @staticmethod
    def classify_error(error_message: str) -> str:
        text = (error_message or "").lower()
        if "timeout" in text:
            return "timeout"
        if "429" in text or "rate" in text:
            return "rate_limit"
        if "401" in text or "403" in text or "api key" in text or "token" in text:
            return "auth"
        if "connection" in text or "network" in text or "dns" in text:
            return "network"
        if "missing" in text or "not available" in text:
            return "provider_unavailable"
        return "unknown"

    @staticmethod
    def estimate_cost_usd(provider: str, prompt_text: str, response_text: str) -> float:
        rate = AiOpsService._provider_rate_usd_per_1k_chars(provider)
        total_chars = len(prompt_text or "") + len(response_text or "")
        if total_chars <= 0 or rate <= 0:
            return 0.0
        return round((total_chars / 1000.0) * rate, 6)

    @staticmethod
    def summarize_llm_runs(llm_outputs: List[Dict]) -> Dict:
        outputs = llm_outputs or []
        success = [item for item in outputs if item.get("tier") != "not_available"]
        failed = [item for item in outputs if item.get("tier") == "not_available"]

        latencies = [int(item.get("latency_ms", 0) or 0) for item in success]
        total_latency = sum(latencies)
        avg_latency = int(total_latency / len(latencies)) if latencies else 0

        total_cost = round(
            sum(float(item.get("estimated_cost_usd", 0) or 0) for item in outputs), 6
        )

        return {
            "success_count": len(success),
            "failure_count": len(failed),
            "total_latency_ms": total_latency,
            "avg_latency_ms": avg_latency,
            "providers_used": sorted(
                {
                    item.get("provider_used")
                    for item in success
                    if item.get("provider_used")
                }
            ),
            "models_used": sorted(
                {item.get("model") for item in success if item.get("model")}
            ),
            "estimated_cost_usd_total": total_cost,
        }
