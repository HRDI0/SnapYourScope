# Go-Live Checklist (Consolidated)

Last updated: 2026-02-20

이 문서는 기존 `GO_LIVE_CHECKLIST`, `ACCOUNT_HANDOFF_GUIDE`, `PHASE3_DEPLOYMENT_CHECKLIST`를 통합한 운영 체크리스트입니다.

## 1) Handoff Inputs (운영자 전달값)

- Stripe
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_PRO_MONTHLY`
  - `STRIPE_PRICE_ENTERPRISE_MONTHLY`
- Core
  - `JWT_SECRET_KEY`
  - `DATABASE_URL`
  - `CORS_ORIGINS`
  - `APP_BASE_URL`
- Storage
  - `STORAGE_BACKEND` (`local` or `r2`)
  - `STORAGE_LOCAL_DIR`
  - `STORAGE_PUBLIC_BASE_URL` (optional)
  - (`STORAGE_BACKEND=r2`일 때) `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT`
- LLM/Search
  - `OPENAI_API_KEY` / `AZURE_OPENAI_*`
  - `GEMINI_API_KEY` or `GOOGLE_API_KEY`
  - `PERPLEXITY_API_KEY`
  - 검색 API 키 세트

## 2) Runtime

- [ ] backend process 정상 기동
- [ ] frontend 정적 빌드/배포 반영
- [ ] `/health` 응답 정상
- [ ] staging readiness 점검 통과

```bash
venv\Scripts\python.exe scripts\staging_readiness_check.py
```

## 3) Storage / Deployment

- [ ] `storage_connection_check.py` 실행 후 configured/effective backend 확인
- [ ] 분석 결과 blob 저장 확인 (`local` 또는 `r2`)
- [ ] DB에는 요약/메타만 저장되는지 확인
- [ ] fallback 정책(`r2` 실패 시 `local`) 확인
- [ ] `POST /api/analyze` 결과에 `blob_meta` + `summary` 저장 확인
- [ ] `POST /api/analyze/sitemap-batch` 각 결과에 `blob_meta` 저장 확인

```bash
venv\Scripts\python.exe scripts\storage_connection_check.py
venv\Scripts\python.exe api_check.py
```

Rollback (storage 이슈 시):
1. `STORAGE_BACKEND=local`
2. backend restart
3. `storage_connection_check.py` 재실행

## 4) Auth / Tier

- [ ] 회원가입/로그인 기본 플로우 확인
- [ ] free/pro/enterprise 게이팅 정책 확인

## 5) Billing

- [ ] Stripe checkout session 생성 확인
- [ ] webhook 수신 및 idempotency 동작 확인
- [ ] tier 승급/회수 이벤트 반영 확인
- [ ] Stripe test mode 결제/웹훅 이벤트 end-to-end 확인

## 6) AI Tracking

- [ ] prompt tracking 응답의 `tracking_meta.ops` 확인
- [ ] `provider/model/latency/error_type/cost_estimate` 메타 확인

## 7) Final Sign-off

- [ ] 주요 tool 페이지(대시보드/키워드/프롬프트/AEO)에서 `idle|sample|error|result` 상태 전환 확인
- [ ] 문서/정책값 최신 상태 확인
