from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import DashboardEmission
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["dashboard"]
)

class CompanyResponse(BaseModel):
    id: int
    name: str 
    base_emissions: Optional[float] = None
    
    s1: float
    s2: float
    s3: float
    allowance: Optional[float] = None  # 🌟 DB에 있는 진짜 값을 그대로 가져옵니다!
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
                "allowance": e.allowance or 0,
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
                "carbon_intensity_scope3": e.carbon_intensity_scope3 or 0,
                "allowance": e.allowance or 0
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
                "carbon_intensity_scope3": e.carbon_intensity_scope3 or 0,
                "allowance": e.allowance or 0
            })

    return list(companies.values())

class CompareInsightRequest(BaseModel):
    my_company: str
    intensity_type: str
    my_intensity: float
    median_intensity: float
    top10_intensity: float
    best_company: str
    is_better_than_median: bool

@router.post("/compare/insight")
async def get_compare_insight(req: CompareInsightRequest):
    try:
        from ..services.ai_service import ai_service
        insight = await ai_service.generate_compare_insight(
            my_company=req.my_company,
            intensity_type=req.intensity_type,
            my_intensity=req.my_intensity,
            median_intensity=req.median_intensity,
            top10_intensity=req.top10_intensity,
            best_company=req.best_company,
            is_better_than_median=req.is_better_than_median
        )
        return {"insight": insight}
    except Exception as e:
        print(f"Error generating insight: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate insight")
