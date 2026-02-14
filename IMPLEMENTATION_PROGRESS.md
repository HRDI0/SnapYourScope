# Implementation Progress

Last updated: 2026-02-13

## ULW planning update (SEMrush benchmark, implementation gated)
- Scope for this round: **planning + audit + documentation update only** (no large UI refactor implementation yet).
- External research completed:
  - SEMrush dashboard composition (official docs + public walkthrough sources)
  - High-usage, low-cost SEO/AEO feature set extraction
- Internal audit completed:
  - 5-page IA fragmentation review (`index/app/keyword-rank/prompt-tracker/aeo-optimizer`)
  - Pricing/limit logic inventory across frontend/backend/docs

### Key planning conclusions
1. Keep 5-page structure, but unify shell/navigation/metrics language.
2. Prioritize low-cost high-frequency modules: rank tracking, technical audit, on-page suggestions, competitor comparison.
3. Centralize pricing/limits/gating as a single policy source.
4. Apply staged refactor plan (R1~R4) before adding more features.

### Requested pricing policy change (next implementation target)
- Prompt tracking included volume: **30 prompts**
- Add-on pricing: **+$10/month per extra 5 prompts**

Note:
- Current code still contains older prompt pricing values in some frontend/backend/doc sections.
- These will be aligned in the next implementation pass after plan approval.

## Current objective
- Implement low-cost feasible tracking features first.
- Add paid modules behind existing tier model (`pro`/`enterprise`).
- Keep architecture extensible for provider fallback and future data sources.

## Implemented now

### Product naming and docs
- Service name aligned to **SnapYourScope**.
- Added GitHub-ready root documentation in `README.md`.
- Maintained developer-facing report document in `DEVELOPMENT_REPORT.md`.

### OAuth/API credential strategy foundation
- Added provider capability service: `api/services/provider_service.py`.
- Added API endpoint for runtime capability check: `GET /api/provider/capabilities` (`api/routes/provider_capabilities.py`).
- Implemented GPT/Gemini fallback-aware LLM call layer: `api/services/llm_service.py`.
- Current strategy supports:
  - GPT: OpenAI API key or Azure OpenAI credentials (API key/token)
  - Gemini: Gemini API key mode
  - Perplexity: API key mode (optional)
- Consumer subscription OAuth replacement is documented as unsupported; backend uses official programmatic credentials only.

### Prompt tracking + search rank tracking
- Added free search ranking service (Google/Bing/Naver API-key mode): `api/services/search_tracking_service.py`.
- Added prompt tracking service with share-of-model tiers:
  - `not_mentioned`
  - `mentioned`
  - `mentioned_and_linked`
  - `core_mentioned`
  (`api/services/prompt_tracking_service.py`)
- Added API routes (`api/routes/prompt_tracking.py`):
  - `POST /api/search-rank` (free)
  - `POST /api/prompt-track` (paid: `pro`/`enterprise`)
- Added persistence tables for paid run history in `api/models.py`:
  - `PromptTrackRun`
  - `UserAuthProvider`

### AEO optimization recommendation (paid)
- Added recommendation engine: `api/services/aeo_optimizer_service.py`.
- Added paid endpoint: `POST /api/aeo-optimizer/recommend` (`api/routes/aeo_optimizer.py`).
- Recommendation output is grounded in current URL audit signals + GEO/AEO optimization heuristics.
- Added persistence table: `AeoRecommendationRun` in `api/models.py`.

### API wiring updates
- Registered new routers in `api/main.py`:
  - Providers
  - Prompt Tracking
  - AEO Optimizer

### Frontend redesign (full visual refresh)
- Moved product dashboard app to `frontend/app.html`.
- Reworked app layout into analytics-style structure:
  - left navigation rail
  - workspace top header
  - refined hero input module
  - preserved all existing JS-bound IDs and flows
- Rebuilt design system in `frontend/style.css`:
  - new color tokens and card hierarchy
  - dashboard density + hover polish
  - responsive behavior for desktop/tablet/mobile
  - auth/pricing/enterprise sections styled consistently

### Frontend dashboard (single screen)
- Upgraded result rendering in `frontend/src/main.js` from plain text lists to a dashboard layout.
- Added chart-based visualization using existing dependency `chart.js`:
  - SEO score doughnut chart
  - GEO regional latency bar chart
  - Status mix doughnut chart (pass/warn/fail/info)
- Added KPI cards and issue panel using already available API fields:
  - SEO checks pass ratio
  - AEO checks pass ratio
  - Global reach ratio
  - Average latency
  - Content snapshot (word count, missing alt, currency/phone signals)
- Kept current flow intact: URL input -> Analyze button -> same `/api/analyze` endpoint.

### Multi-page structure + feature pages
- Added marketing landing page: `frontend/index.html` + `frontend/src/landing.css`.
- Added prompt-tracking page: `frontend/prompt-tracker.html` + `frontend/src/prompt-tracker.js`.
- Added AEO optimizer page: `frontend/aeo-optimizer.html` + `frontend/src/aeo-optimizer.js`.
- Added shared tool page styles: `frontend/src/tools.css`.
- Added free rank-tracker panel to app dashboard (`frontend/app.html`, `frontend/src/main.js`).

