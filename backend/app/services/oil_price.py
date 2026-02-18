import httpx
from ..config import settings
from datetime import datetime

class OilPriceService:
    def __init__(self):
        self.api_key = settings.OIL_PRICE_API_KEY
        self.base_url = "https://api.oilpriceapi.com/v1"
        self.headers = {
            "Authorization": f"Token {self.api_key}",
            "Content-Type": "application/json"
        }

    async def get_latest_prices(self):
        """
        최신 유가 정보 (WTI, Brent) 가져오기
        """
        if settings.USE_MOCK_DATA:
            # print("💡 [OilPrice] Mock mode enabled. Returning fallback data.")
            return self._get_fallback_data()
            
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/prices/latest", headers=self.headers)
                if response.status_code == 200:
                    data = response.json()
                    # 유효한 응답 구조일 경우 데이터 파싱
                    # { "status": "success", "data": { "price": ..., "currency": "USD", "commodity": "crude_oil", "type": "brent", ... } }
                    return data.get("data", {})
                else:
                    print(f"Oil Price API Error: {response.status_code}")
                    return self._get_fallback_data()
        except Exception as e:
            print(f"Oil Price Service Exception: {e}")
            return self._get_fallback_data()

    def _get_fallback_data(self):
        """API 오류 시 기본값 반환"""
        return {
            "price": 75.42,
            "currency": "USD",
            "commodity": "crude_oil",
            "type": "brent",
            "unit": "barrel",
            "formatted": "$75.42",
            "created_at": datetime.now().isoformat()
        }

oil_price_service = OilPriceService()
