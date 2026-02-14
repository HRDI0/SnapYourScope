import os
from dataclasses import dataclass
from typing import Dict, List, Optional
from urllib.parse import urlparse

import requests


@dataclass
class SearchResultItem:
    title: str
    link: str
    snippet: str


class SearchTrackingService:
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
    ) -> Dict[str, Dict]:
        target_domain = SearchTrackingService.normalize_domain(target_url)
        output: Dict[str, Dict] = {}

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
                output[key] = {
                    "status": "ok" if results else "unavailable",
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
            except Exception as e:
                output[key] = {
                    "status": "error",
                    "rank": None,
                    "result_count": 0,
                    "results": [],
                    "error": str(e),
                }

        return output
