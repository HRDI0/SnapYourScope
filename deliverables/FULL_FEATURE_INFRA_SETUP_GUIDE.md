# Full Feature Infra Setup Guide (Click-by-Click)

이 문서는 이 프로젝트를 "읽고 링크 누르면서 그대로 따라가면" 배포 가능한 수준으로 만든 상세 런북입니다.

대상 기능:

- 분석 대시보드
- Keyword Rank / Prompt Tracker / SEO-AEO Optimizer
- 로그인/회원가입/Google OAuth
- 결제(Stripe)
- 외부 저장소(R2 또는 Supabase Storage)
- LLM(OpenAI) + 검색 API + 프록시

오픈 베타(비로그인 데모) 기준 핵심:

- 로그인/결제는 일시 중단 모드로 두고 데모 기능 우선 공개
- Search Rank / Prompt Tracking / SEO-AEO Optimizer를 대시보드형으로 운영
- 검색 API/LLM API 키를 우선 연결해 당일 데모 완성도 확보

---

## 0) 백엔드 호스팅 최종 선정 (Render vs Railway)

요청하신 무료 티어 가성비 기준으로 **Render 선택**입니다.

선정 이유(공식 문서 기준):

- Render Free Web Service: 월 750 free instance hours, 요금 0달러(제약 있음)
  - https://render.com/docs/free
- Railway Free: free trial 후 무료 플랜은 월 1달러 크레딧 구조(실사용 시 빠르게 소진 가능)
  - https://docs.railway.com/reference/pricing/plans

정리:

- "완전 무료로 최대한 오래" 운영하려면 Render가 유리
- 단, Render Free는 15분 유휴 시 sleep이 있으므로 첫 요청 지연이 발생함

주의: 가격/한도는 수시로 바뀌므로 배포 직전에 링크에서 다시 확인하세요.

---

## 1) 사전 준비: 계정 생성 링크

아래 계정을 먼저 만드세요.

1. Render: https://dashboard.render.com/register
2. Vercel: https://vercel.com/signup
3. Supabase: https://supabase.com/dashboard/sign-up
4. Cloudflare(R2): https://dash.cloudflare.com/sign-up
5. OpenAI API: https://platform.openai.com/signup
6. Stripe: https://dashboard.stripe.com/register
7. (선택) 프록시 제공사 계정

---

## 2) 이 저장소 로컬 준비

루트에서 실행:

```bash
copy .env.example .env
copy frontend\.env.example frontend\.env
```

PowerShell이면:

```powershell
Copy-Item .env.example .env
Copy-Item frontend/.env.example frontend/.env
```

---

## 3) Supabase 설정 (DB)

공식 문서:

- DB 연결: https://supabase.com/docs/guides/database/connecting-to-postgres
- API key 정책: https://supabase.com/docs/guides/api/api-keys

### 3-1. 프로젝트 생성

1. Supabase Dashboard 로그인
2. `New project`
3. Name/DB password 입력 후 생성

### 3-2. DB 연결 문자열 복사

1. 프로젝트 상단 `Connect` 클릭
2. Postgres connection string 복사
3. `.env`의 `DATABASE_URL`에 입력

예시:

```env
DATABASE_URL=postgresql://...
```

### 3-3. Storage를 Supabase로 쓸 경우(선택)

현재 코드에서 `STORAGE_BACKEND=supabase`도 동작하게 되어 있습니다.

1. Storage bucket 생성
2. Settings -> API Keys에서 서비스 키 확인
3. `.env`에 아래 입력:

```env
STORAGE_BACKEND=supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<secret>
SUPABASE_BUCKET_NAME=<bucket>
```

R2를 쓸 거면 이 값은 비워도 됩니다.

---

## 4) Cloudflare R2 설정

공식 문서:

- 시작(S3): https://developers.cloudflare.com/r2/get-started/s3/
- 토큰: https://developers.cloudflare.com/r2/api/tokens/

### 4-1. 버킷 생성

1. Cloudflare Dashboard -> `R2 object storage`
2. `Create bucket`

### 4-2. API 토큰 생성

1. `Manage R2 API tokens`
2. `Create Account API token` 또는 `Create User API token`
3. 권한: `Object Read & Write`
4. Access Key ID / Secret Access Key 복사

### 4-3. `.env` 반영

