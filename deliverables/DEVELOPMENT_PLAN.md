# Development Plan (Integrated)

Last updated: 2026-02-15
Source baseline: `deliverables/deep-research-report.md`

## 1) 계획 목적

- deep research 결과와 구현 지시사항을 하나의 실행 계획으로 통합
- 코드 구현 범위와 운영 연동 범위를 명확히 분리
- 문서 기준선(보고/진행/운영 가이드)을 일관되게 유지
- 디자인 현대화 청사진을 SEO+AEO(GEO) 통합형 Hybrid Visibility 계획으로 동기화

## 2) 확정 정책 (Plan Freeze)

- 분석 모드: 비로그인 경량 분석, 로그인 정밀 렌더링 분석
- 인증 우선순위: 이메일 로그인 + 구글 소셜 로그인
- 타깃: 1차 프리랜서/소기업
- 프롬프트 저장 정책: raw prompt/raw LLM response 미저장
- 결제 정책: Stripe 단일 경로 유지
- 가격 정책: Prompt Tracking 기본 30개 + 추가 5개당 월 $10

## 3) 아키텍처 원칙

- DB에는 요약/운영 메타 중심 저장, 대형 payload는 blob 저장
- 고비용 경로(렌더링/배치/LLM)는 게이팅/정책 기반으로 제한
- 외부 연동은 코드상 준비 완료 후 운영자가 계정 연결
- 문서와 정책값은 코드와 동기화 유지

## 4) 워크스트림별 계획

### Product/PM
- 5페이지 구조 유지 + 사용자 흐름 연결성 강화
- 무료/유료 경계 문구와 정책 테이블 고정

### Backend
- API 계약 안정성 유지
- webhook/배치/스토리지/추적 메타 신뢰성 강화

### Frontend
- 공통 토큰/컴포넌트/렌더러 기반 UI 일관성 유지
- 결과를 우선순위 중심으로 노출
- 디자인 트랙(D0~D5) 기준으로 SEO+AEO(GEO) 통합 레이아웃/결과표현/정책게이팅/상태전이 품질을 순차 고도화
- Dual Spectrum(SEO Blue / AEO-GEO Purple) 및 Hybrid KPI 구조를 문서 기준선으로 유지

### AI Engineering
- 품질 지표(mention tier, share score) 고정
- 실패 분류/지연/비용 추정 메타 운영화

### DevOps/Data
- env 템플릿/배포 체크리스트/핸드오프 체크리스트 유지
- storage fallback, smoke check 경로 유지

## 5) Phase 계획 및 상태

| Phase | 목표 | 핵심 산출물 | 상태 |
|---|---|---|---|
| 0 | 기준선/환경 고정 | `PHASE0_BASELINE`, env-driven config | Completed |
| 1 | UI 구조 보강 | tokens/components/renderers, priority board | Completed |
| 2 | 백엔드/데이터 모델 정리 | no-raw policy, LLM meta, migration rehearsal | Completed |
| 3 | 스토리지/배포 준비 | blob storage abstraction, deployment checklist | Completed |
| 4 | 결제 운영 준비 | webhook idempotency, billing runbook | Completed |
| 5 | AI 운영 준비 | ai ops metadata, operations guide | Completed |
| 6 | 핸드오프/Go-live 준비 | handoff guide, go-live checklist, readiness scripts(account/staging) | Completed |
| D0~D5 | 디자인 현대화 트랙 | `design_implementation_progress.md` 기준 SEO+AEO(GEO) 통합 단계 계획 | Completed |
| 7 | ULW 요청 반영 | paid URL lock UX, Google OAuth scaffold, admin seed, primer scenario verify | Completed |
| 7-R2 | ULW 전면 재수정 | risk-first dashboard palette, nav order unification, inquiry tab rename, SEO/AEO optimizer rename | Completed |

## 6) 의존성/리스크/완화

### 의존성
- Stripe 계정/웹훅 키
- Storage(R2 선택 시 자격증명)
- LLM/Search API 키

### 리스크
- 비용 리스크: 고비용 경로 남용
- 품질 리스크: 모델 응답 변동성
- 운영 리스크: webhook 중복/실패 처리

### 완화
- 게이팅/정책 제한 + fallback 경로
- 추적 메타 기반 모니터링
- idempotency + 이벤트 이력 + 재처리 절차

## 7) Definition of Done

- 5페이지 UX와 핵심 API 흐름이 단절 없이 동작
- SEO+AEO(GEO) 통합 디자인 트랙(D0~D5) 산출물이 프론트/문서에 반영
- 보안/설정이 env-driven으로 고정
- blob 저장/DB 요약 저장 정책이 일관
- webhook idempotency 및 AI ops 메타가 코드/문서에 반영
- 운영자가 계정/키 연결만으로 활성화 가능한 문서 패키지 제공

## 8) 분리 유지 문서 (운영 절차)

아래 문서는 실행 계획 본문과 분리하여 운영 절차 전용으로 유지합니다.

- `deliverables/BILLING_RUNBOOK.md`
- `deliverables/WEBHOOK_TEST_CHECKLIST.md`
- `deliverables/AI_OPERATIONS_GUIDE.md`
- `deliverables/PHASE3_DEPLOYMENT_CHECKLIST.md`
- `deliverables/ACCOUNT_HANDOFF_GUIDE.md`
- `deliverables/GO_LIVE_CHECKLIST.md`

## 9) 다음 실행 단위 (연동 단계)

- 디자인 트랙(D0~D5) 구현 완료 상태 유지 및 회귀 QA 반복
- 운영자 계정/키 실제 연결
- `scripts/staging_readiness_check.py` 기준 staging preflight 통과
- webhook 실계정 이벤트 검증
- go-live checklist 기준 최종 점검
- Google OAuth 실제 Client 연동 후 callback 실검증
- Supabase/R2 실계정 연결 후 storage backend를 `local`에서 운영 설정으로 전환
