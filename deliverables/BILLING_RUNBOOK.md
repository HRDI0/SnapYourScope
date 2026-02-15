# Billing Runbook (Stripe)

이 문서는 Stripe 운영 기준의 Billing 처리 절차를 정리합니다.

## Scope

- Checkout session 생성
- Billing portal session 생성
- Webhook 이벤트 처리 및 상태 반영
- Webhook idempotency 운영

## Required Environment Variables

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_ENTERPRISE_MONTHLY`
- `APP_BASE_URL`

## Webhook Idempotency Policy

- 이벤트 식별자(`event.id`)를 `billing_webhook_events.event_id`에 저장합니다.
- 이미 `processed` 상태인 동일 이벤트는 재처리하지 않고 즉시 성공 응답합니다.
- 실패 이벤트(`failed`)는 Stripe 재시도 시 재처리 가능합니다.

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
- 운영자는 Stripe 이벤트 재전송 기능으로 해당 이벤트를 재처리할 수 있습니다.

## Operational Query Examples

- 최신 실패 이벤트 확인: `billing_webhook_events`에서 `status='failed'`
- 중복 이벤트 확인: 동일 `event_id` 존재 여부
- 최종 처리 이력: `processed_at` 기준 정렬
