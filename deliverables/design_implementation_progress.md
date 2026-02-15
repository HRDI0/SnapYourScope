# SnapYourScope SEO+AEO(GEO) 통합 디자인 개선 기획서

Last updated: 2026-02-15

## 0) 문서 작성 기준

- 본 문서는 사용자가 상단에 추가한 "하이브리드 검색 가시성 플랫폼" 입력을 기준선으로 삼아 작성한다.
- 기존 AEO(GEO) 중심 계획을 폐기하지 않고, SEO 기반 설계를 결합해 통합 계획으로 재구성한다.
- 목표는 기능 나열이 아니라 "SEO 기술 신뢰 + AEO/GEO 의미 권위"를 한 화면에서 연결해 의사결정을 돕는 디자인 체계를 만드는 것이다.

## 1) 통합 비전: Hybrid Search Visibility Platform

### 1.1 제품 정체성

- 기존: 단일 분석 도구/페이지별 분절 경험
- 통합 목표: 검색(Search)과 대화(Chat)를 연결하는 하이브리드 가시성 운영 플랫폼
- 핵심 정의: `Deterministic SEO`(기술 접근성) + `Probabilistic AEO/GEO`(인용/점유/권위) 동시 관리

### 1.2 전략적 가치

- SEO를 "기반 파이프라인"으로, AEO/GEO를 "확장 노출 레이어"로 정의한다.
- SEO 개선이 AEO/GEO 노출 증가로 이어지는 인과를 시각적으로 증명한다.
- 사용자는 "문제 확인"이 아니라 "우선순위 실행"까지 한 흐름으로 진행한다.

## 2) 통합 지표 프레임워크 (SEO + AEO + GEO)

### 2.1 의도 기반 3모드

- 탐색/거래(Search SEO): Rank, CTR, Organic Traffic
- 즉답/정보(AEO): Featured Snippet 점유, AI 답변 내 멘션
- 합성/발견(GEO): 모델별 인용 점유율, 엔티티 신뢰도, 감성 분포

### 2.2 통합 KPI 구조

- `SEO Foundation Score`: 크롤링/인덱싱/구조화/성능 중심 기술 점수
- `AEO Presence Score`: AI 답변 내 브랜드 등장 빈도/위치 점수
- `GEO Influence Score`: 생성형 엔진 내 비교/추천 맥락 점유 점수
- `Hybrid Visibility Index (HVI)`: 위 3개 축을 가중 합산한 운영 지표

### 2.3 인사이트 생성 규칙

- 모든 카드/차트는 숫자만 표시하지 않고 `원인 -> 영향 -> 다음 액션`을 함께 표기
- 기본 포맷: `title / why / fix_steps / expected_impact / references`

## 3) 비주얼 아이덴티티: Dual Spectrum System

### 3.1 컬러 원칙

- SEO 스펙트럼(신뢰): Blue 계열
- AEO/GEO 스펙트럼(지능): Purple 계열
- 통합 상태/전환: Blue -> Purple 하이브리드 그라디언트

### 3.2 토큰 명세

| Token | Light | Dark | 용도 |
|---|---|---|---|
| `seo-500` | `#3b82f6` | `#60a5fa` | SEO 기본 액션/라인 |
| `seo-600` | `#2563eb` | `#3b82f6` | SEO 강조/호버 |
| `seo-900` | `#1e3a8a` | `#bfdbfe` | SEO 텍스트/경계 |
| `aeo-500` | `#8b5cf6` | `#a78bfa` | AEO/GEO 기본 액션 |
| `aeo-600` | `#7c3aed` | `#8b5cf6` | AEO/GEO 강조/호버 |
| `aeo-900` | `#4c1d95` | `#ddd6fe` | AEO/GEO 텍스트/경계 |
| `hybrid-gradient` | `linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)` | same | 통합 KPI/전환 상태 |
| `slate-850` | `#1e293b` | `#1e293b` | 다크 카드 배경 |
| `slate-900` | `#0f172a` | `#0f172a` | 다크 앱 배경 |

