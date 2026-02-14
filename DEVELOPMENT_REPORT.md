# Development Report

이 문서는 **SnapYourScope**의 아키텍처, 구현 상태, 그리고 신규 지시사항 반영 계획/결과를 기록하는 기준 문서입니다.

---

## 1) 서비스 개요

- 서비스명: **SnapYourScope**
- 포지셔닝: Lightweight URL-based SEO/AEO/GEO + Prompt Visibility Tracking
- 핵심 가치: 단일 URL 진단 + 검색/LLM 노출 추적으로 빠른 실행 가능한 인사이트 제공

---

## 2) 웹서치 기반 사전 결론 (지시사항 1차 조사)

### 2.1 GPT/Gemini 구독 OAuth 대체 가능성

- 결론: **소비자 구독 OAuth로 API 호출 대체는 불가**
  - ChatGPT Plus/Pro 구독은 API 크레딧/프로그램 호출 권한이 아님
  - Gemini 소비자 구독도 Developer API 호출 권한 대체가 아님
- 구현 가능한 공식 경로:
  - GPT: OpenAI API Key 또는 Azure OpenAI(엔터프라이즈 인증 경로)
  - Gemini: Gemini API Key 또는 Vertex AI 서비스 계정/OAuth 기반 경로

### 2.2 low-cost/무료 우선 구현 가능성

- 구현 우선(무료/최소비용):
  - 웹 검색 순위 추적 (Google/Bing/Naver API-key 기반)
  - Prompt tracking with share-of-model tier scoring
  - AEO 최적화 추천(기존 URL 진단 + 규칙 기반)
- 보류/제약:
  - Google AI Overviews 직접 공식 API 단일 경로는 제한적
  - Bing 비용은 상대적으로 높아 운영 전략 최적화 필요

---

## 3) 단계별 개발 계획 (요청 반영)

### Phase A. 인증/공급자 전략 기반
1. 공급자 능력 진단 API 추가
2. GPT/Gemini fallback 라우팅 계층 추가

### Phase B. Prompt tracking / Search rank
1. 무료 검색 순위 추적 API 추가
2. 유료 prompt tracking API 추가 (tier gating)
3. share-of-model 티어 스코어링 로직 추가

### Phase C. AEO 최적화 추천
1. URL 분석 결과 기반 추천 생성기 추가
2. 유료 엔드포인트로 제공
3. 추천 실행 이력 저장

### Phase D. 프론트 정보구조 개선
1. 메인 홍보 페이지 분리
2. 앱 대시보드 페이지 분리
3. 기능별 페이지 분리 (Prompt Tracker, AEO Optimizer)
4. 멀티페이지 빌드 구성

---

## 4) 현재 구현 결과 (완료)

### 4.1 백엔드

- 공급자/인증 전략
  - `api/services/provider_service.py`
  - `GET /api/provider/capabilities` (`api/routes/provider_capabilities.py`)

- LLM 호출 + fallback 기반
  - `api/services/llm_service.py`
  - 우선 공급자 실패 시 대체 공급자 호출 흐름 반영

- 검색 순위 추적 (무료 경로)
  - `api/services/search_tracking_service.py`
  - `POST /api/search-rank` (`api/routes/prompt_tracking.py`)

- Prompt tracking (유료)
  - `api/services/prompt_tracking_service.py`
  - `POST /api/prompt-track` (`api/routes/prompt_tracking.py`)
  - tier gating: `pro`, `enterprise`

- AEO 추천 (유료)
  - `api/services/aeo_optimizer_service.py`
  - `POST /api/aeo-optimizer/recommend` (`api/routes/aeo_optimizer.py`)
  - tier gating: `pro`, `enterprise`

- 모델 확장
  - `api/models.py`에 신규 테이블 추가:
    - `UserAuthProvider`
    - `PromptTrackRun`
    - `AeoRecommendationRun`

- 라우터 등록
  - `api/main.py`에 Providers / Prompt Tracking / AEO Optimizer 라우터 연결

### 4.2 프론트엔드

- 앱 분리
  - 기존 앱 UI: `frontend/app.html`
  - 메인 홍보 페이지: `frontend/index.html`

