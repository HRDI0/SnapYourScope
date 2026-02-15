# ULW Phase 7 Execution Plan

Last updated: 2026-02-15

## Goal

- Keep paid feature URL inputs visible for guest/free users, but disabled (gray, non-editable).
- Improve dashboard/tool UX hierarchy so key actions are easier to find.
- Add auth scaffold for email signup + Google login only.
- Add admin seed path for full paid-feature verification.
- Keep payment/storage/deployment as scaffold-first (no live account dependency).

## Scope Guardrails

- No live billing activation required.
- No live Supabase or R2 account binding required.
- Existing Stripe/R2 architecture remains; scaffold additions only.
- Functional verification scenario target URL: `https://primer.kr`.

## Implementation Phases

### P7-1 UX/Gating Hardening

- Tool pages keep paid URL fields visible but disabled for non-paid tiers.
- Add lock-state helper copy near disabled fields.
- Replace dense checkbox rows with compact grouped controls where needed.
- Re-balance section hierarchy so primary action area is visually dominant.

### P7-2 Auth Expansion (Email + Google)

- Keep current email register/login.
- Add Google OAuth scaffold endpoints:
  - `GET /api/auth/google/login-url`
  - `GET /api/auth/google/callback`
- Add frontend Google login entry point in auth modal.

### P7-3 Admin Seed + Verification Path

- Add admin seed script to create one enterprise-tier admin account.
- Add optional startup/admin bootstrap mode via env (non-destructive, idempotent).

### P7-4 Feature Scaffolds

- Payment: keep Stripe shell and checkout placeholders.
- Storage: keep R2 shell and add Supabase config placeholders.
- Deployment: add Vercel config skeleton and document expected env mapping.

### P7-5 Primer Scenario QA

- Sitemap batch: verify flow using single URL context (`https://primer.kr`).
- Prompt tracking: verify one prompt for primer brand.
- Rank tracking: verify one keyword request.
- AEO optimizer: verify updated template/references output path.

## Deliverables to Update on Major Milestones

- `deliverables/IMPLEMENTATION_PROGRESS.md`
- `deliverables/DEVELOPMENT_REPORT.md`
- `deliverables/DEVELOPMENT_PLAN.md`
- `deliverables/design_implementation_progress.md` (if UX phase implications change D0~D5 mapping)

## Verification Checklist

- Backend syntax check: `./venv/Scripts/python.exe -m compileall api scripts`
- Frontend build: `npm run build` (in `frontend/`)
- LSP diagnostics for modified JS/PY files (where language server is available)
