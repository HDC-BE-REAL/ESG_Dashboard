"""
KRX (Korea Exchange) Data Service
pykrx 라이브러리를 사용하여 KOSPI/KOSDAQ 지수 및 종목 정보를 조회합니다.
GitHub: https://github.com/sharebook-kr/pykrx
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import pandas as pd

# pykrx 라이브러리 임포트
try:
    from pykrx import stock
    PYKRX_AVAILABLE = True
except ImportError:
    PYKRX_AVAILABLE = False
    print("⚠️ pykrx 라이브러리가 설치되지 않았습니다. pip install pykrx")


class KRXService:
    """한국거래소 데이터 조회 서비스 (pykrx 기반)"""
    
    def __init__(self):
        self.available = PYKRX_AVAILABLE
        if not self.available:
            print("⚠️ KRX 서비스를 사용할 수 없습니다. pykrx 설치 필요.")
    
    def _get_date_str(self, date: str = None) -> str:
        """날짜 문자열 반환 (YYYYMMDD 형식)"""
        if date:
            return date
        # 오늘이 주말/공휴일이면 가장 최근 거래일 사용
        return datetime.now().strftime("%Y%m%d")
    
    def _get_recent_trading_day(self) -> str:
        """가장 최근 거래일 반환"""
        today = datetime.now()
        # 최근 7일 중 거래일 찾기
        for i in range(7):
            date = (today - timedelta(days=i)).strftime("%Y%m%d")
            try:
                # KOSPI 지수가 있으면 거래일
                idx = stock.get_index_ohlcv(date, date, "1001")
                if not idx.empty:
                    return date
            except:
                continue
        return today.strftime("%Y%m%d")
    
    def get_kospi_index(self, base_date: str = None) -> Optional[Dict]:
        """
        KOSPI 지수 정보를 조회합니다.
        
        Args:
            base_date: 조회 기준일 (YYYYMMDD 형식)
        
        Returns:
            KOSPI 지수 데이터
        """
        if not self.available:
            return None
        
        try:
            date = self._get_date_str(base_date) if base_date else self._get_recent_trading_day()
            
            # KOSPI 지수 (티커: 1001)
            df = stock.get_index_ohlcv(date, date, "1001")
            
            if df.empty:
                # 최근 거래일로 재시도
                date = self._get_recent_trading_day()
                df = stock.get_index_ohlcv(date, date, "1001")
            
            if df.empty:
                return {"error": "데이터 없음", "date": date}
            
            row = df.iloc[-1]
            return {
                "index_name": "KOSPI",
                "ticker": "1001",
                "date": date,
                "open": float(row.get("시가", 0)),
                "high": float(row.get("고가", 0)),
                "low": float(row.get("저가", 0)),
                "close": float(row.get("종가", 0)),
                "volume": int(row.get("거래량", 0)),
                "trading_value": int(row.get("거래대금", 0))
            }
        except Exception as e:
            print(f"❌ KOSPI 조회 실패: {e}")
            return None
    
    def get_kosdaq_index(self, base_date: str = None) -> Optional[Dict]:
        """
        KOSDAQ 지수 정보를 조회합니다.
        
        Args:
            base_date: 조회 기준일 (YYYYMMDD 형식)
        
        Returns:
            KOSDAQ 지수 데이터
        """
        if not self.available:
            return None
        
        try:
            date = self._get_date_str(base_date) if base_date else self._get_recent_trading_day()
            
            # KOSDAQ 지수 (티커: 2001)
            df = stock.get_index_ohlcv(date, date, "2001")
            
            if df.empty:
                date = self._get_recent_trading_day()
                df = stock.get_index_ohlcv(date, date, "2001")
            
            if df.empty:
                return {"error": "데이터 없음", "date": date}
            
            row = df.iloc[-1]
            return {
                "index_name": "KOSDAQ",
                "ticker": "2001",
                "date": date,
                "open": float(row.get("시가", 0)),
                "high": float(row.get("고가", 0)),
                "low": float(row.get("저가", 0)),
                "close": float(row.get("종가", 0)),
                "volume": int(row.get("거래량", 0)),
                "trading_value": int(row.get("거래대금", 0))
            }
        except Exception as e:
            print(f"❌ KOSDAQ 조회 실패: {e}")
            return None
    
    def get_stock_list(self, market: str = "ALL") -> Optional[List[Dict]]:
        """
        상장 종목 목록을 조회합니다.
        
        Args:
            market: 시장 구분 (ALL, KOSPI, KOSDAQ)
        
        Returns:
            종목 목록 데이터
        """
        if not self.available:
            return None
        
        try:
            date = self._get_recent_trading_day()
            
            if market.upper() == "KOSPI":
                tickers = stock.get_market_ticker_list(date, market="KOSPI")
            elif market.upper() == "KOSDAQ":
                tickers = stock.get_market_ticker_list(date, market="KOSDAQ")
            else:
                kospi = stock.get_market_ticker_list(date, market="KOSPI")
                kosdaq = stock.get_market_ticker_list(date, market="KOSDAQ")
                tickers = kospi + kosdaq
            
            result = []
            for ticker in tickers[:50]:  # 상위 50개만 반환 (성능)
                name = stock.get_market_ticker_name(ticker)
                result.append({
                    "ticker": ticker,
                    "name": name,
                    "market": market
                })
            
            return result
        except Exception as e:
            print(f"❌ 종목 목록 조회 실패: {e}")
            return None
    
    def get_stock_price(self, ticker: str, base_date: str = None) -> Optional[Dict]:
        """
        특정 종목의 시세를 조회합니다.
        
        Args:
            ticker: 종목 코드 (예: 005930 = 삼성전자)
            base_date: 조회 기준일 (YYYYMMDD 형식)
        
        Returns:
            종목 시세 데이터
        """
        if not self.available:
            return None
        
        try:
            date = self._get_date_str(base_date) if base_date else self._get_recent_trading_day()
            
            df = stock.get_market_ohlcv(date, date, ticker)
            
            if df.empty:
                date = self._get_recent_trading_day()
                df = stock.get_market_ohlcv(date, date, ticker)
            
            if df.empty:
                return {"error": "데이터 없음", "ticker": ticker}
            
            row = df.iloc[-1]
            name = stock.get_market_ticker_name(ticker)
            
            return {
                "ticker": ticker,
                "name": name,
                "date": date,
                "open": int(row.get("시가", 0)),
                "high": int(row.get("고가", 0)),
                "low": int(row.get("저가", 0)),
                "close": int(row.get("종가", 0)),
                "volume": int(row.get("거래량", 0)),
                "change_rate": float(row.get("등락률", 0))
            }
        except Exception as e:
            print(f"❌ 종목 시세 조회 실패: {e}")
            return None


# 싱글톤 인스턴스
krx_service = KRXService()
