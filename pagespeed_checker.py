import aiohttp
import asyncio
from api_manager import ApiManager

class PageSpeedChecker:
    def __init__(self, api_manager: ApiManager):
        self.api_manager = api_manager
        self.base_url = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"

    async def analyze(self, target_url, strategy="mobile"):
        """Fetch Core Web Vitals from PageSpeed Insights API."""
        key = self.api_manager.get_pagespeed_key()
        if not key:
            return "⚠️ PageSpeed API Key missing. Skipping Performance Check."

        params = {
            "url": target_url,
            "strategy": strategy,
            "key": key,
            "category": ["performance", "seo"]
        }

        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(self.base_url, params=params, timeout=30) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return self._parse_results(data)
                    elif resp.status == 429: # Quota Exceeded
                        print("🚫 Quota Exceeded. Rotating Key...")
                        if self.api_manager.rotate_pagespeed_key():
                            return await self.analyze(target_url, strategy) # Retry with new key
                        else:
                            return "❌ All PageSpeed Keys exhausted."
                    else:
                        error_text = await resp.text()
                        return f"❌ PageSpeed API Error: {resp.status} - {error_text[:100]}"
            except asyncio.TimeoutError:
                return "❌ PageSpeed API Analysis Timed Out."
            except Exception as e:
                return f"❌ Error during PageSpeed Analysis: {e}"

    def _parse_results(self, data):
        """Extract key metrics from the JSON response."""
        try:
            lighthouse = data.get("lighthouseResult", {})
            categories = lighthouse.get("categories", {})
            audits = lighthouse.get("audits", {})

            # Scores (0-1) -> Convert to 0-100
            perf_score = int(categories.get("performance", {}).get("score", 0) * 100)
            seo_score = int(categories.get("seo", {}).get("score", 0) * 100)

            # Core Web Vitals
            lcp = audits.get("largest-contentful-paint", {}).get("displayValue", "N/A")
            cls = audits.get("cumulative-layout-shift", {}).get("displayValue", "N/A")
            inp = audits.get("interaction-to-next-paint", {}).get("displayValue", "N/A")

            return {
                "performance_score": perf_score,
                "seo_score": seo_score,
                "metrics": {
                    "LCP": lcp,
                    "CLS": cls,
                    "INP": inp
                }
            }
        except Exception as e:
            return {"error": f"Error parsing results: {e}"}