### 3.3 인터랙션 원칙

- SEO 액션 완료: Blue 체크/하이라이트
- AEO/GEO 액션 실행: Purple 글로우/처리 상태
- Hybrid 카드: 좌우 혹은 상하 그라디언트 분할로 두 영역 연결성 표현

## 4) 정보구조 및 페이지 구조 통합

## 4.1 공통 읽기 흐름

- 상단: 상태 요약(Hybrid KPI)
- 중단: 원인 분석(SEO/AEO/GEO 상관)
- 하단: 실행 액션(Quick Wins + 상세 가이드)

## 4.2 통합 대시보드(Pulse)

- Zone A: `VisibilityImpactGauge`
  - 좌측 반원 SEO, 우측 반원 AEO/GEO
  - 자동 인사이트 문장 제공(예: "SEO 강함, AEO 낮음 -> FAQ/엔티티 강화")
- Zone B: `HybridTrafficChart` (Combo)
  - 좌측 Y(역축): 검색 순위(SEO)
  - 우측 Y: AI 인용/멘션(AEO/GEO)
  - 목적: 순위-인용 상관관계 확인
- Zone C: `MarketPresenceScatter`
  - X: Domain Authority, Y: AI Share of Voice
  - 버블 크기: 트래픽 규모
- Zone D: `LiveAnswerFeed`
  - 모델별 실시간 멘션 피드
  - 긍정/중립/부정 경계색 차등 표시

## 4.3 도구 페이지별 통합 방향

- Keyword Rank: SEO 기반 순위 변화 + 경쟁사 비교 + SERP 맥락 표시
- Prompt Tracker: AEO/GEO 대화 맥락에서 브랜드 점유/감성 변화 표시
- AEO Optimizer: 기술 SEO 전제조건 점검 항목을 함께 노출
- Billing/Enterprise: 분석 범위(SEO/AEO/GEO)와 정책 제약을 명확히 설명

## 5) 아키텍처 및 코드 제안 반영

### 5.1 프런트엔드 구조 원칙

- Vite + Vanilla JS 유지
- 컴포넌트 단위 렌더링 + 중앙 상태 관리
- SEO/AEO 영역 분리 렌더가 아니라 Hybrid 합성 가능한 렌더러 구성

### 5.2 상태관리 패턴 (Observer/Proxy 공존 가이드)

- 현재 프로젝트 패턴에 맞춰 경량 전역 상태를 유지
- 핵심 상태: `currentUrl`, `dateRange`, `seoMetrics`, `aeoMetrics`, `geoMetrics`, `isLoading`
- 요구 동작: 필터 변경 시 모든 KPI/차트/보드가 일관 업데이트

```javascript
// concept: hybrid store shape
const state = {
  currentUrl: null,
  dateRange: '7d',
  seoMetrics: {},
  aeoMetrics: {},
  geoMetrics: {},
  isLoading: false
}
```

### 5.3 병렬 데이터 페칭 원칙

- SEO/AEO/GEO API는 병렬 요청을 기본으로 하여 대시보드 체감 지연을 줄인다.
- 실패 시 부분 렌더링 허용 + 오류 배지 표시 + 재시도 액션 제공.

```javascript
const [seoData, aeoData, geoData] = await Promise.all([
  fetch(`/api/v1/seo/analysis?url=${url}`).then((r) => r.json()),
  fetch(`/api/v1/aeo/intelligence?url=${url}`).then((r) => r.json()),
  fetch(`/api/v1/geo/snapshot?url=${url}`).then((r) => r.json())
])
```

### 5.4 Chart.js 통합 설정 원칙

- SEO 라인(Blue), AEO/GEO 바/영역(Purple) 기본 규칙 고정
- SEO 축은 역순위 표현을 위해 `reverse: true` 사용
- 툴팁은 문맥 중심 텍스트(`rank`, `mentions`, `impact`)로 표기

## 6) 기능 모듈 상세 계획

### 6.1 Module A - Technical SEO Foundation

