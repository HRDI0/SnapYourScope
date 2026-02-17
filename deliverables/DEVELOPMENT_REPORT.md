# Development Report

Last updated: 2026-02-18

## 1) 프로젝트 개요

- 서비스: **SnapYourScope**
- 목적: URL 단위 SEO/AEO/GEO 분석 + 키워드 순위 + 프롬프트 가시성 추적
- 제품 구조: 메인/대시보드/키워드/프롬프트/AEO의 5페이지 구조 유지
- 디자인 방향: SEO+AEO(GEO) 통합형 "Hybrid Visibility" 커맨드 센터 UX로 단계적 고도화

## 2) 핵심 확정 정책

- 분석 정책: 비로그인(경량) / 로그인(정밀 렌더링)
- 결제 정책: Stripe 단일 경로 유지(대체 결제수단 보류)
- 데이터 정책: 프롬프트 원문/LLM 원문 미저장, 요약/메타 중심 저장
- 가격 정책: Prompt Tracking 기본 30개, 추가 5개당 월 $10

## 3) 구현 완료 범위 (Phase 0~6)

### Phase 0 - 기준선/환경
- `api/config.py` 기반 env-driven 설정(JWT/DB/CORS)
- `.env.example` 정비
- 기준 문서: `deliverables/PHASE0_BASELINE.md`

### Phase 1 - UI 구조 보강
- 공통 토큰/렌더러/컴포넌트 도입
  - `frontend/src/core/tokens.css`
  - `frontend/src/ui/components.js`
  - `frontend/src/ui/renderers.js`
- 대시보드 이슈 우선순위 보드(P0/P1/P2) 반영
- 디자인 통합 기획서 기준(D0~D5) 정렬
  - `deliverables/design_implementation_progress.md`
- 문서 기준선: SEO Blue + AEO/GEO Purple의 Dual Spectrum 설계 반영

### 디자인 구현 트랙 D0~D5 완료
- D0: Dual Spectrum 토큰/공통 스타일 기준선 반영
- D1: Summary/Analysis/Action IA 재배치 + 메뉴 그룹 정렬
- D2: Why/Fix/Impact/Refs 결과 포맷 + Hybrid Correlation 차트 반영
- D3: 중앙 상태 관리(appState) 및 metrics 정합화 반영
- D4: 정책 문구/예외 상태(idle/sample/error/result)/도구 간 Next Actions 반영
- D5: 빌드/컴파일/LSP 진단 기반 QA 및 문서 동기화 완료

### Phase 2 - 백엔드/데이터 모델
- 프롬프트 저장 정책: raw 미저장 + `query_hash` + 요약 JSON 저장
- LLM 메타: provider/model/latency 포함
- 모델 확장: `PromptTrackRun` 운영 필드 확장
- 리허설 문서: `deliverables/DB_MIGRATION_REHEARSAL.md`

### Phase 3 - 스토리지/배포 준비
- blob storage 추상화(local/r2, fallback)
  - `api/services/blob_storage_service.py`
- 분석 결과 blob-first 저장 흐름 반영
  - `api/routes/analyze.py`
  - `api/services/sitemap_batch_service.py`
- 체크리스트: `deliverables/PHASE3_DEPLOYMENT_CHECKLIST.md`

### Phase 4 - 결제 운영 준비
- webhook idempotency 구현(event id 기반)
- 이벤트 처리 이력 모델 추가: `BillingWebhookEvent`
- 운영 문서:
  - `deliverables/BILLING_RUNBOOK.md`
  - `deliverables/WEBHOOK_TEST_CHECKLIST.md`

### Phase 5 - AI 운영 준비
- AI ops 메타 서비스 추가: `api/services/ai_ops_service.py`
- 에러 분류/비용 추정/latency 요약 메타 반영
- 운영 가이드: `deliverables/AI_OPERATIONS_GUIDE.md`

