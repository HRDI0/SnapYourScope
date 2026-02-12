# Development Report

이 문서는 현재 프로젝트의 아키텍처, 구현 상태, 운영 포인트를 기록한 개발 보고서입니다.

---

## 1) 시스템 아키텍처

비용 효율성과 빠른 반복 개발을 기준으로 구성된 Python + Vite 기반 구조입니다.

### Backend: FastAPI
- 역할: 비동기 API 서버 및 SEO/GEO/AEO 분석 오케스트레이션
- 주요 엔드포인트:
  - `/api/token`, `/api/register` (인증)
  - `/api/analyze` (단일 URL 분석)
  - `/api/analyze/sitemap-batch` (유료 배치 분석)
  - `/api/analyze/sitemap-batch/{job_id}` (배치 상태)

### Data Layer: SQLAlchemy + SQLite
- 개발 DB: SQLite
- 모델: `User`, `AnalysisReport`, `SitemapBatchJob`, `SitemapBatchItem`
- 운영 확장 시 PostgreSQL 전환 가능

### Frontend: Vite + Vanilla JS + Chart.js
- 위치: `frontend/`
- 단일 URL 분석 흐름 유지
- 분석 결과는 카드/차트 기반 단일 화면 대시보드로 표시

---

## 2) 인증 및 권한

- JWT 기반 로그인/회원가입
- 비로그인 사용자: 단일 URL 분석(게스트 제한)
- 유료 사용자(`pro`, `enterprise`): sitemap batch API 사용 가능

---

## 3) 최근 구현 반영 사항

### 대시보드 UI/UX 개선
- 기존 텍스트 나열 리포트를 시각화 대시보드로 전환
- 포함 요소:
  - SEO 점수 도넛 차트
  - GEO 지역별 지연시간 바 차트
  - 상태 분포(pass/warn/fail/info) 도넛 차트
  - KPI 카드(SEO/AEO 통과율, 글로벌 도달, 평균 지연)
  - 콘텐츠 스냅샷 및 즉시 수정 이슈 패널

### 구현 파일
- `frontend/src/main.js`
- `frontend/style.css`

---

## 4) 로그/디버깅

- 로그 파일: `logs/app.log`
- 주요 기록 대상:
  - API 요청 처리
  - Playwright 렌더링 수집
  - 분석 단계별 성공/실패
  - 예외 traceback

---

## 5) 실행 방법

1. Backend 실행: `venv\Scripts\python.exe run_backend.py`
2. Frontend 실행: `frontend`에서 `npm run dev`
3. 접근:
   - API Docs: `http://127.0.0.1:8000/docs`
   - Frontend: `http://localhost:5173`

---

## 6) 향후 개발 항목

- 프론트에서 sitemap batch API 직접 연동
- 외부 대규모 데이터가 필요한 기능(순위 추적, 백링크 인텔리전스)
- 자동 리포팅/알림 고도화
- 인프라 항목(프록시 전략, 배포 고도화)
