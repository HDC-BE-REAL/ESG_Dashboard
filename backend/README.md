# ESG Dashboard

ESG 문서 분석 및 검색을 위한 통합 웹 플랫폼

## 📁 프로젝트 구조

```
ESG_Dashboard/
├── requirements.txt       # 공통 Python 의존성
├── src/                    # React 프론트엔드
│   ├── components/         # UI 컴포넌트
│   ├── lib/               # 유틸리티 & API 클라이언트
│   └── ...
├── backend/               # FastAPI 백엔드
│   ├── main.py           # API 서버
│   ├── requirements.txt  # Backend 전용 의존성 (공통 의존성 포함)
│   └── start.sh          # 서버 시작 스크립트
├── PDF_Extraction/        # PDF 추출 모듈
│   ├── src/              # Python 스크립트
│   └── vector_db/        # ChromaDB 벡터 저장소
└── package.json          # Node.js 의존성
```

## 🚀 빠른 시작

### 1. 백엔드 설정

```bash
# 가상환경 생성 (권장)
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치 (공통 + backend 전용)
pip install -r requirements.txt

# 서버 시작
./start.sh
# 또는: uvicorn main:app --reload --port 8000
```

**API 문서**: http://localhost:8000/docs

### 2. 프론트엔드 설정

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

**웹 앱**: http://localhost:5173

## 📡 API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/health` | 서버 상태 확인 |
| GET | `/api/search?query=...&top_k=5` | 문서 검색 |
| GET | `/api/companies` | 회사 목록 |
| GET | `/api/stats` | DB 통계 |

## 🔧 환경 변수

`.env` 파일 생성:

```env
VITE_API_URL=http://localhost:8000
OPENAI_API_KEY=your_api_key_here
```

## 📦 기술 스택

**Frontend**
- React + TypeScript
- Vite
- CSS

**Backend**
- FastAPI
- ChromaDB (Vector DB)
- Sentence Transformers (BAAI/bge-m3)

**PDF Processing**
- Docling
- PyMuPDF
- OpenAI API

## 📄 라이센스

MIT License
