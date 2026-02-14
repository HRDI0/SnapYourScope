import os
from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class ProviderCredential:
    provider: str
    mode: str
    available: bool
    reason: Optional[str] = None


class ProviderService:
    @staticmethod
    def get_gpt_credential() -> ProviderCredential:
        if os.getenv("OPENAI_API_KEY"):
            return ProviderCredential(
                provider="gpt",
                mode="openai_api_key",
                available=True,
            )

        if (
            os.getenv("AZURE_OPENAI_ENDPOINT")
            and os.getenv("AZURE_OPENAI_DEPLOYMENT")
            and (
                os.getenv("AZURE_OPENAI_API_KEY")
                or os.getenv("AZURE_OPENAI_ACCESS_TOKEN")
            )
        ):
            return ProviderCredential(
                provider="gpt",
                mode=(
                    "azure_openai_oauth"
                    if os.getenv("AZURE_OPENAI_ACCESS_TOKEN")
                    else "azure_openai_api_key"
                ),
                available=True,
            )

        return ProviderCredential(
            provider="gpt",
            mode="unavailable",
            available=False,
            reason="Set OPENAI_API_KEY or Azure OpenAI credentials",
        )

    @staticmethod
    def get_gemini_credential() -> ProviderCredential:
        if os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"):
            return ProviderCredential(
                provider="gemini",
                mode="gemini_api_key",
                available=True,
            )

        if os.getenv("VERTEX_PROJECT_ID") and os.getenv(
            "GOOGLE_APPLICATION_CREDENTIALS"
        ):
            return ProviderCredential(
                provider="gemini",
                mode="vertex_ai_oauth",
                available=True,
            )

        return ProviderCredential(
            provider="gemini",
            mode="unavailable",
            available=False,
            reason="Set GEMINI_API_KEY/GOOGLE_API_KEY or Vertex credentials",
        )

    @staticmethod
    def get_perplexity_credential() -> ProviderCredential:
        if os.getenv("PERPLEXITY_API_KEY"):
            return ProviderCredential(
                provider="perplexity",
                mode="perplexity_api_key",
                available=True,
            )

        return ProviderCredential(
            provider="perplexity",
            mode="unavailable",
            available=False,
            reason="Set PERPLEXITY_API_KEY",
        )

    @staticmethod
    def capability_report() -> Dict[str, Dict[str, Optional[str]]]:
        gpt = ProviderService.get_gpt_credential()
        gemini = ProviderService.get_gemini_credential()
        perplexity = ProviderService.get_perplexity_credential()

        return {
            "gpt": {
                "available": str(gpt.available).lower(),
                "mode": gpt.mode,
                "reason": gpt.reason,
                "subscription_oauth_supported": "no",
                "notes": "ChatGPT subscription OAuth is not a programmatic API credential.",
            },
            "gemini": {
                "available": str(gemini.available).lower(),
                "mode": gemini.mode,
                "reason": gemini.reason,
                "subscription_oauth_supported": "no",
                "notes": "Gemini consumer subscription OAuth is not a programmatic API credential.",
            },
            "perplexity": {
                "available": str(perplexity.available).lower(),
                "mode": perplexity.mode,
                "reason": perplexity.reason,
            },
            "fallback": {
                "gpt_to_gemini": "enabled",
                "gemini_to_gpt": "enabled",
            },
        }