- 크롤링/인덱싱/렌더링 가시성 점검
- 스키마/메타/구조 태그의 AI 소비 가능성 동시 평가
- 산출: Blue Checklist 결과 + 즉시 수정 목록

### 6.2 Module B - AEO/GEO Intelligence

- 프롬프트 파생 테스트로 모델별 노출 위치 추적
- 브랜드 멘션 감성/어조 분석
- 산출: Purple Checklist 결과 + 모델별 개선 가이드

### 6.3 Module C - Hybrid Correlation Reporting

- SEO 변화와 AEO/GEO 노출 변화의 시차 상관분석
- 자동 해석 문장 생성(예: "SEO 10점 상승 후 2주 뒤 인용 15% 증가")
- 산출: Hybrid Insight 카드 + 우선순위 보드(P0/P1/P2)

## 7) 단계형 실행 계획 (상세)

### Phase D0 - 통합 기준선 확정 (0.5~1일)

- 목표: AEO 편향 제거, SEO+AEO(GEO) 동등 구조 고정
- 작업
  - Dual Spectrum 토큰/배지/카드 규격 고정
  - Hybrid KPI 정의(HVI, Foundation/Presence/Influence)
  - 페이지 공통 UI 체크리스트 확정
- 산출물
  - 토큰 표/사용 규칙
  - KPI 사전
  - 점검표 v1
- 완료 기준
  - 5페이지에서 SEO/AEO/GEO 요소 누락 없이 점검 가능

### Phase D1 - IA/레이아웃 통합 (1~2일)

- 목표: 페이지 간 읽기 흐름 일치
- 작업
  - `요약 -> 분석 -> 액션` 레이아웃 통일
  - Pulse 대시보드 Zone A~D 반영 설계
  - 사이드바 메뉴를 Foundation -> Discovery -> Intelligence 흐름으로 정렬
- 산출물
  - 페이지별 IA 맵
  - 레이아웃 diff 문서
- 완료 기준
  - 사용자 이동 시 맥락 단절 없음

### Phase D2 - 결과 표현 표준화 (2~3일)

- 목표: 실행 중심 결과 체계 확립
- 작업
  - 결과 카드 포맷 통일(`title/why/fix_steps/expected_impact/references`)
  - P0/P1/P2 보드 강화
  - HybridTrafficChart/Scatter/Feed 시각 규칙 통일
- 산출물
  - 렌더링 스펙
  - 컴포넌트 매핑표
- 완료 기준
  - 각 도구 결과가 동일 실행 문법으로 동작

### Phase D3 - 상태관리/데이터 연동 정합화 (1~2일)

- 목표: 필터/상태 변화에 대한 전역 일관성 확보
- 작업
  - 중앙 상태에 `seoMetrics/aeoMetrics/geoMetrics` 통합
  - 병렬 페칭 + 부분 실패 표시 규칙 반영
  - 로딩/오류/재시도 UI 통일
- 산출물
  - 상태 전이 맵
  - API-UI 연동표
- 완료 기준
  - URL/기간 변경 시 모든 위젯이 일관 갱신

### Phase D4 - 정책/메시징/도구 흐름 고도화 (2~3일)

- 목표: 정책 이해와 실행 전환율 개선
- 작업
  - 무료/유료 제한 문구를 SEO/AEO/GEO 범위와 연결해 표준화
  - Prompt 정책(기본 30개, 5개당 +$10)와 분석 범위 안내 일치화
  - Keyword/AEO/Billing 페이지의 CTA/전환 흐름 통일
- 산출물
  - 정책 카피 가이드
  - 도구별 전환 경로 맵
- 완료 기준
  - 정책 혼선 없이 업그레이드 경로 이해 가능

### Phase D5 - 최종 QA 및 문서 동기화 (1일)

- 목표: 릴리즈 준비 완료
- 작업
  - 반응형/접근성/가독성/성능 QA
  - 토큰/차트/상태 전이 회귀 점검
  - 관련 문서(보고/계획/진행/README) 동기화
- 산출물
  - QA 리포트
  - 릴리즈 노트