```env
STORAGE_BACKEND=r2
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<access-key-id>
R2_SECRET_ACCESS_KEY=<secret-access-key>
R2_BUCKET_NAME=<bucket-name>
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

---

## 5) OpenAI API 설정

공식 문서:

- 프로젝트 관리: https://help.openai.com/en/articles/9186755-managing-your-work-in-th

### 5-1. 프로젝트/키 생성

1. OpenAI Platform -> `Projects`
2. 운영용 프로젝트 생성
3. 해당 프로젝트에서 API key 생성

### 5-2. `.env` 반영

```env
OPENAI_API_KEY=<your-openai-api-key>
OPENAI_MODEL=gpt-4o-mini
```

권장:

- 프로젝트 예산 알림 설정
- key 노출 시 즉시 폐기/재발급

---

## 5-2) Gemini API 설정 (Prompt Tracking 확장)

공식 문서:

- Google AI Studio: https://aistudio.google.com/

클릭 순서:

1. Google 계정으로 AI Studio 로그인
2. 좌측 `Get API key` 클릭
3. `Create API key` 클릭
4. 사용할 GCP 프로젝트 선택(없으면 생성)
5. 발급된 키 복사

`.env` 반영:

```env
GEMINI_API_KEY=<your-gemini-api-key>
GEMINI_MODEL=gemini-2.5-flash
```

주의:

- 무료 티어는 RPM/TPM 제한이 있으므로 데모 직전 실제 호출 검증 권장
- 현재 프로젝트 데모 정책상 Prompt Tracking은 GPT 우선 운영 가능

---

## 5-3) Search Rank API 3종 설정 (Google/Bing/Naver)

이 섹션은 **검색 순위 추적(Search Rank)** 기능의 실운영 연결 절차입니다.

### A) Google Custom Search JSON API + Programmable Search Engine(CX)

공식 문서:

- API: https://developers.google.com/custom-search/v1/overview
- PSE: https://programmablesearchengine.google.com/

클릭 순서:

1. Google Cloud Console 프로젝트 생성
2. `APIs & Services > Library`에서 `Custom Search API` 활성화
3. `APIs & Services > Credentials > Create Credentials > API key` 생성
4. Programmable Search Engine(PSE) 생성
5. PSE 설정에서 `Search the entire web` 활성화
6. Search Engine ID(CX) 복사

`.env` 반영:

```env
GOOGLE_SEARCH_API_KEY=<google-custom-search-api-key>
GOOGLE_SEARCH_CX=<programmable-search-engine-id>
```

### B) Bing Web Search API

공식 문서:

- https://learn.microsoft.com/azure/ai-services/bing-web-search/

클릭 순서:

1. Azure Portal 로그인
2. `Create a resource` -> `Bing Search v7` 생성
3. 생성 후 `Keys and Endpoint` 이동
4. Key 1 또는 Key 2 복사

`.env` 반영 (현재 코드 변수명):

```env
BING_SEARCH_API_KEY=<azure-bing-key>
```

### C) Naver Search API

공식 문서:

- https://developers.naver.com/docs/serviceapi/search/

클릭 순서:

1. Naver Developers 로그인
2. `Application > 애플리케이션 등록`
3. 검색 API 사용 설정
4. Client ID / Client Secret 발급

`.env` 반영:

```env
NAVER_CLIENT_ID=<naver-client-id>
NAVER_CLIENT_SECRET=<naver-client-secret>
```

---

## 5-4) Prompt Tracking API 등록 순서 (GPT/Gemini/Google Search)

Prompt Tracking에서 "프롬프트 -> LLM 응답 -> 브랜드 언급 티어 + 링크"를 안정적으로 만들기 위한 권장 순서입니다.

필수(데모 최소):

1. OpenAI API (`OPENAI_API_KEY`)
2. Google Search API (`GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_CX`)

선택(확장):

3. Gemini API (`GEMINI_API_KEY`)

등록 절차:

1. OpenAI 키 발급/등록
2. Google Custom Search + CX 발급/등록
3. 서버 재시작
4. `/api/prompt-track` 1회 테스트
5. 필요 시 Gemini 키 추가 후 재테스트

빠른 검증 예시:

```bash
venv\Scripts\python.exe -c "from fastapi.testclient import TestClient; from api.main import app; c=TestClient(app); r=c.post('/api/prompt-track', json={'query':'best ai seo platform','target_url':'https://example.com','demo_client_id':'demo_local_01','brand_name':'example','llm_sources':['gpt'],'search_engines':['google']}); print(r.status_code); print(r.text[:300])"
```

---

## 6) 회전 프록시 설정 (선택)

이 프로젝트는 `PROXY_LIST`를 읽어 랜덤으로 선택합니다.

```env
PROXY_LIST=http://user:pass@proxy-a:port,http://user:pass@proxy-b:port
```

프록시를 쓰지 않으면 비워두면 됩니다.

---

## 7) Stripe 설정 (유료 기능 활성화)

### 7-1. Stripe Dashboard에서 준비

1. Product/Price 생성 (Pro, Enterprise)
2. Webhook endpoint 생성 (`/api/billing/webhook`)
3. Webhook signing secret 복사

### 7-2. `.env` 반영

```env
STRIPE_SECRET_KEY=<secret>
STRIPE_PUBLISHABLE_KEY=<publishable>
STRIPE_WEBHOOK_SECRET=<whsec_...>
STRIPE_PRICE_PRO_MONTHLY=<price_id>
STRIPE_PRICE_ENTERPRISE_MONTHLY=<price_id>
```

---

## 8) Google OAuth 설정 (선택)

### 8-1. Google Cloud Console

1. OAuth Client 생성 (Web)
2. Authorized redirect URI 등록:

```text
https://<YOUR_BACKEND_DOMAIN>/api/auth/google/callback
```

### 8-2. `.env` 반영

```env
GOOGLE_OAUTH_CLIENT_ID=<client-id>
GOOGLE_OAUTH_CLIENT_SECRET=<client-secret>
GOOGLE_OAUTH_REDIRECT_URI=https://<YOUR_BACKEND_DOMAIN>/api/auth/google/callback
```

---

## 9) 백엔드 배포 (Render 기준)

공식 FastAPI 배포 가이드:

- https://render.com/docs/deploy-fastapi

### 9-1. Render 서비스 생성

1. Render Dashboard -> `New` -> `Web Service`
2. GitHub repo 연결
3. 설정 입력:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn api.main:app --host 0.0.0.0 --port $PORT --workers 1`

