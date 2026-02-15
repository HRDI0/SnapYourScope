# Full Feature Infra Setup Guide (Detailed)

이 문서는 이 저장소(`web_page_seo_geo_analysis_site`)에서 모든 기능(무료/유료)을 운영 환경에서 실제 동작시키기 위해,
사용자가 직접 준비해야 하는 외부 서비스와 설정 순서를 상세히 정리한 실행 문서입니다.

---

## 1) 핵심 답변 먼저: API 키를 Vercel 환경변수로 관리할 수 있나?

가능합니다. 다만 **원칙은 "그 코드를 실행하는 런타임에 환경변수를 둔다"** 입니다.

- 백엔드가 Vercel Function에서 실행되면: OpenAI/Stripe/R2 등 서버용 키를 Vercel Project Environment Variables에 넣어도 됩니다.
- 백엔드가 Render/Railway/Fly 등 외부에서 실행되면: 해당 플랫폼에 서버 키를 넣어야 합니다.
- 프론트(Vite)에서 브라우저로 노출되는 값은 비밀 키를 넣으면 안 됩니다.

이 저장소의 현재 구조는 프론트(Vercel 정적) + 백엔드 별도 호스팅이 안정적이므로,
서버 비밀 키는 백엔드 호스팅 쪽에 두는 것을 기본 권장으로 작성했습니다.

---

## 2) 현재 저장소 기준 사실(코드 근거)

- 프론트 배포 설정: `vercel.json` (Vite 정적 빌드/출력)
- 백엔드 설정 소스: `api/config.py`
- LLM 호출: `api/services/llm_service.py`
- 공급자 가용성 판별: `api/services/provider_service.py`
- Blob 저장: `api/services/blob_storage_service.py`
- 프록시 목록 로딩: `api_manager.py`
- 개발 프록시(`/api -> 127.0.0.1:8000`): `frontend/vite.config.js`

중요 구현 상태:

- `STORAGE_BACKEND=local` / `r2`는 동작
- `STORAGE_BACKEND=supabase`는 현재 스캐폴드(업로드 미연결, RuntimeError)

---

## 3) 권장 아키텍처

### 권장안 (현재 코드와 가장 충돌 적음)

- Frontend: Vercel (정적 Vite 산출물)
- Backend: Render/Railway/Fly 중 1개 (FastAPI + Uvicorn)
- DB: Supabase Postgres (`DATABASE_URL`)
- Blob: Cloudflare R2 (`STORAGE_BACKEND=r2`)
- LLM: OpenAI API 키(필수), 필요 시 Gemini/Perplexity 보조
- Billing: Stripe

### 비권장안 (현재 기준 추가 작업 큼)

- FastAPI 전체를 Vercel Serverless로 올인
  - 함수 제약/콜드스타트/장기 작업/운영 복잡도 증가

---

## 4) 사전 준비 체크리스트 (계정)

아래 계정을 먼저 준비하세요.

1. OpenAI (프로젝트/키)
2. 프록시 제공사(회전 프록시)
3. Supabase (Postgres)
4. Cloudflare (R2)
5. Stripe
6. Vercel
7. 백엔드 호스팅(Render/Railway/Fly 중 택1)

---

## 5) 단계별 구축 순서 (실행형)

## Step A. OpenAI API 준비

### A-1. 계정/프로젝트
- OpenAI에서 운영용 Project 생성 (예: `snapyourscope-prod`)
- 스테이징/운영 분리 권장 (`-stg`, `-prod`)

### A-2. 키 발급
- 프로젝트 전용 API 키 생성
- 키는 1회만 보이므로 즉시 안전 저장

### A-3. 이 저장소 반영 변수
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (기본 `gpt-4o-mini`)

### A-4. 운영 안전장치
- 예산 알림, 월 한도 설정
- 키 유출 대응(즉시 회전) 절차 문서화

---

## Step B. 회전 프록시 준비

