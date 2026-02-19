import os
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from urllib.parse import parse_qs, quote_plus, urlparse

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright
import requests

from ..config import SEARCH_RANK_TEMP_DISABLED
from ..logger import setup_logger


logger = setup_logger("api.services.search_tracking")


@dataclass
class SearchResultItem:
    title: str
    link: str
    snippet: str


class SearchTrackingService:
    @staticmethod
    def _google_search_timeout_seconds() -> int:
        raw_value = (os.getenv("GOOGLE_SEARCH_TIMEOUT_SEC", "20") or "20").strip()
        try:
            parsed = int(raw_value)
        except Exception:
            parsed = 20
        return max(8, min(parsed, 80))

    @staticmethod
    def _safe_error_message(error: Exception) -> str:
        if isinstance(error, requests.HTTPError):
            response = error.response
            status = response.status_code if response is not None else None
            provider_message = ""
            if response is not None:
                try:
                    provider_message = (
                        (response.json() or {})
                        .get("error", {})
                        .get("message", "")
                        .strip()
                    )
                except Exception:
                    provider_message = ""

            if status is not None and provider_message:
                return f"http_{status}: {provider_message}"
            if status is not None:
                return f"http_{status}"
            return "http_error"

        if isinstance(error, requests.RequestException):
            return error.__class__.__name__.lower()

        if isinstance(error, (PlaywrightError, PlaywrightTimeoutError)):
            message = str(error).strip()
            lowered = message.lower()
            if "sorry/index" in lowered or "unusual traffic" in lowered:
                return "google_automation_blocked"
            if lowered:
                return lowered[:240]
            return error.__class__.__name__.lower()

        if isinstance(error, RuntimeError):
            text = str(error).strip().lower()
            if text:
                return text
            return "runtimeerror"

        return error.__class__.__name__.lower()

    @staticmethod
    def _extract_google_link(href: str) -> str:
        candidate = (href or "").strip()
        if not candidate:
            return ""

        if candidate.startswith("http://") or candidate.startswith("https://"):
            return candidate

        if candidate.startswith("/url?"):
            parsed = urlparse(candidate)
            query = parse_qs(parsed.query)
            outbound = (query.get("q") or [""])[0].strip()
            if outbound.startswith("http://") or outbound.startswith("https://"):
                return outbound

        return ""

    @staticmethod
    def _is_google_internal_link(link: str) -> bool:
        domain = SearchTrackingService.normalize_domain(link)
        return bool(domain) and "google." in domain

    @staticmethod
    def _parse_google_results(
        raw_items: List[Dict[str, str]], limit: int
    ) -> List[SearchResultItem]:
        rows: List[SearchResultItem] = []
        seen_links = set()

        for item in raw_items:
            outbound_link = SearchTrackingService._extract_google_link(
                str(item.get("link") or "")
            )
            if not outbound_link:
                continue

            if SearchTrackingService._is_google_internal_link(outbound_link):
                continue

            if outbound_link in seen_links:
                continue

            title_text = str(item.get("title") or "").strip()
            if not title_text:
                continue

            snippet_text = str(item.get("snippet") or "").strip()

            rows.append(
                SearchResultItem(
                    title=title_text,
                    link=outbound_link,
                    snippet=snippet_text[:600],
                )
            )
            seen_links.add(outbound_link)

            if len(rows) >= limit:
                break

        return rows

    @staticmethod
    def _detect_google_block(page) -> Optional[str]:
        final_url = (page.url or "").lower()
        if "/sorry/" in final_url:
            return "google_automation_blocked"

        if "consent.google." in final_url:
            return "google_consent_interstitial"

        try:
            if page.locator("iframe[src*='recaptcha']").count() > 0:
                return "google_automation_blocked"
            if page.locator("input[name='captcha']").count() > 0:
                return "google_automation_blocked"
            if page.locator("form[action*='sorry']").count() > 0:
                return "google_automation_blocked"
        except Exception:
            pass

        try:
            body_text = page.inner_text("body").lower()
        except Exception:
            body_text = ""

        markers = [
            "unusual traffic",
            "detected unusual traffic",
            "i'm not a robot",
            "our systems have detected",
            "enable javascript",
            "before you continue",
        ]
        if any(marker in body_text for marker in markers):
            return "google_automation_blocked"

        return None

    @staticmethod
    def _collect_google_result_items(page, limit: int) -> List[Dict[str, str]]:
        return page.evaluate(
            """
            ({ limit }) => {
              const maxRows = Math.max(limit * 4, 40)
              const containers = Array.from(document.querySelectorAll('#search .MjjYud, #search .g'))
              const rows = []

              for (const container of containers) {
                const heading = container.querySelector('h3')
                if (!heading) continue

                const anchor = heading.closest('a') || container.querySelector('a[href]')
                if (!anchor) continue

                const href = anchor.getAttribute('href') || ''
                const title = (heading.textContent || '').trim()
                if (!title) continue

                const snippetNode = container.querySelector('.VwiC3b, .yXK7lf, .IsZvec, .MUxGbd')
                const snippet = snippetNode ? (snippetNode.textContent || '').trim() : ''

                rows.push({ title, link: href, snippet })
                if (rows.length >= maxRows) break
              }

              return rows
            }
            """,
            {"limit": int(limit)},
        )

    @staticmethod
    def _google_search_in_worker(
        normalized_query: str,
        target_limit: int,
    ) -> List[SearchResultItem]:
        search_url = (
            "https://www.google.com/search"
            f"?q={quote_plus(normalized_query)}"
            f"&num={target_limit}&hl=en&gl=us&pws=0"
        )

        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            context = browser.new_context(
                locale="en-US",
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/126.0.0.0 Safari/537.36"
                ),
            )

            def _route_handler(route):
                resource_type = route.request.resource_type
                if resource_type in {"image", "media", "font"}:
                    route.abort()
                    return
                route.continue_()

            context.route("**/*", _route_handler)
            page = context.new_page()

            try:
                page.goto(search_url, wait_until="domcontentloaded", timeout=12000)

                try:
                    page.wait_for_selector("#search", timeout=6000)
                except PlaywrightTimeoutError:
                    pass

                try:
                    page.wait_for_load_state("networkidle", timeout=4000)
                except PlaywrightTimeoutError:
                    logger.warning(
                        "Google search networkidle timeout query='%s'",
                        normalized_query,
                    )

                page.wait_for_timeout(1500)
                blocked_reason = SearchTrackingService._detect_google_block(page)
                if blocked_reason:
                    logger.warning(
                        "Google crawler blocked by anti-bot query='%s' final_url='%s'",
                        normalized_query,
                        page.url,
                    )
                    raise RuntimeError(blocked_reason)

                raw_items = SearchTrackingService._collect_google_result_items(
                    page=page,
                    limit=target_limit,
                )
                return SearchTrackingService._parse_google_results(
                    raw_items=raw_items,
                    limit=target_limit,
                )
            except PlaywrightTimeoutError:
                raise RuntimeError("google_search_timeout")
            finally:
                context.close()
                browser.close()

    @staticmethod
    def normalize_domain(target_url: str) -> str:
        parsed = urlparse(target_url.strip())
        host = parsed.netloc or parsed.path
        host = host.lower().strip()
        if host.startswith("www."):
            host = host[4:]
        return host

    @staticmethod
    def _google_search(query: str, limit: int = 10) -> List[SearchResultItem]:
        normalized_query = (query or "").strip()
        if not normalized_query:
            return []

        target_limit = max(1, min(limit, 10))
        timeout_seconds = SearchTrackingService._google_search_timeout_seconds()

        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(
                SearchTrackingService._google_search_in_worker,
                normalized_query,
                target_limit,
            )
            try:
                return future.result(timeout=timeout_seconds)
            except FutureTimeoutError:
                future.cancel()
                raise RuntimeError("google_search_timeout")

    @staticmethod
    def _bing_search(query: str, limit: int = 10) -> List[SearchResultItem]:
        api_key = os.getenv("BING_SEARCH_API_KEY", "")
        if not api_key:
            return []

        response = requests.get(
            "https://api.bing.microsoft.com/v7.0/search",
            headers={"Ocp-Apim-Subscription-Key": api_key},
            params={"q": query, "count": min(limit, 50), "mkt": "en-US"},
            timeout=25,
        )
        response.raise_for_status()
        data = response.json()
        web_pages = data.get("webPages", {}).get("value", [])
        items = []
        for item in web_pages:
            items.append(
                SearchResultItem(
                    title=item.get("name", ""),
                    link=item.get("url", ""),
                    snippet=item.get("snippet", ""),
                )
            )
        return items

    @staticmethod
    def _naver_search(query: str, limit: int = 10) -> List[SearchResultItem]:
        client_id = os.getenv("NAVER_CLIENT_ID", "")
        client_secret = os.getenv("NAVER_CLIENT_SECRET", "")
        if not client_id or not client_secret:
            return []

        response = requests.get(
            "https://openapi.naver.com/v1/search/webkr.json",
            headers={
                "X-Naver-Client-Id": client_id,
                "X-Naver-Client-Secret": client_secret,
            },
            params={"query": query, "display": min(limit, 100)},
            timeout=25,
        )
        response.raise_for_status()
        data = response.json()
        items = []
        for item in data.get("items", []) or []:
            items.append(
                SearchResultItem(
                    title=item.get("title", ""),
                    link=item.get("link", ""),
                    snippet=item.get("description", ""),
                )
            )
        return items

    @staticmethod
    def get_rank(results: List[SearchResultItem], target_domain: str) -> Optional[int]:
        if not target_domain:
            return None

        for index, result in enumerate(results, start=1):
            link_domain = SearchTrackingService.normalize_domain(result.link)
            if target_domain in link_domain or link_domain in target_domain:
                return index
        return None

    @staticmethod
    def run_search_rank(
        query: str, target_url: str, engines: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        target_domain = SearchTrackingService.normalize_domain(target_url)
        output: Dict[str, Dict[str, Any]] = {}

        if SEARCH_RANK_TEMP_DISABLED:
            logger.warning(
                "Search-rank request skipped: SEARCH_RANK_TEMP_DISABLED=true"
            )
            for engine in engines:
                key = engine.lower().strip()
                if not key:
                    continue
                output[key] = {
                    "status": "disabled",
                    "rank": None,
                    "result_count": 0,
                    "results": [],
                    "error": "temporarily_disabled",
                }
            return output

        logger.info(
            "Run search-rank query='%s' target_domain='%s' engines=%s",
            query,
            target_domain,
            [engine.lower().strip() for engine in engines],
        )

        for engine in engines:
            key = engine.lower().strip()
            try:
                results: List[SearchResultItem] = []
                if key == "google":
                    results = SearchTrackingService._google_search(query)
                elif key == "naver":
                    results = SearchTrackingService._naver_search(query)
                else:
                    output[key] = {
                        "status": "unsupported",
                        "rank": None,
                        "result_count": 0,
                        "results": [],
                    }
                    continue

                rank = SearchTrackingService.get_rank(results, target_domain)
                status = "ok" if results else "unavailable"
                output[key] = {
                    "status": status,
                    "rank": rank,
                    "result_count": len(results),
                    "results": [
                        {
                            "title": result.title,
                            "link": result.link,
                            "snippet": result.snippet,
                        }
                        for result in results[:10]
                    ],
                }

                if status == "unavailable":
                    logger.warning(
                        "Search-rank unavailable provider='%s' query='%s' target_domain='%s'",
                        key,
                        query,
                        target_domain,
                    )
            except Exception as e:
                safe_error = SearchTrackingService._safe_error_message(e)

                if key == "google" and safe_error in {
                    "google_search_timeout",
                    "google_automation_blocked",
                    "google_consent_interstitial",
                }:
                    logger.warning(
                        "Search-rank provider timeout/block treated as unavailable provider='%s' query='%s' target_domain='%s' reason='%s'",
                        key,
                        query,
                        target_domain,
                        safe_error,
                    )
                    output[key] = {
                        "status": "unavailable",
                        "rank": None,
                        "result_count": 0,
                        "results": [],
                        "error": safe_error,
                    }
                    continue

                logger.error(
                    "Search-rank provider error provider='%s' query='%s' target_domain='%s' error='%s'",
                    key,
                    query,
                    target_domain,
                    safe_error,
                )
                output[key] = {
                    "status": "error",
                    "rank": None,
                    "result_count": 0,
                    "results": [],
                    "error": safe_error,
                }

        return output
