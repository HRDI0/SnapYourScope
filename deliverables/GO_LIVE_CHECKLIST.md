# Go-Live Checklist

계정 연동 직후 운영자가 수행할 최종 체크리스트입니다.

## 1) Runtime

- [ ] backend process 정상 기동
- [ ] frontend 정적 빌드/배포 반영
- [ ] `/health` 응답 정상
- [ ] staging readiness 점검 통과 (`venv\Scripts\python.exe scripts\staging_readiness_check.py`)

## 2) Auth / Tier

- [ ] 회원가입/로그인 기본 플로우 확인
- [ ] free/pro/enterprise 게이팅 정책 확인

## 3) Billing

- [ ] Stripe checkout session 생성 확인
- [ ] webhook 수신 및 idempotency 동작 확인
- [ ] tier 승급/회수 이벤트 반영 확인

## 4) Storage

- [ ] 분석 결과 blob 저장 확인 (`local` 또는 `r2`)
- [ ] DB에는 요약/메타만 저장되는지 확인
- [ ] fallback 정책(`r2` 실패 시 `local`) 확인

## 5) AI Tracking

- [ ] prompt tracking 응답의 `tracking_meta.ops` 확인
- [ ] `provider/model/latency/error_type/cost_estimate` 메타 확인

## 6) Staging Sign-off

- [ ] `storage_connection_check.py` 실행 후 configured/effective backend 확인
- [ ] Stripe test mode 결제/웹훅 이벤트까지 end-to-end 확인
- [ ] 주요 tool 페이지(대시보드/키워드/프롬프트/AEO)에서 `idle|sample|error|result` 상태 전환 확인
