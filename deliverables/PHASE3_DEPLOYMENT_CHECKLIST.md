# Phase 3 Deployment Checklist

이 문서는 SnapYourScope의 Phase 3(스토리지/배포 준비) 완료를 위한 운영 체크리스트입니다.

## 1) Environment Variables

- Staging preflight (no external calls):

```bash
venv\Scripts\python.exe scripts\staging_readiness_check.py
```

- Expected:
  - `[OK] staging readiness`
  - `core_missing`, `billing_missing`, `r2_missing` are empty
  - if `STORAGE_BACKEND=r2`, all R2 keys are set

- Core
  - `JWT_SECRET_KEY`
  - `DATABASE_URL`
  - `CORS_ORIGINS`
- Storage
  - `STORAGE_BACKEND` (`local` or `r2`)
  - `STORAGE_LOCAL_DIR`
  - `STORAGE_PUBLIC_BASE_URL` (optional)
- R2 (when `STORAGE_BACKEND=r2`)
  - `R2_ACCOUNT_ID`
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_BUCKET_NAME`
  - `R2_ENDPOINT`

## 2) Storage Strategy Rules

- Default backend is `local`.
- If `STORAGE_BACKEND=r2` but R2 settings are incomplete (or client unavailable), backend falls back to `local`.
- DB stores metadata/summary; full analysis payload is stored as blob.

## 3) Connectivity Validation

- Run storage probe:

```bash
venv\Scripts\python.exe scripts\storage_connection_check.py
```

- Expected:
  - `[OK] storage connection check passed`
  - JSON output includes configured backend and effective backend
  - if fallback occurs, `fallback_reason` is populated

## 4) API Smoke Checks

- Health:

```bash
venv\Scripts\python.exe api_check.py
```

- Analyze endpoint (through app or API docs):
  - `POST /api/analyze`
  - Verify `reports.report_json` stores `blob_meta` + `summary`

- Sitemap batch endpoint:
  - `POST /api/analyze/sitemap-batch`
  - Verify each item `report_json` stores `blob_meta`

## 5) Rollback Notes

- If storage backend causes runtime issues:
  1. Set `STORAGE_BACKEND=local`
  2. Restart backend
  3. Re-run `scripts/storage_connection_check.py`
