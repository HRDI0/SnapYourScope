import os
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import requests

from ..logger import setup_logger


logger = setup_logger("api.services.search_tracking")


@dataclass
class SearchResultItem:
    title: str
    link: str
    snippet: str


class SearchTrackingService:
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

        return error.__class__.__name__.lower()

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
        api_key = os.getenv("GOOGLE_SEARCH_API_KEY", "")
        cx = os.getenv("GOOGLE_SEARCH_CX", "")
        if not api_key or not cx:
            logger.warning(
                "Google search skipped: missing GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_CX"
            )
            return []

        response = requests.get(
            "https://www.googleapis.com/customsearch/v1",
            params={"q": query, "key": api_key, "cx": cx, "num": min(limit, 10)},
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
                    snippet=item.get("snippet", ""),
                )
            )
        return items

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
                elif key == "bing":
                    results = SearchTrackingService._bing_search(query)
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