### 9-2. Environment Variables 등록

Render 서비스 Settings -> Environment 에서 `.env` 값 등록.

최소 필수(이 프로젝트 기준):

```env
JWT_SECRET_KEY=<strong-random>
DATABASE_URL=<supabase-postgres-url>
CORS_ORIGINS=https://<your-vercel-domain>,https://<your-custom-domain>
APP_BASE_URL=https://<your-frontend-domain>
FRONTEND_APP_URL=https://<your-frontend-domain>/app.html
```

전체 기능을 위해서는 아래도 추가:

- Billing: `STRIPE_*`
- OAuth: `GOOGLE_OAUTH_*`
- Storage: `STORAGE_BACKEND`, `R2_*` 또는 `SUPABASE_*`
- Search: `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_CX`, `BING_SEARCH_API_KEY`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
- LLM: `OPENAI_API_KEY` (필요시 Gemini/Perplexity/Azure 추가)
- Proxy/SEO API rotation: `PROXY_LIST`, `PAGESPEED_KEYS`, `RICH_RESULTS_KEYS`

### 9-3. Health 확인

배포 후:

```text
https://<YOUR_BACKEND_DOMAIN>/health
```

---

## 10) 프론트 배포 (Vercel)

공식 문서:

- Vite: https://vercel.com/docs/frameworks/frontend/vite
- vercel.json: https://vercel.com/docs/project-configuration/vercel-json
- 환경변수: https://vercel.com/docs/environment-variables

### 10-1. 프로젝트 Import

1. Vercel Dashboard -> `Add New...` -> `Project`
2. GitHub repo 선택
3. 이 저장소는 `vercel.json`이 이미 있으므로 그대로 사용

현재 `vercel.json`:

- installCommand: `cd frontend && npm ci`
- buildCommand: `cd frontend && npm run build`
- outputDirectory: `frontend/dist`

### 10-2. Vercel 환경변수 등록

Project -> Settings -> Environment Variables:

```env
VITE_API_BASE_URL=https://<YOUR_BACKEND_DOMAIN>
```

중요:

- 프론트는 `VITE_API_BASE_URL`을 사용해 API를 절대경로로 호출하도록 코드 반영됨
- 즉, `/api rewrite` 없이도 동작 가능

---

## 11) .env 구성 예시 (복붙용 템플릿)

아래는 "전체 기능" 기준 예시입니다.

