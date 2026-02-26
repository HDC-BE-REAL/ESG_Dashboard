import asyncio
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import DashboardEmission

async def main():
    db = SessionLocal()
    records = db.query(DashboardEmission).all()
    companies = {}
    for r in records:
        if r.company_name not in companies:
            companies[r.company_name] = []
        companies[r.company_name].append({"year": r.year, "s1": r.scope1, "s2": r.scope2})
    
    for c, hist in companies.items():
        hist.sort(key=lambda x: x["year"])
        print(f"{c}: {hist}")

if __name__ == "__main__":
    asyncio.run(main())

