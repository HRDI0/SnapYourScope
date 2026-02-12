from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from .. import database, models, auth
from ..logger import setup_logger
from pydantic import BaseModel
import asyncio
from playwright.sync_api import sync_playwright

router = APIRouter()
logger = setup_logger("api.routes.site_audit")


class SiteAuditRequest(BaseModel):
    url: str


@router.post("/site-audit", response_model=dict)
async def run_site_audit(
    request: SiteAuditRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    logger.info(f"Starting Site Audit for {request.url} by user_id={current_user.id}")

    def crawl_site(start_url: str):
        results = {
            "url": start_url,
            "status_code": 0,
            "title": "",
            "internal_links": [],
            "broken_links": [],
            "resources": [],
        }

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                try:
                    response = page.goto(
                        start_url, timeout=30000, wait_until="domcontentloaded"
                    )
                    results["status_code"] = getattr(response, "status", 0)
                    results["title"] = page.title()

                    # Get all links
                    links = page.eval_on_selector_all(
                        "a", "elements => elements.map(e => e.href)"
                    )
                    # Filter internal vs external (simple logic)
                    domain = start_url.split("//")[1].split("/")[0]

                    for link in set(links):  # Dedup
                        if domain in link:
                            results["internal_links"].append(link)

                    # Check for broken resources (simple check)
                    # In a real full crawler, we'd visit them. Here we just list count.

                except Exception as e:
                    logger.error(f"Audit crawl failed: {e}")
                    raise e
                finally:
                    browser.close()
        except Exception as e:
            logger.error(f"Playwright error in Audit: {e}")
            raise e

        return results

    try:
        audit_data = await asyncio.to_thread(crawl_site, request.url)
        return {"status": "success", "data": audit_data}
    except Exception as e:
        logger.error(f"Site Audit failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
