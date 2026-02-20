# Billing Runbook (Stripe, Consolidated)

Last updated: 2026-02-20

이 문서는 기존 `BILLING_RUNBOOK` + `WEBHOOK_TEST_CHECKLIST`를 통합한 결제 운영 문서입니다.

## Scope

- Checkout session 생성
- Billing portal session 생성
- Webhook 이벤트 처리 및 상태 반영
- Webhook idempotency 운영
- 운영 전/후 검증 체크리스트

## Required Environment Variables

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_ENTERPRISE_MONTHLY`
- `APP_BASE_URL`

## Webhook Idempotency Policy

- 이벤트 식별자(`event.id`)를 `billing_webhook_events.event_id`에 저장
- 이미 `processed` 상태인 동일 이벤트는 재처리하지 않고 즉시 성공 응답
- 실패 이벤트(`failed`)는 Stripe 재전송 시 재처리 가능

## Event Handling Map

- `checkout.session.completed`
  - subscription 레코드 생성/갱신
  - 유저 tier를 `pro`/`enterprise`로 반영
- `customer.subscription.updated`, `customer.subscription.created`
  - subscription 상태/기간 갱신
  - status 기준으로 tier 유지/회수
- `customer.subscription.deleted`, `invoice.payment_failed`
  - subscription 상태 `canceled`
  - 유저 tier `free` 회수

## Failure Handling

- webhook business 로직 실패 시:
  - DB rollback
  - `billing_webhook_events.status=failed`
  - `error_message` 기록
- 운영자는 Stripe 이벤트 재전송 기능으로 해당 이벤트를 재처리 가능

## Pre-Live Validation Checklist

### 1) Config Validation (No external calls)
- [ ] `STRIPE_SECRET_KEY` 존재
- [ ] `STRIPE_WEBHOOK_SECRET` 존재
- [ ] `STRIPE_PRICE_PRO_MONTHLY` 존재
- [ ] `STRIPE_PRICE_ENTERPRISE_MONTHLY` 존재
- [ ] `APP_BASE_URL` 존재

### 2) Endpoint Readiness
- [ ] `POST /api/billing/create-checkout-session` 응답 스키마 확인
- [ ] `POST /api/billing/create-portal-session` 응답 스키마 확인
- [ ] `POST /api/billing/webhook` signature 실패 시 400 확인

### 3) Idempotency Behavior
- [ ] 동일 `event.id` 재전송 시 idempotent 응답 확인
- [ ] `billing_webhook_events`에 `processed` 상태 1건 유지 확인

### 4) Failure and Retry
- [ ] 처리 실패 이벤트에서 `billing_webhook_events.status=failed` 기록 확인
- [ ] Stripe 재전송 시 재처리 가능한지 확인

### 5) Tier Transition Checks
- [ ] `checkout.session.completed` 후 tier 승급 흐름 확인
- [ ] `invoice.payment_failed`/`customer.subscription.deleted` 후 tier 회수 흐름 확인

## Operational Query Examples

- 최신 실패 이벤트 확인: `billing_webhook_events`에서 `status='failed'`
- 중복 이벤트 확인: 동일 `event_id` 존재 여부
- 최종 처리 이력: `processed_at` 기준 정렬
