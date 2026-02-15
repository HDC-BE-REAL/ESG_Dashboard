
import asyncio
import os
import sys

# Add current directory (project root) to sys.path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from backend.app.services.market_data import market_service
from backend.app.services.oil_price import oil_price_service
from backend.app.config import settings

async def verify_mock_mode():
    print(f"Current USE_MOCK_DATA setting: {settings.USE_MOCK_DATA}")
    
    if not settings.USE_MOCK_DATA:
        print("❌ Mock mode is not enabled in settings. Please check config.py or .env")
        return

    print("\n1. Testing MarketDataService (EU-ETS, K-ETS)...")
    data = await market_service.get_dual_market_history(period="1m")
    if data and "EU-ETS" in data[0] and "K-ETS" in data[0]:
        print(f"✅ Market Data Received: {len(data)} items")
        print(f"Sample: {data[0]}")
    else:
        print("❌ Failed to receive market data")

    print("\n2. Testing OilPriceService (WTI, Brent)...")
    oil = await oil_price_service.get_latest_prices()
    if oil and "price" in oil:
        print(f"✅ Oil Price Received: {oil.get('price')} {oil.get('currency')}")
        print(f"Full Response: {oil}")
    else:
        print("❌ Failed to receive oil price data")

    print("\n🎉 Verification Complete!")

if __name__ == "__main__":
    asyncio.run(verify_mock_mode())