- 완료 기준
  - 주요 시나리오에서 UI 단절/오해/회귀 이슈 없음

## 8) 감사 체크리스트 (사용자 입력 반영)

### 8.1 Blue Checklist (SEO)

- [ ] robots 정책이 주요 크롤러/AI 봇 접근을 과도 차단하지 않는가
- [ ] 중요 페이지에 noindex 오적용이 없는가
- [ ] 모바일 LCP 2.5초 이내를 만족하는가
- [ ] H1~H6 구조와 문서 계층이 논리적인가

### 8.2 Purple Checklist (AEO/GEO)

- [ ] Organization 엔티티 정보(로고/소셜/식별자)가 일관되는가
- [ ] 질문형 헤딩/즉답형 문단 구조가 충분한가
- [ ] 핵심 답변이 초반부에 압축 제시되는가
- [ ] 비교 데이터가 구조화되어 AI 추출에 유리한가

## 9) 구현 대상 파일 매핑

- 메인 UI/흐름: `frontend/src/main.js`
- 공통 토큰: `frontend/src/core/tokens.css`
- 공통 컴포넌트: `frontend/src/ui/components.js`
- 공통 렌더러: `frontend/src/ui/renderers.js`
- 페이지 엔트리: `frontend/index.html`, `frontend/app.html`, `frontend/keyword-rank.html`, `frontend/prompt-tracker.html`, `frontend/aeo-optimizer.html`

## 10) 본 문서 운영 원칙

- 본 문서는 디자인 구현 라운드의 기준선 문서다.
- 구현 순서는 D0 -> D1 -> D2 -> D3 -> D4 -> D5를 고정한다.
- 각 Phase 종료 시 산출물/완료기준 점검 후 다음 단계로 이동한다.
- 모든 변경은 `deliverables/IMPLEMENTATION_PROGRESS.md`에 날짜 순으로 누적 기록한다.

## 11) 실행 상태 (2026-02-15)

- D0 완료: Dual Spectrum 토큰/기준선 반영
- D1 완료: Summary/Analysis/Action IA 및 메뉴 흐름 반영
- D2 완료: 결과 카드 표준화 및 Hybrid Correlation 시각화 반영
- D3 완료: 중앙 상태 관리(appState) 및 metrics 정합화 반영
- D4 완료: 정책/메시징/예외 상태/도구 간 Next Actions 반영
- D5 완료: 빌드/컴파일/LSP 진단 기반 QA 및 문서 동기화 완료

## 12) Post D5 (ULW 요청 반영)

- 유료 기능 URL 입력칸은 free/guest에서도 **표시 유지 + 입력 잠금(회색)** 정책으로 조정
- tool 페이지의 체크박스 밀도를 낮추기 위해 고급 옵션(`details`)으로 압축
- tool 레이아웃을 primary/result/next-actions 계층으로 재정렬해 시선 우선순위를 강화
- Google 로그인 스캐폴드 및 admin 검증 경로를 추가해 운영 전환 준비성을 높임

## 13) Post D5 Round-2 (전면 재수정)

- 대시보드 위험도 인지 강화
  - Pass/Warn/Fail 배지를 `Safe/Caution/Critical` 의미 체계로 재정렬
  - 상태 믹스/지연 차트 색을 가독성 중심 기본 팔레트(초록/주황/빨강/중립)로 조정
- 전체 페이지 좌측 네비 순서 통일
  - `Main -> Dashboard -> Keyword Rank -> Prompt Tracker -> SEO/AEO Optimizer -> Pricing -> Inquiry`
- 명칭 표준화
  - `AEO Optimizer` -> `SEO/AEO Optimizer`
  - `Enterprise` 탭 -> `Inquiry`
- 인증 UX 보강
  - 로그인/회원가입 모달 모두 Google continue 버튼 노출
- 시각 검증 완료
  - `screenshots/home.png`, `screenshots/app.png`, `screenshots/keyword-rank.png`, `screenshots/prompt-tracker.png`, `screenshots/aeo-optimizer.png`