- 기능별 페이지 추가
  - `frontend/prompt-tracker.html` + `frontend/src/prompt-tracker.js`
  - `frontend/aeo-optimizer.html` + `frontend/src/aeo-optimizer.js`

- 스타일 계층
  - 메인 랜딩: `frontend/src/landing.css`
  - 기능 페이지 공용: `frontend/src/tools.css`
  - 앱 대시보드: `frontend/style.css`

- 앱 기능 확장
  - 앱 내 무료 검색 순위 추적 패널 추가
  - EN/KO/JA/ZH 다국어 선택 지원 유지/확장

- 빌드 구성
  - `frontend/vite.config.js` 멀티페이지 입력 설정

---

## 5) 검증 상태

- Python compile check: `venv/Scripts/python.exe -m compileall api *.py` 통과
- Frontend build: `npm run build` 통과 (멀티페이지 포함)
- 참고: LSP 진단은 로컬 바이너리 부재(`typescript-language-server`, `biome`)로 실행 불가

---

## 6) 운영 정책 (현재)

- 무료 기능
  - 단일 URL SEO/AEO/GEO 분석(기존)
  - 검색 순위 추적 API/페이지

- 유료 기능
  - sitemap batch 분석
  - prompt tracking
  - AEO optimization recommendation

---

## 7) 후속 작업 (우선순위)

1. 프론트에서 sitemap batch API 실연동
2. Prompt tracking 결과 히스토리/추세 차트 UI
3. 공급자별 토큰 갱신/실패 재시도 정책 고도화
4. Google AI Overviews/Perplexity 운영 비용 튜닝 및 규칙 개선
5. 결제 연동 시 tier 자동 승급/회수 플로우 연결

---

## 8) 2026-02-13 추가 구현 (대시보드/제한 정책/결제 확장)

### 8.1 UX/페이지 구조

- `frontend/keyword-rank.html` + `frontend/src/keyword-rank.js` 추가
  - 단일 키워드(무료), 다중 키워드(유료) 정책 반영
- `frontend/app.html`, `frontend/src/main.js`, `frontend/style.css` 업데이트
  - 좌측 탭: Keyword Rank / Prompt Tracker / AEO Optimizer 링크 추가
  - 상단 우측 GNB(메인/키워드 순위/프롬프트 추적/AEO) 추가
  - Enterprise 카드 클릭 시 체크아웃 대신 문의 탭 이동
  - 검색 순위 추적 패널을 앱 대시보드에서 분리(전용 페이지로 이동)

### 8.2 무료/유료 제한 정책

- 무료 계정:
  - 유료 실행 버튼 비활성화 + 고정 예시 결과 출력
  - 검색 순위 추적은 단일 키워드만 허용
- 유료 계정(Pro/Enterprise):
  - 검색 순위 다중 키워드 허용
  - 프롬프트 추적 다중 실행 허용(최대 30)
- 경쟁사 비교:
  - 무료 1개
  - 유료 5개 포함, 5개 초과는 URL당 월 $3 안내
  - Pro 상한 10개, 초과 시 Enterprise 유도

### 8.3 추적 주기 정책 반영

- Search rank: `daily`
- Prompt tracking / AEO optimizer: `weekly`
- API 응답에 `tracking_mode` 메타 필드 반영

### 8.4 결제 확장(Stripe 외 공급자 준비)

- 현재 운영 경로는 **Stripe 단일 경로**로 고정
- 사용자 지시(ULW 승인 후): Lemon Squeezy 진행 중단
  - 프론트 결제 제공자 선택 UI 제거
  - 백엔드 checkout/webhook 경로를 Stripe 기준으로 유지

---

## 9) 한국 거주/무사업자 기준 결제 도입 가이드 (실행 순서)

아래는 **법률/세무 자문이 아닌 기술 통합 가이드**이며, 현재 코드 기준으로 Stripe만 활성 경로입니다.

### 9.1 현재 활성 결제 경로 (Stripe only)

1. `POST /api/billing/create-checkout-session`
2. `POST /api/billing/create-portal-session`
3. `POST /api/billing/webhook`

### 9.2 Stripe 운영 체크리스트

