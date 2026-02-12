# AGENTS.md
Agent guidance for `web_page_seo_geo_analysis_site`.
Use this as the default execution playbook for coding agents in this repository.

## Repository Overview
- Backend: FastAPI app in `api/`.
- Core analysis modules at repo root: `seo_verifier.py`, `aeo_verifier.py`, `pagespeed_checker.py`, `api_manager.py`.
- Frontend: Vite + vanilla JS in `frontend/`.
- Local DB: SQLite file `seo_analysis.db`.
- Logging: `logs/app.log` through `api/logger.py`.
- Dev launcher script: `run_dev.bat`.

## Environment Assumptions
- Primary environment is Windows.
- Python virtual environment exists at `venv/` (Python 3.10 in `venv/pyvenv.cfg`).
- Prefer direct venv executables over shell activation when automating:
  - `venv\Scripts\python.exe`
  - `venv\Scripts\pip.exe`
  - `venv\Scripts\playwright.exe`

## Build, Run, and Test Commands

### Backend
- Run backend (recommended):
  - `venv\Scripts\python.exe run_backend.py`
- Alternative direct startup:
  - `venv\Scripts\uvicorn.exe api.main:app --host 127.0.0.1 --port 8000 --reload`
- API docs URL:
  - `http://127.0.0.1:8000/docs`

### Frontend
- Install dependencies (from `frontend/`):
  - `npm install`
- Dev server (from `frontend/`):
  - `npm run dev`
- Production build (from `frontend/`):
  - `npm run build`
- Preview build (from `frontend/`):
  - `npm run preview`

### Full Local Dev
- Start backend + frontend in separate windows:
  - `run_dev.bat`

### Browser Runtime Dependency
- Install Playwright Chromium once per environment:
  - `venv\Scripts\playwright.exe install chromium`

### Test and Verification
- Script-based API test:
  - `venv\Scripts\python.exe api_check.py`
- Full smoke script against running API:
  - `venv\Scripts\python.exe verify_all_fixes.py`
- Debug analysis flow script:
  - `venv\Scripts\python.exe debug_analyze.py`

### Single-Test Execution (Important)
- If `pytest` is available in the environment:
  - `venv\Scripts\python.exe -m pytest api_check.py::test_register_and_login -q`
  - `venv\Scripts\python.exe -m pytest api_check.py -k register_and_login -q`
- If `pytest` is not installed, run script directly:
  - `venv\Scripts\python.exe api_check.py`

### Lint / Format / Type Check Status
- No root lint/type/test config files found:
  - no `pyproject.toml`
  - no `setup.cfg`
  - no `pytest.ini`
  - no `tox.ini`
  - no `.flake8`
  - no `.pylintrc`
- Frontend `package.json` has no `lint` or test script.
- Use lightweight safety checks when needed:
  - `venv\Scripts\python.exe -m compileall api *.py`
  - `npm run build` in `frontend/`

## Python Code Style Conventions
These conventions are inferred from current source and should be followed unless surrounding code clearly differs.

### Imports
- Keep imports at the top of file.
- Preferred order for new edits:
  1) standard library
  2) third-party packages
  3) local package/module imports
- Existing files are mixed; avoid churn-only import reordering.

### Formatting
- Use 4-space indentation.
- Keep functions focused and reasonably short.
- Match surrounding style in touched files.

### Naming
- `snake_case` for variables/functions/methods.
- `PascalCase` for classes (`ApiManager`, `SeoVerifier`, `AeoVerifier`, `PageSpeedChecker`).
- `UPPER_SNAKE_CASE` for constants.

### Types and Schemas
- Typing is partial; add type hints incrementally when editing.
- Use Pydantic models for API request/response contracts.
- Avoid introducing loose `Any` unless truly needed.

### Async and I/O
- Use `async def` for I/O-heavy paths.
- For blocking sync Playwright work, use `asyncio.to_thread(...)` (existing service/route pattern).
- Keep bounded network concurrency (image HEAD checks already use limits).

### Error Handling
- In API routes, raise `HTTPException` for client-facing failures.
- Log exceptions with context before re-raising.
- Do not add bare `except:` in new code.
- Keep bugfixes minimal; avoid opportunistic refactors.

### Logging
- Backend modules should use `setup_logger(...)` from `api/logger.py`.
- CLI/debug scripts may use `print(...)`.
- Never log secrets, tokens, or passwords.

### Security and Config
- Never hardcode new credentials or API keys.
- Use `.env` and `dotenv`-loaded values.
- Preserve API key rotation behavior in `api_manager.py` and `pagespeed_checker.py`.

### Data and Persistence
- Keep SQLite assumptions unless migration work is explicitly requested.
- Use session dependency from `api/database.py`.
- Commit DB writes explicitly where needed; avoid hidden implicit writes.

## Frontend Conventions
- Stack is intentionally simple: Vite + vanilla JS + Chart.js.
- Keep main client logic in `frontend/src/main.js`.
- Keep styling in `frontend/style.css` (and existing frontend CSS files as needed).
- Existing JS style is semicolon-light; follow local file style.
- Use existing Vite proxy strategy in `frontend/vite.config.js` for backend calls.

## File and Change Guardrails
- Do not edit or rely on files inside:
  - `venv/`
  - `frontend/node_modules/`
  - `__pycache__/`
- Do not commit secrets (`.env`) or runtime artifacts (`logs/`, local DB snapshots) unless explicitly requested.
- Prefer small, targeted edits over broad rewrites.

## Agent Workflow Checklist
- Determine scope first: backend, frontend, or cross-stack.
- Before changes, read adjacent files for local patterns.
- After backend changes, run at least one backend validation command.
- After frontend changes, run `npm run build` from `frontend/`.
- If touching network/API logic, validate timeout and error behavior.

## Known Instruction Files
- `.cursorrules`: not found.
- `.cursor/rules/`: not found.
- `.github/copilot-instructions.md`: not found.
- If any of the above are added later, treat them as higher-priority agent constraints and update this file accordingly.
