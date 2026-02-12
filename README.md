# SnapYourScope

Lightweight URL-based site SEO/AEO analysis service.

SnapYourScope is a fast web analyzer that checks a single URL and returns SEO, GEO, and AEO signals in one dashboard.

## Key Features

- Single URL analysis with rendered HTML (Playwright-based fetch)
- SEO checks: title, description, canonical, robots, viewport, Open Graph, schema, hreflang, headings, images, content length
- AEO checks: answer-first structure, content structure, AI-friendly schema, readability, E-E-A-T signals
- GEO snapshot: per-region availability and latency summary (US/KR/JP/UK)
- Dashboard UI with charts (SEO score, latency chart, status mix)
- Auth flow (register/login/JWT), guest-mode single analysis, paid-tier sitemap batch endpoints

## Tech Stack

- Backend: FastAPI, SQLAlchemy, aiohttp, Playwright, BeautifulSoup
- Frontend: Vite, Vanilla JS, Chart.js
- DB: SQLite (local)

## Project Structure

```text
.
|- api/                        # FastAPI app, routes, services, auth, DB models
|- frontend/                   # Vite frontend app
|- seo_verifier.py             # SEO analyzer
|- aeo_verifier.py             # AEO analyzer
|- pagespeed_checker.py        # Optional PageSpeed analysis
|- api_manager.py              # API key rotation helpers
|- run_backend.py              # Backend launcher
|- run_dev.bat                 # Start backend + frontend (Windows)
`- seo_analysis.db             # Local SQLite DB (runtime)
```

## Quick Start (Windows)

### 1) Install backend dependencies

```bash
venv\Scripts\pip.exe install -r requirements.txt
```

If `venv/` does not exist yet:

```bash
python -m venv venv
venv\Scripts\pip.exe install -r requirements.txt
```

### 2) Install frontend dependencies

```bash
cd frontend
npm install
```

### 3) Install Playwright browser

```bash
venv\Scripts\playwright.exe install chromium
```

### 4) Run app

Option A (recommended, launches both):

```bash
run_dev.bat
```

Option B (manual):

```bash
venv\Scripts\python.exe run_backend.py
```

and in another terminal:

```bash
cd frontend
npm run dev
```

### 5) Open

- Frontend: `http://localhost:5173`
- API docs: `http://127.0.0.1:8000/docs`

## Environment Variables

Create `.env` in project root if needed.

| Variable | Required | Description |
|---|---|---|
| `PAGESPEED_KEYS` | No | Comma-separated Google PageSpeed API keys |
| `RICH_RESULTS_KEYS` | No | Comma-separated rich-results related keys |
| `PROXY_LIST` | No | Comma-separated proxies for outbound requests |
| `GOOGLE_API_KEY` | No | Optional Gemini/LLM integration key used by helper scripts |

## API Overview

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/register` | Register user |
| `POST` | `/api/token` | Login and get JWT |
| `POST` | `/api/analyze` | Single URL SEO/GEO/AEO analysis |
| `POST` | `/api/analyze/sitemap-batch` | Create sitemap batch job (paid tier) |
| `GET` | `/api/analyze/sitemap-batch/{job_id}` | Check sitemap batch status |
| `GET` | `/health` | Health check |

## Validation Commands

```bash
venv\Scripts\python.exe api_check.py
venv\Scripts\python.exe verify_all_fixes.py
```

Frontend build verification:

```bash
cd frontend
npm run build
```

## Notes

- Guest users can run one single URL analysis in current frontend flow.
- Full sitemap analysis is gated for paid-tier users (`pro`/`enterprise`).
- Current auth module uses a development `SECRET_KEY` constant in `api/auth.py`; replace it before production deployment.

## Roadmap (High-Level)

- Frontend wiring for sitemap batch lifecycle
- Deeper reporting and automation workflows
- Production hardening (secret management, deployment, monitoring)
