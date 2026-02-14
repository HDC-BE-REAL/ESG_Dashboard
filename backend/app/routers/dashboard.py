from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import DashboardEmission, IndustryBenchmark
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["dashboard"]
)

class CompanyResponse(BaseModel):
    id: int
    name: int | str  
    name: str 
    base_emissions: Optional[float] = None
    
    s1: float
    s2: float
    s3: float
    allowance: float = 0 # Default to 0 since removed from DB
    revenue: float
    history: List[dict] = []
    
    class Config:
        from_attributes = True

@router.get("/companies", response_model=List[dict])
def get_companies(db: Session = Depends(get_db)):
    # [수정] 모든 연도 데이터 조회하여 history 구성
    emissions = db.query(DashboardEmission).order_by(DashboardEmission.company_id, DashboardEmission.year).all()

    # 회사별 그룹핑
    companies = {}
    for e in emissions:
        if e.company_id not in companies:
            companies[e.company_id] = {
                "id": e.company_id,
                "name": e.company_name,
                "dartCode": None,
                "baseEmissions": 0,
                "investCapex": 0,
                "targetSavings": 0,
                "s1": 0, "s2": 0, "s3": 0,
                "allowance": 0,
                "revenue": 0,
                "production": 0,
                "energy_intensity": 0,
                "carbon_intensity": 0,
                # [추가] DB의 탄소 집약도 값 전달
                "carbon_intensity_scope1": 0,
                "carbon_intensity_scope2": 0,
                "carbon_intensity_scope3": 0,
                "history": []
            }

        # [수정] history에 탄소 집약도 값도 포함
        companies[e.company_id]["history"].append({
            "year": e.year,
            "s1": e.scope1 or 0,
            "s2": e.scope2 or 0,
            "s3": e.scope3 or 0,
            "revenue": e.revenue or 0,
            "carbon_intensity_scope1": e.carbon_intensity_scope1 or 0,
            "carbon_intensity_scope2": e.carbon_intensity_scope2 or 0,
            "carbon_intensity_scope3": e.carbon_intensity_scope3 or 0
        })

        # 최신 데이터 설정 (2024년 우선, 없으면 가장 최신 연도)
        if e.year == 2024:
            companies[e.company_id].update({
                "baseEmissions": e.base_emissions,
                "s1": e.scope1 or 0,
                "s2": e.scope2 or 0,
                "s3": e.scope3 or 0,
                "revenue": e.revenue or 0,
                "energy_intensity": e.energy_intensity or 0,
                "carbon_intensity": e.carbon_intensity or 0,
                # [추가] DB의 탄소 집약도 값
                "carbon_intensity_scope1": e.carbon_intensity_scope1 or 0,
                "carbon_intensity_scope2": e.carbon_intensity_scope2 or 0,
                "carbon_intensity_scope3": e.carbon_intensity_scope3 or 0
            })
        elif companies[e.company_id]["s1"] == 0:
            # 2024년 데이터 없으면 fallback
            companies[e.company_id].update({
                "baseEmissions": e.base_emissions,
                "s1": e.scope1 or 0,
                "s2": e.scope2 or 0,
                "s3": e.scope3 or 0,
                "revenue": e.revenue or 0,
                "energy_intensity": e.energy_intensity or 0,
                "carbon_intensity": e.carbon_intensity or 0,
                "carbon_intensity_scope1": e.carbon_intensity_scope1 or 0,
                "carbon_intensity_scope2": e.carbon_intensity_scope2 or 0,
                "carbon_intensity_scope3": e.carbon_intensity_scope3 or 0
            })

    return list(companies.values())

@router.get("/benchmarks")
def get_benchmarks(db: Session = Depends(get_db)):
    # [Change] Use 2024 as the default year
    benchmarks = db.query(IndustryBenchmark).filter(IndustryBenchmark.year == 2024).all()
    # Frontend expects: { revenue: { top10, median }, production: { top10, median } }
    
    data = {}
    for b in benchmarks:
        if b.industry == '건설업': # Hardcoded for now based on App.tsx context
             return {
                 "revenue": { "top10": b.intensity_revenue_top10, "median": b.intensity_revenue_median },
                 "production": { "top10": b.intensity_production_top10, "median": b.intensity_production_median }
             }
    return { "revenue": { "top10": 0, "median": 0 }, "production": { "top10": 0, "median": 0 } }
