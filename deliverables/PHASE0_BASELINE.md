# Phase 0 Baseline (Contract Freeze)

이 문서는 Phase 0 구현 기준선입니다.

## 1) API 계약 동결 범위

- 인증
  - `POST /api/register`
  - `POST /api/token`
  - `GET /api/users/me`
- 분석
  - `POST /api/analyze`
  - `POST /api/analyze/sitemap-batch`
  - `GET /api/analyze/sitemap-batch/{job_id}`
- 추적/추천
  - `POST /api/search-rank`
  - `POST /api/prompt-track`
  - `POST /api/aeo-optimizer/recommend`
- 결제
  - `GET /api/billing/config`
  - `POST /api/billing/create-checkout-session`
  - `POST /api/billing/create-portal-session`
  - `POST /api/billing/webhook`
- 운영
  - `GET /health`

## 2) 정책 기준선

- 비로그인: 경량 텍스트 분석
- 로그인: 정밀 렌더링 분석 포함
- 프롬프트 정책: 30개 기본 포함, 5개 추가당 월 $10
- 결제 경로: Stripe 단일 경로
- 프로토타입 데이터 정책: 프롬프트 원문/LLM 응답 미저장

## 3) 환경 변수 기준선

- Phase 0 기준 env 템플릿: `.env.example`
- 핵심 보안 항목
  - `JWT_SECRET_KEY`
  - `JWT_ALGORITHM`
  - `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`
  - `DATABASE_URL`
  - `CORS_ORIGINS`