### B-1. 제공사 선택
- 합법적 사용 범위(약관, robots, 내부 정책) 충족되는 제공사 선택
- 지역 타겟이 필요하면 country/region 옵션 제공 여부 확인

### B-2. 엔드포인트 발급
- 최소 2개 이상 프록시 엔드포인트 준비 (장애 대비)
- 필요 시 세션 고정(sticky) 지원 플랜 선택

### B-3. 저장소 반영
- `.env`에 `PROXY_LIST`(쉼표 구분) 설정

예시(형식 예시):

```env
PROXY_LIST=http://user:pass@proxy-a:port,http://user:pass@proxy-b:port
```

### B-4. 코드 동작 참고
- 현재 `api_manager.py`는 `PROXY_LIST`에서 랜덤 1개를 선택

---

## Step C. Supabase(Postgres) 준비

### C-1. 프로젝트 생성
- Supabase 새 프로젝트 생성
- DB 패스워드 안전 저장

### C-2. 연결 문자열 확보
- 서버 환경에 맞는 연결 문자열 확보
- 서버리스/단기 연결 환경이면 pooler 모드 고려

### C-3. 저장소 반영
- `DATABASE_URL`에 Supabase Postgres 문자열 입력

### C-4. 주의
- 이 저장소에서 Supabase Storage는 아직 업로드 미연결
- DB 용도 중심으로 사용하고 Blob은 R2로 운영 권장

---

## Step D. Cloudflare R2 준비

### D-1. 버킷 생성
- R2 버킷 생성(환경별 분리 권장: `snapyourscope-prod`, `snapyourscope-stg`)

### D-2. API 토큰 생성
- Object Read/Write 권한
- 가능하면 버킷 스코프 제한

### D-3. 저장소 반영 변수
- `STORAGE_BACKEND=r2`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_ENDPOINT` (`https://<accountid>.r2.cloudflarestorage.com`)
- 선택: `STORAGE_PUBLIC_BASE_URL`

### D-4. 코드 동작 참고
- `api/services/blob_storage_service.py`는 R2 실패 시 local fallback

---

## Step E. Stripe 준비 (유료 기능)

### E-1. 상품/가격 준비
- Pro / Enterprise price id 생성

### E-2. 웹훅 준비
- webhook endpoint 등록 후 signing secret 확보

### E-3. 저장소 반영 변수
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_ENTERPRISE_MONTHLY`

---

## Step F. 백엔드 호스팅 배포

### F-1. 플랫폼 선택
- Render / Railway / Fly 중 택1

### F-2. 시작 명령

```bash
uvicorn api.main:app --host 0.0.0.0 --port $PORT --workers 2
```

### F-3. 필수 환경변수
- `JWT_SECRET_KEY`
- `DATABASE_URL`
- `CORS_ORIGINS`
- `APP_BASE_URL`
- `FRONTEND_APP_URL`

기능 활성화용 추가 변수:

- OAuth: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`
- Search: `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_CX`, `BING_SEARCH_API_KEY`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
- LLM: `OPENAI_API_KEY` (+ 필요 시 `AZURE_OPENAI_*`, `GEMINI_API_KEY`, `PERPLEXITY_API_KEY`)
- Storage: `STORAGE_BACKEND`, `R2_*`
- Billing: `STRIPE_*`
- Proxy/API rotation: `PROXY_LIST`, `PAGESPEED_KEYS`, `RICH_RESULTS_KEYS`

---

## Step G. Vercel 프론트 배포

### G-1. 현재 배포 설정
- `vercel.json`
  - `buildCommand: cd frontend && npm run build`
  - `outputDirectory: frontend/dist`

### G-2. API 연결 (중요)
- 로컬 `vite.config.js` 프록시는 운영에서 동작하지 않음
- 운영에서는 Vercel rewrite로 백엔드 도메인 연결

