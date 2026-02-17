import os
import time
from importlib import import_module
from typing import Dict, Optional, Tuple

import requests

from ..logger import setup_logger
from .provider_service import ProviderService

logger = setup_logger("api.services.llm_service")


class LlmService:
    @staticmethod
    def _resolve_model_for_provider(provider: str) -> str:
        if provider == "gpt":
            gpt = ProviderService.get_gpt_credential()
            if gpt.mode == "openai_api_key":
                return os.getenv("OPENAI_MODEL", "gpt-4o-mini")
            return os.getenv("AZURE_OPENAI_DEPLOYMENT", "azure-deployment")
        if provider == "gemini":
            return os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        if provider == "perplexity":
            return os.getenv("PERPLEXITY_MODEL", "sonar")
        return "unknown"

    @staticmethod
    def _call_openai(prompt: str) -> Tuple[str, Optional[str]]:
        api_key = os.getenv("OPENAI_API_KEY", "")
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY missing")

        response = requests.post(
            "https://api.openai.com/v1/responses",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "input": prompt,
                "max_output_tokens": 800,
            },
            timeout=45,
        )
        response.raise_for_status()
        data = response.json()
        response_id = data.get("id")
        response_share_url = (
            f"https://api.openai.com/v1/responses/{response_id}"
            if response_id
            else None
        )
        output_text = data.get("output_text")
        if output_text:
            return output_text, response_share_url

        chunks = data.get("output", [])
        texts = []
        for chunk in chunks:
            for item in chunk.get("content", []):
                if item.get("type") == "output_text":
                    texts.append(item.get("text", ""))
        return "\n".join([t for t in texts if t]).strip(), response_share_url

    @staticmethod
    def _call_azure_openai(prompt: str) -> Tuple[str, Optional[str]]:
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "").rstrip("/")
        deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "")
        api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-10-21")
        if not endpoint or not deployment:
            raise RuntimeError("Azure OpenAI endpoint/deployment missing")

        url = (
            f"{endpoint}/openai/deployments/{deployment}/chat/completions"
            f"?api-version={api_version}"
        )
        headers = {"Content-Type": "application/json"}
        if os.getenv("AZURE_OPENAI_ACCESS_TOKEN", ""):
            headers["Authorization"] = (
                f"Bearer {os.getenv('AZURE_OPENAI_ACCESS_TOKEN', '')}"
            )
        elif os.getenv("AZURE_OPENAI_API_KEY", ""):
            azure_key = os.getenv("AZURE_OPENAI_API_KEY") or ""
            headers["api-key"] = azure_key
        else:
            raise RuntimeError("Azure OpenAI token or api-key missing")

        response = requests.post(
            url,
            headers=headers,
            json={
                "messages": [
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                "max_tokens": 800,
                "temperature": 0.2,
            },
            timeout=45,
        )
        response.raise_for_status()
        data = response.json()
        choices = data.get("choices", [])
        if not choices:
            return "", None
        return choices[0].get("message", {}).get("content", ""), None

    @staticmethod
    def _call_gemini(prompt: str) -> Tuple[str, Optional[str]]:
        genai = import_module("google.generativeai")

        key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        if not key:
            raise RuntimeError("GEMINI_API_KEY/GOOGLE_API_KEY missing")
        configure_fn = getattr(genai, "configure", None)
        model_cls = getattr(genai, "GenerativeModel", None)
        if not callable(configure_fn) or model_cls is None:
            raise RuntimeError("google.generativeai does not expose required APIs")
        configure_fn(api_key=key)
        response = model_cls(model).generate_content(prompt)
        return (getattr(response, "text", "") or "").strip(), None

    @staticmethod
    def _call_perplexity(prompt: str) -> Tuple[str, Optional[str]]:
        api_key = os.getenv("PERPLEXITY_API_KEY", "")
        model = os.getenv("PERPLEXITY_MODEL", "sonar")
        if not api_key:
            raise RuntimeError("PERPLEXITY_API_KEY missing")

        response = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2,
            },
            timeout=45,
        )
        response.raise_for_status()
        data = response.json()
        choices = data.get("choices", [])
        if not choices:
            return "", None
        completion_id = data.get("id")
        reference_url = (
            f"https://api.perplexity.ai/chat/completions/{completion_id}"
            if completion_id
            else None
        )
        return choices[0].get("message", {}).get("content", ""), reference_url

    @staticmethod
    def call_with_fallback(
        prompt: str,
        preferred_provider: str,
    ) -> Tuple[str, str, str, int, Optional[str]]:
        provider = preferred_provider.lower().strip()
        gpt = ProviderService.get_gpt_credential()
        gemini = ProviderService.get_gemini_credential()
        perplexity = ProviderService.get_perplexity_credential()

        order = []
        if provider == "gpt":
            order = ["gpt", "gemini"]
        elif provider == "gemini":
            order = ["gemini", "gpt"]
        elif provider == "perplexity":
            order = ["perplexity", "gemini", "gpt"]
        else:
            order = ["gpt", "gemini"]

        last_error: Optional[Exception] = None
        for source in order:
            try:
                started = time.perf_counter()
                if source == "gpt" and gpt.available:
                    if gpt.mode == "openai_api_key":
                        answer, share_url = LlmService._call_openai(prompt)
                    else:
                        answer, share_url = LlmService._call_azure_openai(prompt)
                    latency_ms = int((time.perf_counter() - started) * 1000)
                    return (
                        answer,
                        "gpt",
                        LlmService._resolve_model_for_provider("gpt"),
                        latency_ms,
                        share_url,
                    )

                if source == "gemini" and gemini.available:
                    if gemini.mode == "gemini_api_key":
                        answer, share_url = LlmService._call_gemini(prompt)
                        latency_ms = int((time.perf_counter() - started) * 1000)
                        return (
                            answer,
                            "gemini",
                            LlmService._resolve_model_for_provider("gemini"),
                            latency_ms,
                            share_url,
                        )
                    raise RuntimeError(
                        "Vertex OAuth mode detected. Set GEMINI_API_KEY/GOOGLE_API_KEY for this build."
                    )

                if source == "perplexity" and perplexity.available:
                    answer, share_url = LlmService._call_perplexity(prompt)
                    latency_ms = int((time.perf_counter() - started) * 1000)
                    return (
                        answer,
                        "perplexity",
                        LlmService._resolve_model_for_provider("perplexity"),
                        latency_ms,
                        share_url,
                    )
            except Exception as e:
                last_error = e
                logger.warning(f"LLM call failed on {source}: {e}")

        raise RuntimeError(f"No available provider succeeded: {last_error}")

    @staticmethod
    def build_prompt_tracking_request(query: str) -> str:
        return query
