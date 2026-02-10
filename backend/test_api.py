from fastapi.testclient import TestClient
from app.main import app
import sys

def test_dashboard_api():
    try:
        client = TestClient(app)
        
        print("Testing /api/v1/dashboard/companies...")
        response = client.get('/api/v1/dashboard/companies')
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        else:
            print(f"Error: {response.text}")

        print("\nTesting /api/v1/dashboard/benchmarks...")
        response = client.get('/api/v1/dashboard/benchmarks')
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Test Failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_dashboard_api()