예시:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR_BACKEND_DOMAIN/api/:path*"
    }
  ]
}
```

---

## 6) 환경변수 "어디에" 넣어야 하나 (실무 매트릭스)

| 변수군 | 어디에 등록 | 이유 |
|---|---|---|
| `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `R2_SECRET_ACCESS_KEY`, `DATABASE_URL` | **백엔드 실행 플랫폼** | 서버에서만 써야 하는 비밀값 |
| `GOOGLE_OAUTH_CLIENT_ID` | 보통 백엔드 | OAuth 시작/검증이 백엔드에서 이뤄짐 |
| `GOOGLE_OAUTH_CLIENT_SECRET` | 백엔드만 | 비밀값 |
| 프론트 빌드용 공개 설정값(있다면) | Vercel | 브라우저 노출 가능 값만 |

정리:

- "Vercel에 API 키 등록"은 가능
- 하지만 백엔드가 Vercel 밖에서 돌면, 그 키는 백엔드 플랫폼에 넣어야 실제로 사용됨

---

## 7) Vercel에서 환경변수 등록 절차 (필요 시)

1. Vercel Project -> Settings -> Environment Variables
2. Key/Value 입력
3. Environment 선택(Production / Preview / Development)
4. 저장 후 재배포

CLI를 쓸 경우:

```bash
vercel env add OPENAI_API_KEY production
vercel env add OPENAI_API_KEY preview
```

주의:

- 비밀값은 브라우저 번들에 주입되는 prefix 형태(예: 공개용 prefix)로 쓰지 않기
- 민감 키 변경 시 즉시 롤링 재배포

---

## 8) 운영 직전 검증 순서

루트에서:

```bash
venv\Scripts\python.exe scripts\staging_readiness_check.py
venv\Scripts\python.exe scripts\storage_connection_check.py
venv\Scripts\python.exe api_check.py
```

프론트:

```bash
cd frontend
npm run build
```

권장 추가 검증:

```bash
venv\Scripts\python.exe scripts\primer_admin_local_verify.py
```

---

## 9) 장애 대응 기준

### R2 문제 발생 시
1. `STORAGE_BACKEND=local`로 임시 전환
2. 백엔드 재시작
3. `storage_connection_check.py` 재실행

### LLM 키 이슈
1. 키 회전
2. 환경변수 갱신
3. 백엔드 재시작
4. Prompt/AEO 엔드포인트 재검증

### 프론트에서 API 404/실패
1. Vercel rewrite 확인
2. 백엔드 도메인 CORS 확인 (`CORS_ORIGINS`)
3. `/health` 확인

---

## 10) 최종 활성화 체크리스트

- [ ] OpenAI 프로젝트/키 준비 및 서버 주입
- [ ] 회전 프록시 준비 및 `PROXY_LIST` 입력
- [ ] Supabase Postgres 연결 (`DATABASE_URL`) 완료
- [ ] Cloudflare R2 버킷/토큰/endpoint 설정 완료
- [ ] Stripe 가격/웹훅/키 설정 완료
- [ ] 백엔드 배포 및 필수 env 반영 완료
- [ ] Vercel 프론트 배포 + `/api` rewrite 연결 완료
- [ ] readiness/storage/api/build 검증 통과

---

## 11) 공식 문서 링크

- Vercel Rewrites: https://vercel.com/docs/rewrites
- Vercel Project Configuration: https://vercel.com/docs/project-configuration
- Vite on Vercel: https://vercel.com/docs/frameworks/frontend/vite
- Supabase API Keys: https://supabase.com/docs/guides/api/api-keys
- Supabase Postgres 연결: https://supabase.com/docs/guides/database/connecting-to-postgres
- Cloudflare R2 S3 시작: https://developers.cloudflare.com/r2/get-started/s3/
- Cloudflare R2 API Tokens: https://developers.cloudflare.com/r2/api/tokens/
- OpenAI API key safety: https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety
- OpenAI production best practices: https://developers.openai.com/api/docs/guides/production-best-practices
