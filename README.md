# SnapYourScope

Lightweight URL-based site SEO/AEO analysis service.

SnapYourScope is a fast web analyzer that checks a single URL and returns SEO, GEO, and AEO signals in one dashboard.

## Key Features

- Single URL analysis with rendered HTML (Playwright-based fetch)
- SEO checks: title, description, canonical, robots, viewport, Open Graph, schema, hreflang, headings, images, content length
- AEO checks: answer-first structure, content structure, AI-friendly schema, readability, E-E-A-T signals
- GEO snapshot: per-region availability and latency summary (US/KR/JP/UK)
- 5-page app structure: main, dashboard, keyword rank, prompt tracker, AEO optimizer
- Unified dashboard-style shell across keyword rank / prompt tracker / AEO optimizer pages
- Dashboard UI with charts (SEO score, latency chart, status mix) and competitor comparison
- Auth flow (register/login/JWT), guest-mode single analysis, paid-tier sitemap batch endpoints
- Prompt tracking policy: 30 prompts included, +$10/month per extra 5 prompts

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

## Planning Documents

- `deliverables/DEVELOPMENT_REPORT.md`: current architecture, scope, status report
- `deliverables/IMPLEMENTATION_PROGRESS.md`: chronological implementation log
- `deliverables/DEVELOPMENT_PLAN.md`: detailed integrated plan derived from deep research
- `deliverables/design_implementation_progress.md`: SEO+AEO(GEO) integrated, step-by-step hybrid design modernization plan
- `deliverables/deep-research-report.md`: original deep research source document

## Supporting Operational Documents

- `deliverables/PHASE0_BASELINE.md`
- `deliverables/DB_MIGRATION_REHEARSAL.md`
- `deliverables/PHASE3_DEPLOYMENT_CHECKLIST.md`
- `deliverables/BILLING_RUNBOOK.md`
- `deliverables/WEBHOOK_TEST_CHECKLIST.md`
- `deliverables/AI_OPERATIONS_GUIDE.md`
- `deliverables/ACCOUNT_HANDOFF_GUIDE.md`
- `deliverables/GO_LIVE_CHECKLIST.md`

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

Copy `.env.example` to `.env` and fill values.

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET_KEY` | Yes (prod) | JWT signing secret key |
| `JWT_ALGORITHM` | No | JWT algorithm (default: `HS256`) |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | No | Access token expiry in minutes (default: `30`) |
| `DATABASE_URL` | No | Database URL (default: `sqlite:///./seo_analysis.db`) |
| `CORS_ORIGINS` | No | Comma-separated frontend origins |
| `STORAGE_BACKEND` | No | Blob storage backend (`local` or `r2`) |
| `STORAGE_LOCAL_DIR` | No | Local directory for blob payloads |
| `STORAGE_PUBLIC_BASE_URL` | No | Optional public base URL for blob references |
| `R2_ACCOUNT_ID` | R2 only | Cloudflare R2 account id |
| `R2_ACCESS_KEY_ID` | R2 only | Cloudflare R2 access key id |
| `R2_SECRET_ACCESS_KEY` | R2 only | Cloudflare R2 secret access key |
| `R2_BUCKET_NAME` | R2 only | Cloudflare R2 bucket name |
| `R2_ENDPOINT` | R2 only | Cloudflare R2 S3-compatible endpoint |
| `SUPABASE_URL` | Optional scaffold | Supabase project URL (storage scaffold) |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional scaffold | Supabase service role key |
| `SUPABASE_BUCKET_NAME` | Optional scaffold | Supabase storage bucket name |
| `STRIPE_SECRET_KEY` | Billing only | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Billing only | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Billing only | Stripe webhook signing secret |
| `STRIPE_PRICE_PRO_MONTHLY` | Billing only | Stripe price id for Pro |
| `STRIPE_PRICE_ENTERPRISE_MONTHLY` | Billing only | Stripe price id for Enterprise |
| `APP_BASE_URL` | Billing only | App base URL used in checkout callbacks |
| `FRONTEND_APP_URL` | OAuth redirect | Frontend app URL for Google OAuth callback handoff |
| `PAGESPEED_KEYS` | No | Comma-separated Google PageSpeed API keys |
| `RICH_RESULTS_KEYS` | No | Comma-separated rich-results related keys |
| `PROXY_LIST` | No | Comma-separated proxies for outbound requests |
| `GOOGLE_API_KEY` | No | Optional Gemini/LLM integration key used by helper scripts |
| `GOOGLE_OAUTH_CLIENT_ID` | OAuth optional | Google OAuth client id |
| `GOOGLE_OAUTH_CLIENT_SECRET` | OAuth optional | Google OAuth client secret |
| `GOOGLE_OAUTH_REDIRECT_URI` | OAuth optional | Google OAuth callback URI |
| `ADMIN_SEED_ENABLED` | Optional | Enable startup admin seed flow |
| `ADMIN_SEED_EMAIL` | Optional | Seed admin email |
| `ADMIN_SEED_PASSWORD` | Optional | Seed admin password |
| `EST_COST_USD_PER_1K_CHARS_GPT` | No | Estimated GPT cost rate (USD per 1k chars) |
| `EST_COST_USD_PER_1K_CHARS_GEMINI` | No | Estimated Gemini cost rate (USD per 1k chars) |
| `EST_COST_USD_PER_1K_CHARS_PERPLEXITY` | No | Estimated Perplexity cost rate (USD per 1k chars) |

## API Overview

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/register` | Register user |
| `POST` | `/api/token` | Login and get JWT |
| `POST` | `/api/analyze` | Single URL SEO/GEO/AEO analysis |
| `POST` | `/api/analyze/sitemap-batch` | Create sitemap batch job (paid tier) |
| `GET` | `/api/analyze/sitemap-batch/{job_id}` | Check sitemap batch status |
| `POST` | `/api/search-rank` | Search rank tracking (single free, batch paid) |
| `POST` | `/api/prompt-track` | Prompt visibility tracking (paid) |
| `POST` | `/api/aeo-optimizer/recommend` | AEO optimization recommendations (paid) |
| `POST` | `/api/billing/create-checkout-session` | Create Stripe checkout session |
| `POST` | `/api/billing/create-portal-session` | Create Stripe billing portal session |
| `POST` | `/api/billing/webhook` | Stripe webhook endpoint |
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

Storage connection probe:

```bash
venv\Scripts\python.exe scripts\storage_connection_check.py
```

Account handoff readiness (no external calls):

```bash
venv\Scripts\python.exe scripts\account_handoff_readiness.py
```

Staging readiness preflight (no external calls):

```bash
venv\Scripts\python.exe scripts\staging_readiness_check.py
```

Seed enterprise admin account:

```bash
venv\Scripts\python.exe scripts\seed_admin_account.py
```

Primer scenario local verification (admin login + core paid flows):

```bash
venv\Scripts\python.exe scripts\primer_admin_local_verify.py
```

## Notes

- Guest users can run one single URL analysis in current frontend flow.
- Full sitemap analysis is gated for paid-tier users (`pro`/`enterprise`).
- Billing flow is currently Stripe-only.
- Core auth/database/cors settings are now env-driven via `api/config.py`.
- Analysis payload persistence is blob-first with DB metadata summaries.
- Stripe webhook idempotency is persisted by event id.
- Prompt tracking exposes AI ops metadata (`error_type`, latency summary, cost estimate).

## Roadmap (High-Level)

- Frontend wiring for sitemap batch lifecycle
- Deeper reporting and automation workflows
- Production hardening (secret management, deployment, monitoring)
