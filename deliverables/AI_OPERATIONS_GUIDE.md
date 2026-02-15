# AI Operations Guide

이 문서는 Prompt Tracking 운영 기준(품질/실패/재시도/비용 추정)을 정의합니다.

## 1) Quality Model

- Mention tier
  - `not_mentioned` = 0
  - `mentioned` = 35
  - `mentioned_and_linked` = 70
  - `core_mentioned` = 100
- `share_of_model_score`
  - `not_available`를 제외한 LLM 점수 평균

## 2) Failure Taxonomy

- `timeout`
- `rate_limit`
- `auth`
- `network`
- `provider_unavailable`
- `unknown`

실패 분류는 `tracking_meta.ops`와 LLM 결과 `error_type`에 반영됩니다.

## 3) Retry Policy

- Provider fallback: enabled
- Source별 최대 시도 횟수: 1 (현재 빌드)
- 재실행은 상위 레벨에서 수행(스케줄러/배치 정책으로 확장 예정)

## 4) Operational Metrics

`tracking_meta.ops` 필드:

- `success_count`
- `failure_count`
- `total_latency_ms`
- `avg_latency_ms`
- `providers_used`
- `models_used`
- `estimated_cost_usd_total`

## 5) Cost Estimation Policy

- 기본값은 0 (추정 비활성)
- 아래 env를 설정하면 문자 수 기반 비용 추정 활성화:
  - `EST_COST_USD_PER_1K_CHARS_GPT`
  - `EST_COST_USD_PER_1K_CHARS_GEMINI`
  - `EST_COST_USD_PER_1K_CHARS_PERPLEXITY`

주의: 추정 비용은 운영 모니터링용 참고치이며, 실제 청구 금액과 다를 수 있습니다.
