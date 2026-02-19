import os
import time
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright
import requests

from ..logger import setup_logger
from .provider_service import ProviderService

logger = setup_logger("api.services.llm_service")


class LlmService:
    @staticmethod
    def _supports_reasoning_effort(model: str) -> bool:
        normalized = (model or "").strip().lower()
        return normalized.startswith("gpt-5")

    @staticmethod
    def _extract_openai_text(data: Dict[str, Any]) -> str:
        output_text = data.get("output_text")
        if isinstance(output_text, str) and output_text.strip():
            return output_text.strip()

        chunks = data.get("output", [])
        texts = []
        for chunk in chunks if isinstance(chunks, list) else []:
            if not isinstance(chunk, dict):
                continue

            content_items = chunk.get("content", [])
            if not isinstance(content_items, list):
                continue

            for item in content_items:
                if not isinstance(item, dict):
                    continue

                item_type = str(item.get("type") or "").strip().lower()
                text_value = item.get("text")
                if isinstance(text_value, str) and text_value.strip():
                    if item_type in {"output_text", "text"}:
                        texts.append(text_value.strip())
                        continue

                if isinstance(text_value, dict):
                    nested_value = text_value.get("value")
                    if isinstance(nested_value, str) and nested_value.strip():
                        texts.append(nested_value.strip())

        if texts:
            return "\n".join(texts).strip()

        choices = data.get("choices", [])
        for choice in choices if isinstance(choices, list) else []:
            if not isinstance(choice, dict):
                continue
            message = choice.get("message")
            if not isinstance(message, dict):
                continue
            content = message.get("content")
            if isinstance(content, str) and content.strip():
                return content.strip()

        return ""

    @staticmethod
    def _openai_reasoning_effort() -> str:
        effort = (
            (os.getenv("OPENAI_REASONING_EFFORT", "medium") or "medium").strip().lower()
        )
        if effort not in {"low", "medium", "high"}:
            return "medium"
        return effort

    @staticmethod
    def _gemini_thinking_budget() -> int:
        raw_value = (os.getenv("GEMINI_THINKING_BUDGET", "-1") or "-1").strip()
        try:
            return int(raw_value)
        except Exception:
            return -1

    @staticmethod
    def _chatgpt_share_enabled() -> bool:
        return os.getenv("CHATGPT_SHARE_ENABLED", "false").strip().lower() == "true"

    @staticmethod
    def _chatgpt_share_timeout_ms() -> int:
        raw_value = (os.getenv("CHATGPT_SHARE_TIMEOUT_MS", "90000") or "90000").strip()
        try:
            parsed = int(raw_value)
            return max(15000, parsed)
        except Exception:
            return 90000

    @staticmethod
    def _create_chatgpt_share_link(prompt: str) -> Optional[str]:
        if not LlmService._chatgpt_share_enabled():
            return None

        storage_state_path = (os.getenv("CHATGPT_STORAGE_STATE_PATH", "") or "").strip()
        session_token = (os.getenv("CHATGPT_SESSION_TOKEN", "") or "").strip()
        timeout_ms = LlmService._chatgpt_share_timeout_ms()

        try:
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(headless=True)
                context_kwargs = {}

                if storage_state_path and Path(storage_state_path).exists():
                    context_kwargs["storage_state"] = storage_state_path

                context = browser.new_context(**context_kwargs)

                if session_token:
                    context.add_cookies(
                        [
                            {
                                "name": "__Secure-next-auth.session-token",
                                "value": session_token,
                                "domain": "chatgpt.com",
                                "path": "/",
                                "httpOnly": True,
                                "secure": True,
                            }
                        ]
                    )

                page = context.new_page()

                try:
                    page.goto(
                        "https://chatgpt.com/",
                        wait_until="domcontentloaded",
                        timeout=timeout_ms,
                    )

                    sent = False
                    composer_selectors = [
                        "textarea#prompt-textarea",
                        "textarea[placeholder*='Message']",
                        "div[data-testid='composer-text-input'][contenteditable='true']",
                        "div#prompt-textarea[contenteditable='true']",
                    ]

                    for selector in composer_selectors:
                        locator = page.locator(selector).first
                        try:
                            locator.wait_for(state="visible", timeout=5000)
                            locator.click()
                            locator.fill(prompt)
                            locator.press("Enter")
                            sent = True
                            break
                        except Exception:
                            continue

                    if not sent:
                        return None

                    page.wait_for_url("**/c/**", timeout=timeout_ms)
                    page.wait_for_timeout(5000)

                    conversation_url = page.url
                    share_link = page.evaluate(
                        r"""
                        async ({ conversationUrl }) => {
                          const match = conversationUrl.match(/\/c\/([^/?#]+)/)
                          const conversationId = match ? match[1] : null
                          if (!conversationId) return null

                          const sessionRes = await fetch('/api/auth/session', { credentials: 'include' })
                          if (!sessionRes.ok) return null
                          const session = await sessionRes.json()
                          const rawToken = session?.accessToken || session?.accessToken?.token
                          if (!rawToken) return null

                          const authToken = rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`
                          const headers = {
                            'Content-Type': 'application/json',
                            Authorization: authToken,
                          }

                          const convRes = await fetch(`/backend-api/conversation/${conversationId}`, {
                            method: 'GET',
                            headers,
                            credentials: 'include',
                          })
                          if (!convRes.ok) return null
                          const conversation = await convRes.json()
                          const currentNodeId = conversation?.current_node
                          if (!currentNodeId) return null

                          const createRes = await fetch('/backend-api/share/create', {
                            method: 'POST',
                            headers,
                            credentials: 'include',
                            body: JSON.stringify({
                              is_anonymous: true,
                              conversation_id: conversationId,
                              current_node_id: currentNodeId,
                            }),
                          })
                          if (!createRes.ok) return null
                          const createPayload = await createRes.json()
                          const shareId = createPayload?.share_id || createPayload?.id
                          if (!shareId) return null

                          await fetch(`/backend-api/share/${shareId}`, {
                            method: 'PATCH',
                            headers,
                            credentials: 'include',
                            body: JSON.stringify({
                              is_public: true,
                              is_anonymous: true,
                              is_visible: true,
                              title: conversation?.title || 'Shared conversation',
                              highlighted_message_id: currentNodeId,
                              share_id: shareId,
                            }),
                          })

                          return `https://chatgpt.com/share/${shareId}`
                        }
                        """,
                        {"conversationUrl": conversation_url},
                    )

                    if isinstance(share_link, str) and share_link.startswith(
                        "https://chatgpt.com/share/"
                    ):
                        return share_link
                    return None
                finally:
                    context.close()
                    browser.close()
        except PlaywrightTimeoutError as error:
            logger.warning("ChatGPT share generation timeout: %s", error)
            return None
        except Exception as error:
            logger.warning("ChatGPT share generation failed: %s", error)
            return None

    @staticmethod
    def _resolve_model_for_provider(provider: str) -> str:
        if provider == "gpt":
            gpt = ProviderService.get_gpt_credential()
            if gpt.mode == "openai_api_key":
                return os.getenv("OPENAI_MODEL", "gpt-5-nano")
            return os.getenv("AZURE_OPENAI_DEPLOYMENT", "azure-deployment")
        if provider == "gemini":
            return os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
        if provider == "perplexity":
            return os.getenv("PERPLEXITY_MODEL", "sonar")
        return "unknown"

    @staticmethod
    def _call_openai(
        prompt: str,
        response_format: Optional[Dict[str, Any]] = None,
        max_output_tokens: int = 800,
    ) -> Tuple[str, Optional[str]]:
        api_key = os.getenv("OPENAI_API_KEY", "")
        model = os.getenv("OPENAI_MODEL", "gpt-5-nano")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY missing")

        payload: Dict[str, Any] = {
            "model": model,
            "input": prompt,
            "max_output_tokens": int(max_output_tokens),
        }
        reasoning_enabled = LlmService._supports_reasoning_effort(model)
        if reasoning_enabled:
            payload["reasoning"] = {"effort": LlmService._openai_reasoning_effort()}

        if response_format is not None:
            payload["text"] = {"format": response_format}

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        response = requests.post(
            "https://api.openai.com/v1/responses",
            headers=headers,
            json=payload,
            timeout=45,
        )

        if response.status_code == 400 and reasoning_enabled:
            try:
                error_payload = response.json()
            except Exception:
                error_payload = {}

            error_param = (
                ((error_payload.get("error") or {}).get("param") or "")
                if isinstance(error_payload, dict)
                else ""
            )
            error_code = (
                ((error_payload.get("error") or {}).get("code") or "")
                if isinstance(error_payload, dict)
                else ""
            )

            if (
                error_param == "reasoning.effort"
                or error_code == "unsupported_parameter"
            ):
                payload.pop("reasoning", None)
                response = requests.post(
                    "https://api.openai.com/v1/responses",
                    headers=headers,
                    json=payload,
                    timeout=45,
                )

        response.raise_for_status()
        data = response.json()
        response_share_url = LlmService._create_chatgpt_share_link(prompt=prompt)

        extracted_text = LlmService._extract_openai_text(data)
        response_status = str(data.get("status") or "").strip() or "unknown"

        incomplete_reason = "none"
        incomplete_details = data.get("incomplete_details")
        if isinstance(incomplete_details, dict):
            reason = str(incomplete_details.get("reason") or "").strip()
            if reason:
                incomplete_reason = reason

        output_items = data.get("output")
        output_list = output_items if isinstance(output_items, list) else []
        output_types = []
        content_types = []

        for output_item in output_list:
            if not isinstance(output_item, dict):
                continue

            output_type = str(output_item.get("type") or "").strip()
            if output_type:
                output_types.append(output_type)

            content_items = output_item.get("content")
            if not isinstance(content_items, list):
                continue

            for content_item in content_items:
                if not isinstance(content_item, dict):
                    continue
                content_type = str(content_item.get("type") or "").strip()
                if content_type:
                    content_types.append(content_type)

        if (
            not bool((extracted_text or "").strip())
            and incomplete_reason == "max_output_tokens"
        ):
            retry_payload = dict(payload)
            retry_payload["max_output_tokens"] = min(int(max_output_tokens) * 3, 6000)
            if isinstance(retry_payload.get("reasoning"), dict):
                retry_payload["reasoning"] = {"effort": "low"}

            retry_response = requests.post(
                "https://api.openai.com/v1/responses",
                headers=headers,
                json=retry_payload,
                timeout=45,
            )
            retry_response.raise_for_status()
            retry_data = retry_response.json()

            retry_text = LlmService._extract_openai_text(retry_data)
            retry_status = str(retry_data.get("status") or "").strip() or "unknown"
            retry_incomplete_reason = "none"
            retry_incomplete_details = retry_data.get("incomplete_details")
            if isinstance(retry_incomplete_details, dict):
                retry_reason = str(retry_incomplete_details.get("reason") or "").strip()
                if retry_reason:
                    retry_incomplete_reason = retry_reason

            retry_output = retry_data.get("output")
            retry_output_list = retry_output if isinstance(retry_output, list) else []
            retry_output_types = []
            retry_content_types = []

            for output_item in retry_output_list:
                if not isinstance(output_item, dict):
                    continue
                output_type = str(output_item.get("type") or "").strip()
                if output_type:
                    retry_output_types.append(output_type)

                content_items = output_item.get("content")
                if not isinstance(content_items, list):
                    continue
                for content_item in content_items:
                    if not isinstance(content_item, dict):
                        continue
                    content_type = str(content_item.get("type") or "").strip()
                    if content_type:
                        retry_content_types.append(content_type)

            logger.info(
                "OpenAI response summary model='%s' status='%s' incomplete_reason='%s' output_items=%s output_types=%s content_types=%s empty_text=%s retry=1",
                model,
                retry_status,
                retry_incomplete_reason,
                len(retry_output_list),
                ",".join(retry_output_types[:6]) if retry_output_types else "none",
                ",".join(retry_content_types[:10]) if retry_content_types else "none",
                not bool((retry_text or "").strip()),
            )

            extracted_text = retry_text
            response_status = retry_status
            incomplete_reason = retry_incomplete_reason
            output_list = retry_output_list
            output_types = retry_output_types
            content_types = retry_content_types

        logger.info(
            "OpenAI response summary model='%s' status='%s' incomplete_reason='%s' output_items=%s output_types=%s content_types=%s empty_text=%s",
            model,
            response_status,
            incomplete_reason,
            len(output_list),
            ",".join(output_types[:6]) if output_types else "none",
            ",".join(content_types[:10]) if content_types else "none",
            not bool((extracted_text or "").strip()),
        )

        return extracted_text, response_share_url

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
        content = choices[0].get("message", {}).get("content")
        if isinstance(content, str):
            return content.strip(), None
        return "", None

    @staticmethod
    def _call_gemini(prompt: str) -> Tuple[str, Optional[str]]:
        key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
        if not key:
            raise RuntimeError("GEMINI_API_KEY/GOOGLE_API_KEY missing")

        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            params={"key": key},
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "thinkingConfig": {
                        "thinkingBudget": LlmService._gemini_thinking_budget(),
                    }
                },
            },
            timeout=45,
        )
        response.raise_for_status()

        payload = response.json()
        candidates = payload.get("candidates") or []
        if not candidates:
            return "", None

        content = candidates[0].get("content") or {}
        parts = content.get("parts") or []
        chunks = []
        for part in parts:
            if isinstance(part, dict):
                text = (part.get("text") or "").strip()
                if text:
                    chunks.append(text)

        return "\n".join(chunks).strip(), None

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
        content = choices[0].get("message", {}).get("content")
        if isinstance(content, str):
            return content.strip(), reference_url
        return "", reference_url

    @staticmethod
    def call_with_fallback(
        prompt: str,
        preferred_provider: str,
        response_format: Optional[Dict[str, Any]] = None,
        max_output_tokens: int = 800,
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
                        answer, share_url = LlmService._call_openai(
                            prompt=prompt,
                            response_format=response_format,
                            max_output_tokens=max_output_tokens,
                        )
                    else:
                        answer, share_url = LlmService._call_azure_openai(prompt)

                    if not (answer or "").strip():
                        raise RuntimeError("gpt_empty_response")

                    latency_ms = int((time.perf_counter() - started) * 1000)
                    logger.info(
                        "LLM success provider='gpt' model='%s' latency_ms=%s share_link=%s",
                        LlmService._resolve_model_for_provider("gpt"),
                        latency_ms,
                        bool(share_url),
                    )
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

                        if not (answer or "").strip():
                            raise RuntimeError("gemini_empty_response")

                        latency_ms = int((time.perf_counter() - started) * 1000)
                        logger.info(
                            "LLM success provider='gemini' model='%s' latency_ms=%s share_link=%s",
                            LlmService._resolve_model_for_provider("gemini"),
                            latency_ms,
                            bool(share_url),
                        )
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

                    if not (answer or "").strip():
                        raise RuntimeError("perplexity_empty_response")

                    latency_ms = int((time.perf_counter() - started) * 1000)
                    logger.info(
                        "LLM success provider='perplexity' model='%s' latency_ms=%s share_link=%s",
                        LlmService._resolve_model_for_provider("perplexity"),
                        latency_ms,
                        bool(share_url),
                    )
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
