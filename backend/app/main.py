from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from .routers import simulator, ai, krx, dashboard, auth, profile
from .services.market_data import market_service
from .services.ai_service import ai_service
import asyncio

app = FastAPI(title="ESG Simulator API")

# CORS 설정 (React 프론트엔드 연결 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(simulator.router)
app.include_router(ai.router)
app.include_router(krx.router)
app.include_router(auth.router)
app.include_router(profile.router)

static_dir = Path(__file__).resolve().parent / "static"
static_dir.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# ★ 핵심: 서버 시작 시 데이터 미리 로딩 (Preload)
@app.on_event("startup")
async def startup_event():
    # 비동기로 실행하여 서버 부팅을 막지 않음
    asyncio.create_task(market_service.preload_data())
    asyncio.create_task(ai_service.initialize())  # AI 서비스 초기화 (Lazy loading)

@app.get("/")
async def root():
    return {"message": "ESG Simulator API is running"}
