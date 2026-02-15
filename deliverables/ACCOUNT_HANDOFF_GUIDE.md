# Account Handoff Guide

이 문서는 운영자가 계정/키만 연결하면 서비스 활성화가 가능하도록 전달하는 핸드오프 가이드입니다.

## 1) 운영자 입력 항목

- Stripe
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_PRO_MONTHLY`
  - `STRIPE_PRICE_ENTERPRISE_MONTHLY`
- Storage
  - `STORAGE_BACKEND`
  - `STORAGE_LOCAL_DIR`
  - (R2 사용 시) `R2_*` 변수
- LLM/Search APIs
  - `OPENAI_API_KEY` / `AZURE_OPENAI_*`
  - `GEMINI_API_KEY` or `GOOGLE_API_KEY`
  - `PERPLEXITY_API_KEY`
  - 검색 API 키들

## 2) 개발팀 제공 항목

- 환경변수 템플릿: `.env.example`
- 결제 운영 문서: `BILLING_RUNBOOK.md`, `WEBHOOK_TEST_CHECKLIST.md`
- 스토리지/배포 문서: `PHASE3_DEPLOYMENT_CHECKLIST.md`
- AI 운영 문서: `AI_OPERATIONS_GUIDE.md`

## 3) 전달 경계

- 본 단계에서는 실제 외부 계정 연결/실시간 연동 검증을 수행하지 않습니다.
- 계정 연결 후 운영자가 체크리스트 기반으로 최종 활성화를 수행합니다.

## 4) 활성화 직전 점검

- 백엔드 실행/헬스 체크 가능
- 프론트 빌드 성공
- 핵심 API 라우트 노출 확인
- 문서/정책값 최신 상태 확인
