from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from ..services.ai_service import ai_service

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])

class StrategyRequest(BaseModel):
    companyId: int
    market: str
    currentPrice: float

class ChatRequest(BaseModel):
    message: str

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
    ESG 및 탄소 배출권 관련 AI 상담
    """
    try:
        response_text = await ai_service.get_chat_response(request.message)
        return {"response": response_text}
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
