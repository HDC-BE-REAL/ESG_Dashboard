import asyncio
import threading
from typing import AsyncGenerator, List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..services.ai_service import ai_service

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])

class StrategyRequest(BaseModel):
    companyId: int
    market: str
    currentPrice: float

class ChatHistoryItem(BaseModel):
    role: str
    text: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatHistoryItem]] = None
    companyName: Optional[str] = None
    companyKey: Optional[str] = None
    reportScope: Optional[str] = None
    reportYear: Optional[int] = None

@router.post("/strategy")
async def generate_strategy(request: StrategyRequest):
    """
    시장 동향을 분석하여 최적의 탄소 배출권 매수 전략을 생성함
    """
    try:
        result = await ai_service.generate_strategy(
            request.companyId, 
            request.market, 
            request.currentPrice
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat_with_ai(request: ChatRequest):
    """
    ESG 및 탄소 배출권 관련 AI 상담 (스트리밍)
    """

    async def event_generator() -> AsyncGenerator[str, None]:
        loop = asyncio.get_running_loop()
        queue: asyncio.Queue[Optional[str]] = asyncio.Queue()

        def safe_put(value: Optional[str]) -> None:
            if loop.is_closed():
                return
            try:
                asyncio.run_coroutine_threadsafe(queue.put(value), loop)
            except RuntimeError:
                pass

        history_payload = [item.dict() for item in request.history] if request.history else []
        selected_company = request.companyName
        selected_key = request.companyKey
        report_year = request.reportYear if request.reportScope == "latest" else None

        def produce() -> None:
            try:
                for chunk in ai_service.stream_chat_response(
                    request.message,
                    history_payload,
                    company_name=selected_company,
                    company_key=selected_key,
                    report_year=report_year,
                ):
                    safe_put(chunk)
            except Exception as exc:
                safe_put(f"스트리밍 중 오류가 발생했습니다: {exc}")
            finally:
                safe_put(None)

        threading.Thread(target=produce, daemon=True).start()

        while True:
            chunk = await queue.get()
            if chunk is None:
                break
            yield chunk

    try:
        headers = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
        return StreamingResponse(event_generator(), media_type="text/plain; charset=utf-8", headers=headers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SQLRequest(BaseModel):
    question: str
    db_schema: str

@router.post("/text-to-sql")
async def generate_sql(request: SQLRequest):
    """
    자연어로 SQL 쿼리를 생성함
    """
    try:
        sql = await ai_service.text_to_sql(request.question, request.db_schema)
        return {
            "question": request.question,
            "generated_sql": sql
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