1. 환경변수 확인: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price ids
2. 결제 성공 시 tier 승급 확인
3. 구독 종료/실패 시 tier 회수 확인
4. 웹훅 중복 수신 시 상태 일관성 확인

### 9.3 대체 결제수단

- Lemon Squeezy/기타 공급자 도입은 현재 **보류 상태**
- 이후 필요 시 별도 브랜치에서 검증 후 재도입

---

## 10) ULW 기획 라운드 (SEMrush 벤치마크 기반, 구현 전 설계)

본 섹션은 **구현 전 기획안**입니다. 사용자 요청에 따라 이 단계에서는 기능 구현/디자인 변경을 확정하지 않고, 승인 가능한 계획을 상세화합니다.

### 10.1 벤치마크 리서치 요약 (SEMrush 중심)

웹서치(공식 문서 + 공개 walkthrough + 비교 리뷰)에서 공통적으로 확인되는 대시보드 구조는 다음 축으로 수렴함:

1. **Overview 중심 홈**
   - 도메인/프로젝트 단위 핵심 지표 카드(가시성, 트래픽, 키워드, 백링크)
2. **Project Widgets**
   - Site Audit, Position Tracking, On-Page SEO recommendations, Backlink 상태 위젯
3. **드릴다운 흐름**
   - 카드 요약 -> 상세 리포트(이슈 리스트, 추이 차트, 우선순위 액션)
4. **경쟁사 비교 상시화**
   - 같은 화면에서 내 도메인 vs 경쟁 도메인 비교
5. **온보딩 체크리스트**
   - 초기 설정(도메인/키워드/경쟁사) 완료율 기반으로 다음 행동 제시

해석 원칙:
- 본 프로젝트는 SEMrush 전체 기능을 재현하지 않음
- **저비용/고빈도 사용 기능**만 추출해서 5개 페이지 구조 안에서 일관성 있게 재배치

### 10.2 현재 웹 구조 점검 결과 (문제 정의)

현재 코드 기준(`index`, `app`, `keyword-rank`, `prompt-tracker`, `aeo-optimizer`)에서 확인된 핵심 이슈:

1. **레이아웃 시스템 파편화**
   - 랜딩/앱/툴 페이지가 서로 다른 헤더/내비/패널 체계를 사용
2. **상태 로직 중복**
   - 언어(i18n), tier 동기화, 권한 게이팅 로직이 페이지별로 반복 구현
3. **정책 값 하드코딩 분산**
   - 프롬프트/경쟁사 제한과 과금 단가가 다수 파일에 문자열+로직으로 분산
4. **정보 밀도 불균형**
   - 일부 페이지는 카드/지표 중심, 일부는 폼 중심으로 UX 톤이 단절
5. **운영 변경 비용 증가**
   - 정책/문구/레이아웃 변경 시 다중 파일 동시 수정 필요

### 10.3 제품 목표 재정의 (이번 라운드 기준)

고정 큰틀(유지):
- 메인 페이지
- 대시보드
- 키워드 순위
- 프롬프트 추적
- AEO 최적화

개선 목표:
1. 페이지 유지 + 사용자 흐름 자연 연결
2. 통계형 대시보드 경험(카드/트렌드/우선순위)으로 일관화
3. 정책/과금/게이팅의 단일 소스화
4. 운영비 낮은 기능 우선 배치

### 10.4 저비용/고빈도 기능 추출 (우선순위)

P0 (반드시 유지/강화):
1. 키워드 순위 추적 (단일/배치)
2. 기술 SEO 점검(사이트 상태/핵심 오류)
3. On-page 개선 제안(핵심 텍스트/구조)
4. 경쟁사 비교(가시성/순위/핵심 지표)

P1 (가볍게 확장):
1. Prompt visibility 요약 점수(주간)
2. AEO 개선 우선순위(주간)

P2 (보류/후속):
1. 고비용 상시 크롤/대규모 자동 리포팅
2. 엔터프라이즈급 실시간 파이프라인

### 10.5 리팩토링 기획 (구현 전 상세 설계)

