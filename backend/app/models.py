"""
ESG Dashboard Database Models
기존 PDF 추출 테이블 외에 대시보드 조회 전용 통합 테이블 정의
"""

from sqlalchemy import Column, Integer, BigInteger, String, Float, Boolean, DateTime
from sqlalchemy.sql import func

try:
    from .database import Base
except ImportError:
    from database import Base


# ============================================================================
# 대시보드 조회 전용 통합 테이블 (비정규화)
# ============================================================================

class DashboardEmission(Base):
    """
    대시보드 조회 전용 통합 테이블

    - 목적: 프론트엔드에서 조인 없이 한 번에 모든 데이터 조회
    - 데이터 흐름: PDF 추출 → table_cells 파싱 → 이 테이블에 집계/저장
    - 특징: 연도별로 한 기업의 모든 지표를 한 ROW에 저장
    """
    __tablename__ = "dashboard_emissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, nullable=False, index=True, comment="기업 ID (별도 companies 테이블 참조 가능)")
    company_name = Column(String(100), nullable=False, index=True, comment="기업명 (현대건설, 삼성물산 등)")
    year = Column(Integer, nullable=False, index=True, comment="데이터 연도")

    # ==================== 배출량 데이터 ====================
    scope1 = Column(Float, default=0, comment="Scope 1 직접 배출량 (tCO2e)")
    scope2 = Column(Float, default=0, comment="Scope 2 간접 배출량 - 전력 등 (tCO2e)")
    scope3 = Column(Float, default=0, comment="Scope 3 밸류체인 배출량 (tCO2e)")

    # ==================== 재무/사업 데이터 ====================
    revenue = Column(BigInteger, comment="매출액 (원)")

    # ==================== 집약도 지표 ====================
    energy_intensity = Column(Float, comment="에너지 사용 집약도 (TJ/매출 1억원)")
    carbon_intensity = Column(Float, comment="탄소 집약도 총량 (tCO2e/매출 1억원) = (S1+S2)/매출")
    carbon_intensity_scope1 = Column(Float, comment="Scope 1 탄소 집약도 (tCO2e/매출 1억원)")
    carbon_intensity_scope2 = Column(Float, comment="Scope 2 탄소 집약도 (tCO2e/매출 1억원)")
    carbon_intensity_scope3 = Column(Float, comment="Scope 3 탄소 집약도 (tCO2e/매출 1억원)")

    # ==================== 감축 목표 ====================
    base_year = Column(Integer, comment="기준년도 (예: 2021)")
    base_emissions = Column(Float, comment="기준년도 배출량 (tCO2e)")

    # ==================== 데이터 출처 (추적용) ====================
    source_doc_id = Column(Integer, comment="원본 문서 ID (documents 테이블 참조)")
    data_source = Column(String(500), comment="데이터 출처 (PDF 파일명 등)")
    extraction_method = Column(String(50), comment="추출 방식 (regex/gpt_text/gpt_vision/manual)")
    is_verified = Column(Boolean, default=False, comment="제3자 검증 여부")

    # ==================== 메타데이터 ====================
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Unique constraint: 한 기업의 한 연도는 하나의 row만
    __table_args__ = (
        {'comment': '대시보드 조회 전용 통합 배출량/재무 데이터 (비정규화)'},
    )

    @property
    def total_scope12(self) -> float:
        """Scope 1+2 합계"""
        return (self.scope1 or 0) + (self.scope2 or 0)

    @property
    def total_all_scopes(self) -> float:
        """전체 Scope 합계"""
        return (self.scope1 or 0) + (self.scope2 or 0) + (self.scope3 or 0)

    def calculate_carbon_intensities(self) -> dict:
        """탄소 집약도 계산 (저장용 - 모든 scope별)"""
        if not self.revenue or self.revenue == 0:
            return {
                'carbon_intensity': 0,
                'carbon_intensity_scope1': 0,
                'carbon_intensity_scope2': 0,
                'carbon_intensity_scope3': 0
            }
        
        revenue_100m = self.revenue / 100000000
        return {
            'carbon_intensity': self.total_scope12 / revenue_100m,
            'carbon_intensity_scope1': (self.scope1 or 0) / revenue_100m,
            'carbon_intensity_scope2': (self.scope2 or 0) / revenue_100m,
            'carbon_intensity_scope3': (self.scope3 or 0) / revenue_100m
        }