```env
# Core
JWT_SECRET_KEY=replace_with_secure_random
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=postgresql://...
CORS_ORIGINS=https://your-app.vercel.app,https://your-domain.com
APP_BASE_URL=https://your-domain.com
FRONTEND_APP_URL=https://your-domain.com/app.html

# Storage (choose one backend)
STORAGE_BACKEND=r2
STORAGE_LOCAL_DIR=storage_blobs
STORAGE_PUBLIC_BASE_URL=

# R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com

# Supabase storage (if STORAGE_BACKEND=supabase)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_BUCKET_NAME=

# Billing
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_ENTERPRISE_MONTHLY=

# OAuth
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=https://<backend-domain>/api/auth/google/callback

# SEO/Search APIs
PAGESPEED_KEYS=
RICH_RESULTS_KEYS=
PROXY_LIST=
GOOGLE_SEARCH_API_KEY=
GOOGLE_SEARCH_CX=
BING_SEARCH_API_KEY=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=

# LLM
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT=
AZURE_OPENAI_API_VERSION=2024-10-21
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ACCESS_TOKEN=
GEMINI_API_KEY=
GOOGLE_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
PERPLEXITY_API_KEY=
PERPLEXITY_MODEL=sonar

# Admin seed (optional)
ADMIN_SEED_ENABLED=false
ADMIN_SEED_EMAIL=admin@snapyourscope.local
ADMIN_SEED_PASSWORD=
```

프론트용(`frontend/.env`):

```env
VITE_API_BASE_URL=https://<YOUR_BACKEND_DOMAIN>
```

---

## 12) 배포 후 검증 순서 (그대로 실행)

루트에서:

```bash
venv\Scripts\python.exe scripts\staging_readiness_check.py
venv\Scripts\python.exe scripts\storage_connection_check.py
venv\Scripts\python.exe api_check.py
venv\Scripts\python.exe scripts\seed_admin_account.py
venv\Scripts\python.exe scripts\primer_admin_local_verify.py
```

프론트:

```bash
cd frontend
npm run build
```

기대 결과:

- readiness: `[OK]` 또는 누락 key 목록 출력
- storage check: `[OK]` + backend/ref 출력
- primer verify: 주요 유료 API 흐름 status < 400

---

## 13) 자주 막히는 포인트

1. 프론트에서 API 호출 실패
   - `VITE_API_BASE_URL` 오타/누락 확인
   - 백엔드 CORS에 프론트 도메인 포함 확인

2. Google OAuth callback mismatch
   - Google Console redirect URI와 `.env` `GOOGLE_OAUTH_REDIRECT_URI` 완전 일치 필요

3. Stripe webhook 실패
   - Webhook endpoint URL/secret 재확인

4. R2 업로드 실패
   - endpoint/account-id/bucket/token 권한 확인

5. Search Rank 결과가 비어있음
   - `GOOGLE_SEARCH_API_KEY` / `GOOGLE_SEARCH_CX` 둘 다 입력됐는지 확인
   - PSE가 전체 웹 검색으로 설정됐는지 확인
   - Bing/Naver 키는 각각 별도 유효성 확인

6. Prompt Tracking 티어/링크 출력이 비정상
   - OpenAI 키 유효성 확인
   - 요청 `llm_sources`, `search_engines`가 데모 허용값과 일치하는지 확인
   - API 쿼터/과금 제한 여부 콘솔에서 확인

---

## 14) 공식 링크 모음 (재확인용)

- Render Free: https://render.com/docs/free
- Render FastAPI: https://render.com/docs/deploy-fastapi
- Railway pricing reference: https://docs.railway.com/reference/pricing/plans
- Railway FastAPI guide: https://docs.railway.com/guides/fastapi
- Vercel Vite: https://vercel.com/docs/frameworks/frontend/vite
- Vercel env vars: https://vercel.com/docs/environment-variables
- Vercel vercel.json: https://vercel.com/docs/project-configuration/vercel-json
- Supabase DB connect: https://supabase.com/docs/guides/database/connecting-to-postgres
- Supabase API keys: https://supabase.com/docs/guides/api/api-keys
- Cloudflare R2 S3: https://developers.cloudflare.com/r2/get-started/s3/
- Cloudflare R2 tokens: https://developers.cloudflare.com/r2/api/tokens/
- OpenAI projects: https://help.openai.com/en/articles/9186755-managing-your-work-in-th
- Google Custom Search API: https://developers.google.com/custom-search/v1/overview
- Programmable Search Engine: https://programmablesearchengine.google.com/
- Azure Bing Web Search: https://learn.microsoft.com/azure/ai-services/bing-web-search/
- Naver Search API: https://developers.naver.com/docs/serviceapi/search/
- Google AI Studio (Gemini): https://aistudio.google.com/
