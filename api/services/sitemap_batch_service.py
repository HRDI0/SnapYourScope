import asyncio
import json
import xml.etree.ElementTree as ET
from typing import List, Optional, Tuple
from urllib.parse import urljoin, urlparse, urlunparse

import aiohttp
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import database, models
from ..logger import setup_logger
from .analysis_service import AnalysisService

logger = setup_logger("api.services.sitemap_batch")


class SitemapBatchService:
    def __init__(self):
        self.queue: asyncio.Queue[Optional[int]] = asyncio.Queue(maxsize=10000)
        self.workers: List[asyncio.Task] = []
        self.started = False

    async def start_workers(self, worker_count: int = 2):
        if self.started:
            return
        self.started = True
        for _ in range(worker_count):
            self.workers.append(asyncio.create_task(self._worker_loop()))
        logger.info(f"Started sitemap batch workers: {worker_count}")

    async def stop_workers(self):
        if not self.started:
            return

        for _ in self.workers:
            await self.queue.put(None)

        await asyncio.gather(*self.workers, return_exceptions=True)
        self.workers.clear()
        self.started = False
        logger.info("Stopped sitemap batch workers")

    async def create_batch_job(
        self,
        db: Session,
        user: models.User,
        sitemap_url: str,
        max_urls: int,
        include_aeo: bool,
    ) -> models.SitemapBatchJob:
        urls = await self.parse_sitemap_urls(sitemap_url=sitemap_url, max_urls=max_urls)
        if not urls:
            raise ValueError("No URLs found in sitemap")

        job = models.SitemapBatchJob(
            user_id=user.id,
            sitemap_url=sitemap_url,
            include_aeo=include_aeo,
            status="queued",
            total_urls=len(urls),
            queued_urls=len(urls),
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        items: List[models.SitemapBatchItem] = []
        for target_url in urls:
            items.append(
                models.SitemapBatchItem(
                    job_id=job.id,
                    user_id=user.id,
                    target_url=target_url,
                    status="queued",
                )
            )

        db.add_all(items)
        db.commit()

        for item in items:
            await self.queue.put(item.id)

        return job

    async def parse_sitemap_urls(self, sitemap_url: str, max_urls: int) -> List[str]:
        parsed = urlparse(sitemap_url)
        if not parsed.scheme:
            sitemap_url = f"https://{sitemap_url}"
            parsed = urlparse(sitemap_url)

        sitemap_sources = [sitemap_url]
        if not parsed.path.endswith(".xml"):
            discovered = await self._discover_from_robots(parsed)
            if discovered:
                sitemap_sources = discovered
            else:
                sitemap_sources = [
                    urljoin(f"{parsed.scheme}://{parsed.netloc}", "/sitemap.xml")
                ]

        timeout = aiohttp.ClientTimeout(total=30)
        urls: List[str] = []
        seen_urls = set()
        pending: List[Tuple[str, int]] = [(source, 0) for source in sitemap_sources]
        seen_sitemaps = set()

        async with aiohttp.ClientSession(timeout=timeout) as session:
            while pending and len(urls) < max_urls:
                current_sitemap, depth = pending.pop(0)
                if current_sitemap in seen_sitemaps or depth > 4:
                    continue

                seen_sitemaps.add(current_sitemap)
                text = await self._fetch_text(session, current_sitemap)
                if not text:
                    continue

                page_urls, child_sitemaps = self._parse_sitemap_xml(text)

                for page_url in page_urls:
                    normalized = self._normalize_url(page_url)
                    if normalized and normalized not in seen_urls:
                        seen_urls.add(normalized)
                        urls.append(normalized)
                        if len(urls) >= max_urls:
                            break

                if depth < 4:
                    for child_sitemap in child_sitemaps:
                        if child_sitemap not in seen_sitemaps:
                            pending.append((child_sitemap, depth + 1))

        return urls

    async def _discover_from_robots(self, parsed_url) -> List[str]:
        robots_url = urljoin(
            f"{parsed_url.scheme}://{parsed_url.netloc}", "/robots.txt"
        )
        timeout = aiohttp.ClientTimeout(total=20)

        async with aiohttp.ClientSession(timeout=timeout) as session:
            text = await self._fetch_text(session, robots_url)
            if not text:
                return []

        sitemap_urls: List[str] = []
        for line in text.splitlines():
            stripped = line.strip()
            if stripped.lower().startswith("sitemap:"):
                sitemap_candidate = stripped.split(":", 1)[1].strip()
                if sitemap_candidate:
                    sitemap_urls.append(sitemap_candidate)
        return sitemap_urls

    async def _fetch_text(self, session: aiohttp.ClientSession, url: str) -> str:
        try:
            async with session.get(url, allow_redirects=True) as response:
                if response.status >= 400:
                    return ""
                return await response.text()
        except Exception:
            return ""

    def _parse_sitemap_xml(self, xml_text: str) -> Tuple[List[str], List[str]]:
        try:
            root = ET.fromstring(xml_text)
        except ET.ParseError:
            return [], []

        def local_name(tag: str) -> str:
            return tag.split("}", 1)[1] if "}" in tag else tag

        root_name = local_name(root.tag)
        page_urls: List[str] = []
        child_sitemaps: List[str] = []

        if root_name == "urlset":
            for url_node in root:
                if local_name(url_node.tag) != "url":
                    continue
                for child in url_node:
                    if local_name(child.tag) == "loc" and child.text:
                        page_urls.append(child.text.strip())

        if root_name == "sitemapindex":
            for sitemap_node in root:
                if local_name(sitemap_node.tag) != "sitemap":
                    continue
                for child in sitemap_node:
                    if local_name(child.tag) == "loc" and child.text:
                        child_sitemaps.append(child.text.strip())

        return page_urls, child_sitemaps

    def _normalize_url(self, url: str) -> str:
        parsed = urlparse(url.strip())
        if not parsed.scheme:
            return ""

        cleaned_path = parsed.path.rstrip("/")
        return urlunparse(
            (
                parsed.scheme.lower(),
                parsed.netloc.lower(),
                cleaned_path,
                "",
                parsed.query,
                "",
            )
        )

    async def _worker_loop(self):
        while True:
            item_id = await self.queue.get()
            if item_id is None:
                self.queue.task_done()
                break

            db = database.SessionLocal()
            try:
                item = (
                    db.query(models.SitemapBatchItem)
                    .filter(models.SitemapBatchItem.id == item_id)
                    .first()
                )
                if not item:
                    self.queue.task_done()
                    continue

                job = (
                    db.query(models.SitemapBatchJob)
                    .filter(models.SitemapBatchJob.id == item.job_id)
                    .first()
                )
                if not job:
                    self.queue.task_done()
                    continue

                if item.status in {"completed", "failed"}:
                    self.queue.task_done()
                    continue

                item.status = "processing"
                item.attempts = (item.attempts or 0) + 1
                if job.status == "queued":
                    job.status = "processing"
                db.commit()

                try:
                    result = await AnalysisService.analyze_url(
                        url=item.target_url,
                        include_aeo=bool(job.include_aeo),
                        include_pagespeed=False,
                    )
                    item.status = "completed"
                    item.error_message = None
                    item.report_json = json.dumps(result, default=str)
                except Exception as e:
                    item.status = "failed"
                    item.error_message = str(e)

                status_counts = dict(
                    db.query(
                        models.SitemapBatchItem.status,
                        func.count(models.SitemapBatchItem.id),
                    )
                    .filter(models.SitemapBatchItem.job_id == job.id)
                    .group_by(models.SitemapBatchItem.status)
                    .all()
                )

                completed = int(status_counts.get("completed", 0))
                failed = int(status_counts.get("failed", 0))
                queued = int(status_counts.get("queued", 0))

                job.completed_urls = completed
                job.failed_urls = failed
                job.queued_urls = queued

                if completed + failed >= job.total_urls:
                    job.status = "completed" if failed == 0 else "failed"
                else:
                    job.status = "processing"

                db.commit()
            except Exception as e:
                logger.error(f"Batch worker failed for item_id={item_id}: {e}")
            finally:
                db.close()
                self.queue.task_done()


sitemap_batch_service = SitemapBatchService()
