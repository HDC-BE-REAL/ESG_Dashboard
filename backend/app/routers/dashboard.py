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
    
    class Config:
        orm_mode = True

@router.get("/companies", response_model=List[dict])
def get_companies(db: Session = Depends(get_db)):
    emissions = db.query(DashboardEmission).filter(DashboardEmission.year == 2025).all() 
    
    result = []
    for e in emissions:
        result.append({
            "id": e.company_id,
            "name": e.company_name,
            "dartCode": None,
            "baseEmissions": e.base_emissions,
            "investCapex": 0,
            "targetSavings": 0,
            "s1": e.scope1 or 0,
            "s2": e.scope2 or 0,
            "s3": e.scope3 or 0,
            "allowance": 0, # Removed from DB
            "revenue": e.revenue or 0,
            "production": 0,
            "energy_intensity": e.energy_intensity,
            "carbon_intensity": e.carbon_intensity
        })
    return result

@router.get("/benchmarks")
def get_benchmarks(db: Session = Depends(get_db)):
    benchmarks = db.query(IndustryBenchmark).filter(IndustryBenchmark.year == 2025).all()
    # Frontend expects: { revenue: { top10, median }, production: { top10, median } }
    
    data = {}
    for b in benchmarks:
        if b.industry == '건설업': # Hardcoded for now based on App.tsx context
             return {
                 "revenue": { "top10": b.intensity_revenue_top10, "median": b.intensity_revenue_median },
                 "production": { "top10": b.intensity_production_top10, "median": b.intensity_production_median }
             }
    return { "revenue": { "top10": 0, "median": 0 }, "production": { "top10": 0, "median": 0 } }
