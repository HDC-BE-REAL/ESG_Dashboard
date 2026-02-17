import pandas as pd
import FinanceDataReader as fdr
import yfinance as yf
from yahoo_fin import stock_info as si
from datetime import datetime, timedelta
import asyncio
from typing import List, Dict, Any, Optional
import httpx
from ..config import settings

class MarketDataService:
    # Class-level cache (shared across requests)
    _cache = {} 
    _last_updated = None
    _is_updating = False

    def __init__(self):
        pass

    async def preload_data(self):
        """Preload 3 years of data on server startup."""
        if MarketDataService._is_updating:
            return
        
        try:
            MarketDataService._is_updating = True
            print("⏳ [System] Preloading 3-year market data... (This may take a few seconds)")
            # Use a slightly longer timeout for initial load
            try:
                data = await asyncio.wait_for(self._fetch_dual_market_data_async(days=1095), timeout=30.0)
                if data:
                    MarketDataService._cache = data
                    MarketDataService._last_updated = datetime.now()
                    print(f"✅ [System] Market data cached! ({len(data)} rows)")
            except asyncio.TimeoutError:
                print("⚠️ [System] Market data preload timed out. Using fallback data.")
        finally:
            MarketDataService._is_updating = False

    async def _fetch_dual_market_data_async(self, days=365):
        """Async wrapper for the fetch logic to avoid blocking event loop"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._fetch_dual_market_data, days)

    def _fetch_dual_market_data(self, days=365):
        """
        Fetch market data with 4-layer fallback:
        Alpha Vantage -> yfinance -> yahoo_fin -> FDR (Korea)
        """
        # [MOCK MODE] API 호출을 아끼기 위해 설정된 경우 즉시 더미/기존 데이터 반환
        if settings.USE_MOCK_DATA:
            print("💡 [MarketData] Mock mode enabled. Skipping external API calls.")
            return self._get_mock_market_history(days)

        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        # ==========================================
        # 🇪🇺 1. EU-ETS (European Carbon Permits)
        # ==========================================
        eu_series = pd.Series(dtype=float)
        
        # [Try 1] Alpha Vantage (API Key Required)
        if settings.ALPHA_VANTAGE_API_KEY:
            try:
                # Symbol: FCO2.FRK (Frankfurt) or similar
                url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=FCO2.FRK&apikey={settings.ALPHA_VANTAGE_API_KEY}&outputsize=full"
                with httpx.Client(timeout=10.0) as client:
                    resp = client.get(url)
                    data = resp.json()
                    if "Time Series (Daily)" in data:
                        ts = data["Time Series (Daily)"]
                        df_av = pd.DataFrame.from_dict(ts, orient='index')
                        df_av.index = pd.to_datetime(df_av.index)
                        df_av = df_av.sort_index()
                        # Filter date range
                        mask = (df_av.index >= start_date) & (df_av.index <= end_date)
                        df_av = df_av.loc[mask]
                        if not df_av.empty:
                            eu_series = df_av['4. close'].astype(float)
            except Exception as e:
                print(f"⚠️ Alpha Vantage EU failed: {e}")

        # [Try 2] yfinance (Official API Wrapper)
        if eu_series.empty:
            try:
                # Tickers: FCO2.DE (Xetra), ECF.DE, etc.
                eu_df = yf.download("FCO2.DE", start=start_date, end=end_date, progress=False, timeout=5)
                if not eu_df.empty:
                    if isinstance(eu_df.columns, pd.MultiIndex):
                        eu_series = eu_df['Close'].iloc[:, 0]
                    else:
                        eu_series = eu_df['Close']
            except Exception as e:
                print(f"⚠️ yfinance EU failed: {e}")

        # [Try 3] yahoo_fin (Web Scraping Backup)
        if eu_series.empty:
            try:
                print("🔄 Switching to yahoo_fin backup for EU-ETS...")
                eu_df_backup = si.get_data("FCO2.DE", start_date=start_date, end_date=end_date)
                eu_series = eu_df_backup['close']
                print("✅ yahoo_fin success!")
            except Exception as e:
                print(f"⚠️ yahoo_fin EU failed: {e}")

        # ==========================================
        # 🇰🇷 2. K-ETS (Korean Carbon Permits)
        # ==========================================
        kr_series = pd.Series(dtype=float)
        
        # [Try 1] FinanceDataReader (KRX KAU)
        try:
            df_krx = fdr.StockListing('KRX')
            kau_list = df_krx[df_krx['Name'].str.contains('KAU', case=False, na=False)]
            
            if not kau_list.empty:
                # Use the latest ticker
                target_code = kau_list.sort_values(by='Symbol').iloc[-1]['Symbol']
                kr_df = fdr.DataReader(target_code, start=start_date, end=end_date)
                if not kr_df.empty:
                    kr_series = kr_df['Close']
        except:
            pass
            
        # [Try 2] KODEX ETF (Backup) - yfinance
        if kr_series.empty:
            try:
                # 400590.KS: KODEX Carbon Output Future
                kr_df = yf.download("400590.KS", start=start_date, end=end_date, progress=False, timeout=5)
                if not kr_df.empty:
                    if isinstance(kr_df.columns, pd.MultiIndex):
                        kr_series = kr_df['Close'].iloc[:, 0]
                    else:
                        kr_series = kr_df['Close']
                    kr_series = kr_series * 0.9 # Adjustment for ETF deviation
            except:
                pass

        # [Try 3] yahoo_fin (Last Backup for Korea)
        if kr_series.empty:
            try:
                print("🔄 Switching to yahoo_fin backup for K-ETS...")
                kr_df_backup = si.get_data("400590.KS", start_date=start_date, end_date=end_date)
                kr_series = kr_df_backup['close'] * 0.9
            except:
                pass

        # ==========================================
        # 3. Merge & Format
        # ==========================================
        if eu_series.empty and kr_series.empty:
            print("⚠️ All data sources failed. Returning empty list.")
            return []

        df_merge = pd.DataFrame({"EU_ETS": eu_series, "K_ETS": kr_series})
        df_merge.sort_index(inplace=True)
        
        # ✅ 금융 표준: 0.0을 NaN으로 변환 (실제 없는 데이터로 표시)
        df_merge['EU_ETS'] = df_merge['EU_ETS'].replace(0.0, float('nan'))
        
        # ✅ 전일 종가로 채우기 (Forward Fill)
        # 예: 1일(75유로) -> 2일(데이터없음) -> 2일도 75유로로 채움
        df_merge['EU_ETS'] = df_merge['EU_ETS'].ffill()
        
        # ✅ 맨 앞 데이터도 없다면 뒤에서 가져오기 (Backward Fill)
        df_merge['EU_ETS'] = df_merge['EU_ETS'].bfill()
        
        # ✅ 진짜 모든 데이터가 없다면 고정값 (75.5유로)
        # 랜덤보다 일직선이 낫습니다.
        if df_merge['EU_ETS'].isnull().all():
            df_merge['EU_ETS'] = 75.5
            print("⚠️ No EU-ETS data available. Using fixed value: 75.5 EUR")
        
        # K-ETS도 동일하게 처리
        df_merge['K_ETS'] = df_merge['K_ETS'].replace(0.0, float('nan'))
        df_merge['K_ETS'] = df_merge['K_ETS'].ffill().bfill()
        
        # K-ETS 모두 없으면 고정값 (13,000원)
        if df_merge['K_ETS'].isnull().all():
            df_merge['K_ETS'] = 13000
            print("⚠️ No K-ETS data available. Using fixed value: 13,000 KRW")

        result = []
        for date, row in df_merge.iterrows():
            eu_val = row['EU_ETS']
            kr_val = row['K_ETS']
            result.append({
                "date": date.strftime("%Y-%m-%d"),
                "EU-ETS": round(float(eu_val), 2),
                "K-ETS": int(kr_val)
            })
        return result

    async def get_dual_market_history(self, period: str = "1y"):
        """
        Return cached data. Refresh if expired.
        """
        # 1. Load if empty
        if not MarketDataService._cache:
            await self.preload_data()
        
        # 2. Refresh if older than 30 mins
        time_diff = datetime.now() - (MarketDataService._last_updated or datetime.min)
        if time_diff > timedelta(minutes=30): 
            print("🔄 [System] Cache expired. Refreshing market data...")
            # Run in background or wait? For simplicity, await it.
            new_data = await self._fetch_dual_market_data_async(days=1095)
            if new_data:
                MarketDataService._cache = new_data
                MarketDataService._last_updated = datetime.now()

        # 3. Slice based on period
        cached_data = MarketDataService._cache
        days_map = {"1m": 30, "3m": 90, "1y": 365, "all": 1095}
        req_days = days_map.get(period, 365)
        
        if len(cached_data) > req_days:
            return cached_data[-req_days:] 
        return cached_data

    def _get_mock_market_history(self, days=365):
        """Returns realistic fixed data to avoid API hits."""
        end_date = datetime.now()
        result = []
        for i in range(days):
            curr_date = end_date - timedelta(days=days - i)
            result.append({
                "date": curr_date.strftime("%Y-%m-%d"),
                "EU-ETS": round(75.5 + (i * 0.05) % 5, 2), # Minor fluctuation
                "K-ETS": 13000 + (i * 100) % 1000
            })
        return result

    def get_carbon_price_krx(self):
        """Current KRX price (Simple fallback logic)"""
        try:
            # Try getting recent K-ETS price first from cache or FDR
            if MarketDataService._cache:
                 last_item = MarketDataService._cache[-1]
                 if last_item["K-ETS"] > 0:
                     return {"price": float(last_item["K-ETS"]), "unit": "KRW", "source": "Cached"}
            
            # Fallback to direct ETF fetch
            df = fdr.DataReader('400590', datetime.now() - timedelta(days=7))
            if not df.empty:
                return {"price": float(df['Close'].iloc[-1]), "unit": "KRW", "source": "KRX_ETF"}
                
            return {"price": 10500.0, "unit": "KRW", "source": "Fallback_Fixed"}
        except:
            return {"price": 10500.0, "unit": "KRW", "source": "Fallback_Error"}

market_service = MarketDataService()