### Localization support
- Added language selector support in app (EN/KO/JA/ZH).
- Localized static UI strings and key runtime messages in `frontend/src/main.js`.

### Build system update
- Updated Vite multi-page build inputs in `frontend/vite.config.js`:
  - `index.html`
  - `app.html`
  - `keyword-rank.html`
  - `prompt-tracker.html`
  - `aeo-optimizer.html`

### Keyword rank page split + free/paid policy
- Added dedicated page: `frontend/keyword-rank.html` + `frontend/src/keyword-rank.js`.
- Removed rank tracking panel from app dashboard (`frontend/app.html`, `frontend/src/main.js`).
- Added backend multi-query support in `api/routes/prompt_tracking.py` (`POST /api/search-rank`):
  - Free: single keyword
  - Paid (`pro`/`enterprise`): multi-keyword batch
  - Added `tracking_mode: daily` metadata

### Paid feature disable + sample outputs (free tier UX)
- App sitemap batch button now disables for free tier and shows fixed sample output.
- Prompt tracker page disables paid execution on free tier and renders fixed sample output.
- AEO optimizer page disables paid execution on free tier and renders fixed sample output.

### Prompt tracking limits and add-on policy
- Updated `POST /api/prompt-track` in `api/routes/prompt_tracking.py`:
  - Accepts multi-query input (`query` + `queries`)
  - Pricing meta included:
    - included prompts: 30
    - add-on: +$10 per extra 5 prompts
  - Added `tracking_mode: weekly` metadata

### Competitor comparison limits in dashboard flow
- Added competitor URL input in app dashboard (`frontend/app.html`, `frontend/src/main.js`).
- Enforced UI limits:
  - free: 1 competitor
  - paid: 5 included, extra add-on estimate
  - pro cap: 10, then enterprise guidance
- Added competitor comparison section to rendered dashboard report.

### Navigation and layout consistency updates
- Added left rail links in app for:
  - Keyword Rank
  - Prompt Tracker
  - AEO Optimizer
- Added top-right compact GNB links in app header.
- Added keyword-rank navigation links to landing / prompt / optimizer pages.
- Updated enterprise plan behavior:
  - In app pricing, enterprise opens inquiry tab.
  - In landing plans, enterprise redirects to `/app.html?tab=enterprise`.

### Billing scope adjustment (ULW directive)
- Kept Stripe billing path only in `api/routes/billing.py`.
- Removed frontend provider selection path from `frontend/app.html` and `frontend/src/main.js`.
- Lemon Squeezy path is paused and removed from active code flow.

### Refactor step after section 10 approval
- Added shared frontend modules for reducing logic duplication:
  - `frontend/src/core/session.js`
  - `frontend/src/core/policy.js`
- Updated tool pages to consume shared session/policy logic:
  - `frontend/src/prompt-tracker.js`
  - `frontend/src/keyword-rank.js`
  - `frontend/src/aeo-optimizer.js`

### Tool shell unification (dashboard-style continuity)
- Refactored tool pages to shared shell layout with left rail + top context:
  - `frontend/keyword-rank.html`
  - `frontend/prompt-tracker.html`
  - `frontend/aeo-optimizer.html`
- Rebuilt `frontend/src/tools.css` to align visual tokens and panel rhythm with app dashboard styling.
- Added page-level active nav states for consistent cross-page orientation.

### Repository hygiene
- Updated `.gitignore` with missing runtime/tooling artifacts:
  - `.coverage.*`, `.ruff_cache/`, `.mypy_cache/`
  - `*.db-wal`, `*.db-shm`
  - `frontend/.vite/`

### Verification
- Python syntax verification passed: `venv/Scripts/python.exe -m compileall api *.py`.
- Frontend production build passed: `frontend` -> `npm run build` (exit code 0).

## Existing implemented capabilities retained
- Guest single URL analysis remains available without login.
- Post-analysis upgrade CTA remains available.
- Paid sitemap backend endpoints remain available:
  - `POST /api/analyze/sitemap-batch`
  - `GET /api/analyze/sitemap-batch/{job_id}`

## Deferred to future development
- Full sitemap analysis frontend wiring to batch endpoints.
- Google AI Overviews first-party direct API integration (official direct endpoint currently unavailable).
- Vertex/GCP OAuth token acquisition automation for Gemini (current build focuses on API-key practical path).
- Bing lower-cost strategy optimization (official options remain relatively expensive).
- Rich prompt-tracking analytics UI (trend charts/history drill-down/alerts).
- Advanced report automation (scheduled exports and mail delivery workflow).
- Toss/PortOne direct subscription adapter implementation after business onboarding completion.
- Full SEMrush-inspired shell/IA refactor execution (in progress after section 10 approval).
- Alternative payment provider re-introduction (currently paused by user directive).
