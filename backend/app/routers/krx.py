"""
KRX (Korea Exchange) API Router
한국거래소 데이터를 조회하는 API 엔드포인트 (pykrx 기반)
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from ..services.krx_service import krx_service

router = APIRouter(prefix="/api/v1/krx", tags=["krx"])


@router.get("/kospi")
async def get_kospi_index(
    date: Optional[str] = Query(None, description="조회 기준일 (YYYYMMDD 형식)")
):
    """
    KOSPI 지수 시세를 조회합니다.
    
    - **date**: 조회할 날짜 (선택, 기본값: 최근 거래일)
    """
    if not krx_service.available:
        raise HTTPException(
            status_code=503,
            detail="pykrx 라이브러리가 설치되지 않았습니다."
        )
    
    result = krx_service.get_kospi_index(date)
    
    if result is None:
        raise HTTPException(
            status_code=500,
            detail="KOSPI 지수 조회에 실패했습니다."
        )
    
    return {
        "market": "KOSPI",
        "data": result
    }


@router.get("/kosdaq")
async def get_kosdaq_index(
    date: Optional[str] = Query(None, description="조회 기준일 (YYYYMMDD 형식)")
):
    """
    KOSDAQ 지수 시세를 조회합니다.
    
    - **date**: 조회할 날짜 (선택, 기본값: 최근 거래일)
    """
    if not krx_service.available:
        raise HTTPException(
            status_code=503,
            detail="pykrx 라이브러리가 설치되지 않았습니다."
        )
    
    result = krx_service.get_kosdaq_index(date)
    
    if result is None:
        raise HTTPException(
            status_code=500,
            detail="KOSDAQ 지수 조회에 실패했습니다."
        )
    
    return {
        "market": "KOSDAQ",
        "data": result
    }


@router.get("/stocks")
async def get_stock_list(
    market: str = Query("ALL", description="시장 구분 (ALL, KOSPI, KOSDAQ)")
):
    """
    상장 종목 목록을 조회합니다. (상위 50개)
    
    - **market**: 시장 유형 (ALL=전체, KOSPI, KOSDAQ)
    """
    if not krx_service.available:
        raise HTTPException(
            status_code=503,
            detail="pykrx 라이브러리가 설치되지 않았습니다."
        )
    
    result = krx_service.get_stock_list(market)
    
    if result is None:
        raise HTTPException(
            status_code=500,
            detail="종목 목록 조회에 실패했습니다."
        )
    
    return {
        "market": market,
        "count": len(result),
        "data": result
    }


@router.get("/stock/{ticker}")
async def get_stock_price(
    ticker: str,
    date: Optional[str] = Query(None, description="조회 기준일 (YYYYMMDD 형식)")
):
    """
    특정 종목의 시세를 조회합니다.
    
    - **ticker**: 종목 코드 (예: 005930 = 삼성전자)
    - **date**: 조회할 날짜 (선택, 기본값: 최근 거래일)
    """
    if not krx_service.available:
        raise HTTPException(
            status_code=503,
            detail="pykrx 라이브러리가 설치되지 않았습니다."
        )
    
    result = krx_service.get_stock_price(ticker, date)
    
    if result is None:
        raise HTTPException(
            status_code=500,
            detail=f"종목 '{ticker}' 시세 조회에 실패했습니다."
        )
    
    return {
        "data": result
    }
