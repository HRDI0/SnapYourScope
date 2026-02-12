import asyncio
import time
import aiohttp
from playwright.sync_api import sync_playwright
from ..logger import setup_logger

# Fix: Import from root directory (sys.path includes root)
from seo_verifier import SeoVerifier
from aeo_verifier import AeoVerifier

logger = setup_logger("api.services.analysis")


class AnalysisService:
    @staticmethod
    def fetch_url_sync(url: str):
        logger.debug(f"Starting browser to fetch: {url}")
        try:
            with sync_playwright() as p:
                logger.debug("Launching Chromium...")
                browser = p.chromium.launch(headless=True)
                context = browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                    viewport={"width": 1920, "height": 1080},
                    locale="ko-KR",
                )
                page = context.new_page()
                try:
                    logger.debug(f"Navigating to {url}...")
                    page.goto(url, timeout=30000, wait_until="domcontentloaded")
                    page.wait_for_timeout(2000)  # Wait for JS
                    content = page.content()
                    logger.debug("Content fetched successfully.")
                    return content
                except Exception as inner_e:
                    logger.error(f"Error inside Playwright context: {inner_e}")
                    raise inner_e
                finally:
                    browser.close()
                    logger.debug("Browser closed.")
        except Exception as e:
            logger.error(f"Playwright error: {e}")
            raise e

    @staticmethod
    async def build_geo_snapshot(url: str):
        status_code = 0
        load_time_ms = 0

        try:
            timeout = aiohttp.ClientTimeout(total=15)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                started = time.perf_counter()
                async with session.get(url, allow_redirects=True) as response:
                    status_code = response.status
                    load_time_ms = int((time.perf_counter() - started) * 1000)
        except Exception:
            status_code = 0
            load_time_ms = 0

        return {
            "US": {"status": status_code, "load_time_ms": load_time_ms},
            "KR": {"status": status_code, "load_time_ms": load_time_ms},
            "JP": {"status": status_code, "load_time_ms": load_time_ms},
            "UK": {"status": status_code, "load_time_ms": load_time_ms},
        }

    @staticmethod
    async def analyze_url(
        url: str, include_aeo: bool = False, include_pagespeed: bool = False
    ):
        try:
            # 1. Fetch Content
            html_content = await asyncio.to_thread(AnalysisService.fetch_url_sync, url)

            # 2. SEO Analysis
            logger.info("Starting SEO Analysis...")
            seo = SeoVerifier(html_content, url)
            seo_results = await seo.analyze()
            logger.info("SEO Analysis complete.")

            # 3. AEO Analysis
            aeo_results = None
            if include_aeo:
                logger.info("Starting AEO Analysis...")
                aeo = AeoVerifier(html_content)
                aeo_results = aeo.analyze()
                logger.info("AEO Analysis complete.")

            geo_results = await AnalysisService.build_geo_snapshot(url)

            # 4. PageSpeed Analysis
            pagespeed_results = None
            if include_pagespeed:
                logger.info("Starting PageSpeed Analysis...")
                # Dynamic import to avoid circular dep if any
                from pagespeed_checker import PageSpeedChecker
                from api_manager import ApiManager

                api_manager = ApiManager()
                ps_checker = PageSpeedChecker(api_manager)

                pagespeed_results = await ps_checker.analyze(url)
                logger.info("PageSpeed Analysis complete.")

            return {
                "seo_result": seo_results,
                "aeo_result": aeo_results,
                "pagespeed_result": pagespeed_results,
                "geo_result": geo_results,
            }

        except Exception as e:
            import traceback

            error_msg = traceback.format_exc()
            logger.error(f"Analysis Service failed: {error_msg}")
            raise e