### Phase 6 - 계정 연동 핸드오프 준비
- 핸드오프 문서:
  - `deliverables/ACCOUNT_HANDOFF_GUIDE.md`
  - `deliverables/GO_LIVE_CHECKLIST.md`
- 준비 상태 점검 스크립트:
  - `scripts/account_handoff_readiness.py`
  - `scripts/staging_readiness_check.py`

## 4) 현재 상태 요약

- 개발 측 구현 범위(코드/문서/체크리스트) 완료
- 외부 계정 실제 연결/실시간 연동 검증은 의도적으로 미수행(요청 범위 제외)
- 계정/키만 주입하면 운영 전환 가능한 상태로 정리됨
- 사용자 입력 기반 디자인 요구사항을 SEO+AEO(GEO) 통합 기획 기준으로 문서 반영 완료
- 디자인 트랙 D0~D5 구현 완료(토큰/레이아웃/결과표현/상태흐름/QA)
- ULW 요청 반영으로 UX 게이팅/인증 스캐폴드/검증 자동화 추가 완료
- 무료/비로그인 상태에서도 유료 기능 URL 입력칸은 표시 유지, 입력 잠금(회색) 처리 완료
- Google 로그인 스캐폴드(`/api/auth/google/login-url`, `/api/auth/google/callback`) 추가
- admin 시드/검증 경로 추가 및 `admin@primer.kr` enterprise 계정 생성 확인
- Round-2 전면 재수정으로 대시보드 위험도 색 체계/가독성 재정렬 및 전 페이지 네비 순서 통일 완료
- `Enterprise` 탭을 `Inquiry`로 변경하고 `SEO/AEO Optimizer` 명칭 표준화 완료
- 로그인/회원가입 모달 모두 Google continue 버튼 노출 완료
- 이메일/구글 계정 중복 가입 방지 로직 및 DB uniqueness 보강 완료
- 전 페이지 대시보드 레이아웃을 GA4 스타일(상단 KPI + 하단 넓은 리포트 존)로 재정렬
- 메인 대시보드에 경쟁사 다중 URL 평균 점수/점수차 KPI 반영
- Search Rank/Prompt Tracking/SEO-AEO Optimizer 결과를 우측 패널형에서 하단 풀폭 대시보드형으로 변경
- Prompt Tracking 티어 1~4 기준 및 공유 링크 중심 표 대시보드 정렬 완료
- `deliverables/FULL_FEATURE_INFRA_SETUP_GUIDE.md`에 Google/Bing/Naver/OpenAI/Gemini 발급 및 환경변수 연결 절차를 클릭 단위로 보강

## 5) 남은 운영 단계 (개발 외)

- Stripe 실계정 키/가격 ID/웹훅 연결
- Storage(R2 사용 시) 자격 증명 연결
- LLM/Search API 키 연결
- `deliverables/GO_LIVE_CHECKLIST.md` 기준 최종 점검

## 7) ULW 반영 산출물

- 계획: `deliverables/ULW_PHASE7_EXECUTION_PLAN.md`
- UX 변경: `frontend/src/tools.css`, `frontend/src/main.js`, `frontend/style.css`
- Google OAuth scaffold: `api/routes/auth.py`, `api/config.py`, `frontend/app.html`
- Admin seed/검증: `scripts/seed_admin_account.py`, `scripts/primer_admin_local_verify.py`, `api/services/admin_seed_service.py`
- Infra scaffold: `vercel.json`, `.env.example`, `api/services/blob_storage_service.py`
- Round-2 시각 검증: `screenshots/home.png`, `screenshots/app.png`, `screenshots/keyword-rank.png`, `screenshots/prompt-tracker.png`, `screenshots/aeo-optimizer.png`

## 6) 참고 문서

- 개발 계획(통합본): `deliverables/DEVELOPMENT_PLAN.md`
- 진행 로그(날짜순): `deliverables/IMPLEMENTATION_PROGRESS.md`
- 디자인 통합 계획: `deliverables/design_implementation_progress.md`
- 원본 리서치: `deliverables/deep-research-report.md`