#### Phase R1: 공통 프레임 정리
- 목적: 5개 페이지가 같은 제품처럼 보이도록 공통 shell 확립
- 작업 계획:
  1. 공통 Header/GNB/상태 배지 패턴 정의
  2. 페이지별 상단 컨텍스트 카드 형식 통일
  3. 공통 디자인 토큰(색/타입/spacing) 단일화

#### Phase R2: 정보구조(IA) 재배치
- 목적: "요약 -> 분석 -> 액션" 순서 일관화
- 작업 계획:
  1. Dashboard를 통합 요약 허브로 고정
  2. Keyword Rank는 추적 전용(무료/유료 정책 명확화)
  3. Prompt Tracker/AEO는 결과 카드 + 실행 큐 구조로 통일

#### Phase R3: 정책 엔진 일원화
- 목적: 하드코딩 최소화
- 작업 계획:
  1. 가격/제한 값 중앙 정의(프론트/백 동일 기준)
  2. 게이팅 메시지 중앙 관리
  3. 문서/화면/응답 메타 동기화

#### Phase R4: 운영형 품질 강화
- 목적: 변경 비용과 회귀 위험 감소
- 작업 계획:
  1. 페이지 간 공통 유틸 분리(i18n/auth/tier)
  2. 상태 전이(로그인, 구독, 제한 초과) UX 표준화
  3. QA 체크리스트 기반 점검

### 10.6 정책 변경 요청 반영 (기획값)

사용자 요청 정책(기획 확정안):

- Prompt tracking 기본 포함량: **30개**
- 추가 과금: **5개당 월 $10**

현재 코드/문서의 일부 구간은 이전 값(예: 5개 포함, +$3)이 남아 있으므로,
다음 구현 라운드에서 아래 순서로 정합화 예정:
1. 백엔드 계산식 변경
2. 프론트 표시/사전 안내 변경
3. 다국어 문구 변경
4. 문서/정책표 동시 갱신

### 10.7 승인 게이트 (다음 단계)

다음 구현 라운드는 아래 승인 후 진행:
1. IA/화면 구조안 승인
2. 정책값(30 포함, +$10/5) 최종 승인
3. 페이지별 범위 잠금 (메인/대시보드/키워드/프롬프트/AEO)

승인 후에는 Phase R1 -> R4 순서로 실제 코드 리팩토링을 진행.

---

## 11) ULW 승인 후 1차 리팩토링 반영 (진행)

### 11.1 코드 분산 완화 (공통 모듈 도입)

- 신규 공통 모듈 추가:
  - `frontend/src/core/session.js`
  - `frontend/src/core/policy.js`
- 반영 페이지:
  - `frontend/src/prompt-tracker.js`
  - `frontend/src/keyword-rank.js`
  - `frontend/src/aeo-optimizer.js`

효과:
1. 언어 저장/문서 lang 반영/유저 tier 조회 로직 공통화
2. 프롬프트 과금 계산식 단일화
3. 정책 변경 시 수정 지점 축소

### 11.2 프롬프트 정책 변경 적용

- 정책값:
  - 기본 포함: **30개**
  - 추가 과금: **5개당 월 $10**
- 반영 위치:
  - 백엔드: `api/routes/prompt_tracking.py`
  - 프론트: `frontend/src/prompt-tracker.js`, `frontend/prompt-tracker.html`

### 11.3 결제 경로 정리 (Lemon Squeezy 보류)

- 지시사항 반영: Lemon Squeezy 진행 중단
- 반영 위치:
  - 백엔드: `api/routes/billing.py` Stripe 단일 경로로 정리
  - 프론트: `frontend/app.html`, `frontend/src/main.js` 결제 공급자 선택 UI/로직 제거

### 11.4 대시보드 셸 통합 (도구 페이지)

- 반영 위치:
  - `frontend/keyword-rank.html`
  - `frontend/prompt-tracker.html`
  - `frontend/aeo-optimizer.html`
  - `frontend/src/tools.css`
- 변경 내용:
  1. 도구 페이지를 공통 `tool-shell`(좌측 레일 + 워크스페이스) 구조로 정렬
  2. 사이드 네비 active 상태를 페이지별 고정
  3. 카드/패널/배경 토큰을 앱 대시보드 톤과 맞추도록 통일
