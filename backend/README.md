# Backend README

ESG Dashboard 백엔드(FastAPI) 실행/구성 문서입니다.

## 1. 개요

- 언어/프레임워크: `Python + FastAPI + SQLAlchemy`
- 기본 DB: `MySQL` (`users`, `dashboard_emissions`, `industry_benchmarks`)
- 주요 기능:
  - 인증/회원 (`/auth/*`)
  - 프로필 관리 (`/profile/*`)
  - 대시보드/비교 데이터 (`/api/v1/dashboard/*`)
  - 시뮬레이터 시장 데이터 (`/api/v1/sim/*`)
  - AI 챗봇/전략 (`/api/v1/ai/*`)

## 2. 디렉토리 구조

```text
backend/
├── app/
│   ├── main.py                 # FastAPI 앱 엔트리포인트(권장)
│   ├── config.py               # .env 설정 로더
│   ├── database.py             # SQLAlchemy/MySQL 연결
│   ├── models.py               # User, DashboardEmission, IndustryBenchmark 모델
│   ├── schemas.py              # Pydantic 스키마
│   ├── init_db.py              # 테이블 초기화/시드
│   ├── routers/
│   │   ├── auth.py
│   │   ├── profile.py
│   │   ├── dashboard.py
│   │   ├── simulator.py
│   │   └── ai.py
│   ├── services/
│   │   ├── ai_service.py
│   │   ├── market_data.py
│   │   ├── eex_scraper.py
│   │   └── emission_extractor.py
│   └── static/profile/         # 업로드된 프로필 이미지
├── main.py                     # 통합 엔트리포인트(search/stats 보조 API 포함)
├── requirements.txt
├── start.sh
├── debug_api.py
└── test_api.py
```

## 3. 빠른 실행

프로젝트 루트(`ESG_Dashboard`) 기준:

```bash
python3.11 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
pip install -r backend/requirements.txt
```

DB 초기화:

```bash
cd backend/app
python init_db.py
cd ../..
```

서버 실행(권장):

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Swagger: `http://127.0.0.1:8000/docs`

## 4. 엔트리포인트 2종

### A. `app.main` (권장)

```bash
uvicorn app.main:app --reload --port 8000
```

- 핵심 라우터:
  - `/auth/*`
  - `/profile/*`
  - `/api/v1/dashboard/*`
  - `/api/v1/sim/*`
  - `/api/v1/ai/*`
- 프로필 이미지 정적 경로: `/static/*`

### B. `main` (통합 모드)

```bash
uvicorn main:app --reload --port 8000
```

- 위 핵심 라우터 + 보조 엔드포인트:
  - `/api/health`
  - `/api/search`
  - `/api/companies`
  - `/api/stats`

## 5. 환경 변수 (`.env`)

루트 `.env` 사용.

```env
# DB
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=esg

# JWT
JWT_SECRET_KEY=your_jwt_secret
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

# API behavior
USE_MOCK_DATA=true

# RAG/LLM
OPENAI_API_KEY=
VECTOR_DB_PATH=
CHROMA_HOST=
CHROMA_PORT=8000
OLLAMA_API_URL=http://localhost:11434
```

## 6. API 요약

### Auth

- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`

### Profile

- `GET /profile/me`
- `PUT /profile/me`
- `POST /profile/me/password`
- `POST /profile/me/email`
- `POST /profile/me/delete`
- `POST /profile/me/avatar` (`multipart/form-data`)

### Dashboard

- `GET /api/v1/dashboard/companies`
  - 회사별 최신/연도별 배출 데이터 반환
  - 일반 탭용 총량: `s1`, `s2`, `s3`
  - 시뮬레이터용 지역 분리: `s1Domestic`, `s2Domestic`, `s1Overseas`, `s2Overseas` (+ 존재 시 `s3Domestic/s3Overseas`)
  - `allowance`(무상할당), 집약도(`carbon_intensity_scope1/2/3`, `energy_intensity`) 포함
- `GET /api/v1/dashboard/benchmarks`
  - Compare 기준선(top10/median) 반환
- `POST /api/v1/dashboard/compare/insight`
  - 비교 인사이트 생성

### Simulator

- `GET /api/v1/sim/dashboard/market-trends`
  - K-ETS/EU-ETS 시계열(차트용)
- `GET /api/v1/sim/dashboard/trend-combined`
  - 보조 리스크 차트 데이터

시뮬레이터 계산 기준(프론트 계산):
- Step1 국내 직접 탄소량
  - `adjustedEmissions = (s1Domestic+s2Domestic) × (1 + emissionChange)`
  - `netExposure = adjustedEmissions - adjustedAllocation - thisYearReduction`
  - `complianceCostBase = netExposure × effectiveCarbonPrice`
- Step2 전략 배분
  - `immediateVolume = netExposure × complianceRatio`
  - `deferredVolume = netExposure - immediateVolume`
- Step3 해외 탄소 배출량
  - `overseasExpectedCost = (s1Overseas+s2Overseas) × EUA × EUR/KRW`
- Step4 결과 요약
  - `integratedExpectedCost = domesticTotal + overseasExpectedCost`
  - 예산(`simBudget`) 대비 리스크 등급 산정

### AI

- `POST /api/v1/ai/strategy`
- `POST /api/v1/ai/chat` (streaming)
- `POST /api/v1/ai/text-to-sql`

## 7. 인증 방식

- 로그인 성공 시 JWT access token 발급
- 보호 API 헤더:

```http
Authorization: Bearer <token>
```

- 비밀번호 해시: `passlib`의 `pbkdf2_sha256`

## 8. RAG/Chroma 동작

`ai_service.py` 기준:

- `CHROMA_HOST` 설정 시 원격 Chroma(`HttpClient`) 사용
- 미설정 시 로컬 Persistent Chroma 경로 탐색
  - `VECTOR_DB_PATH` 우선
  - 없으면 기본 후보(`PDF_Extraction/vector_db`) 탐색
- 벡터DB 미연결이어도 서버는 기동되며, RAG 품질만 제한될 수 있음

## 9. 트러블슈팅

### 포트 충돌 (`[Errno 48] Address already in use`)

```bash
lsof -i :8000
kill -9 <PID>
```

### DB 테이블 없음 (`Table ... doesn't exist`)

- `cd backend/app && python init_db.py` 재실행
- `.env`의 `DB_NAME`, `DB_USER`, `DB_PASSWORD` 확인

### 로그인 401

- 토큰 만료/불일치 가능성
- 프론트 저장 토큰 삭제 후 재로그인
