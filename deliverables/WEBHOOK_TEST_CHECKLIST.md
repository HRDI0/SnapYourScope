# Stripe Webhook Test Checklist

실제 결제 계정 연동 전, 개발팀 구현 범위를 기준으로 점검할 항목입니다.

## 1) Config Validation (No external calls)

- [ ] `STRIPE_SECRET_KEY` 존재
- [ ] `STRIPE_WEBHOOK_SECRET` 존재
- [ ] `STRIPE_PRICE_PRO_MONTHLY` 존재
- [ ] `STRIPE_PRICE_ENTERPRISE_MONTHLY` 존재
- [ ] `APP_BASE_URL` 존재

## 2) Endpoint Readiness

- [ ] `POST /api/billing/create-checkout-session` 응답 스키마 확인
- [ ] `POST /api/billing/create-portal-session` 응답 스키마 확인
- [ ] `POST /api/billing/webhook` signature 실패 시 400 확인

## 3) Idempotency Behavior

- [ ] 동일 `event.id` 재전송 시 idempotent 응답 확인
- [ ] `billing_webhook_events`에 `processed` 상태 1건 유지 확인

## 4) Failure and Retry

- [ ] 처리 실패 이벤트에서 `billing_webhook_events.status=failed` 기록 확인
- [ ] Stripe 재전송 시 재처리 가능한지 확인

## 5) Tier Transition Checks

- [ ] `checkout.session.completed` 후 tier 승급 흐름 확인
- [ ] `invoice.payment_failed`/`customer.subscription.deleted` 후 tier 회수 흐름 확인
