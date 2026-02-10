# Dashboard Database Schema

대시보드 조회 전용 데이터베이스 스키마 설계 문서

---

## 📋 개요

### 설계 목적
- **빠른 조회**: 프론트엔드에서 조인 없이 한 쿼리로 모든 데이터 조회
- **간단한 구조**: PDF 추출 데이터를 대시보드용으로 통합 저장
- **확장성**: 추후 필드 추가 용이

### 데이터 흐름
```
PDF → table_cells 파싱 → dashboard_emissions 저장 → 프론트엔드 조회
```

---

## 🗂️ 테이블 구조

### 전체 테이블 목록

```
[기존] PDF 추출/저장용 (정규화) - 건드리지 않음
├── documents
├── pages
├── doc_tables
├── table_cells
└── doc_figures

[신규] 대시보드 조회용 (비정규화)
├── dashboard_emissions ⭐ 메인 테이블
├── industry_benchmarks
└── pdf_extraction_logs
```

---

## 📊 1. dashboard_emissions (메인 테이블)

**용도:** 대시보드 조회 전용 통합 데이터
**구조:** 한 ROW = 한 기업의 한 연도 모든 데이터

### 스키마

| Field | Type | Null | Key | Description |
|-------|------|------|-----|-------------|
| `id` | INT | NO | PRI | 자동 증가 ID |
| `company_id` | INT | NO | MUL | 기업 ID |
| `company_name` | VARCHAR(100) | NO | MUL | 기업명 (현대건설, 삼성물산) |
| `year` | INT | NO | MUL | 데이터 연도 |
| **배출량 데이터** |
| `scope1` | FLOAT | YES | | Scope 1 직접 배출량 (tCO2e) |
| `scope2` | FLOAT | YES | | Scope 2 간접 배출량 (tCO2e) |
| `scope3` | FLOAT | YES | | Scope 3 밸류체인 배출량 (tCO2e) |
| **K-ETS 할당량** |
| `allowance` | FLOAT | YES | | 무상 할당량 (tCO2e) |
| **재무/사업 데이터** |
| `revenue` | BIGINT | YES | | 매출액 (원) |
| **집약도 지표** |
| `energy_intensity` | FLOAT | YES | | 에너지 사용 집약도 (TJ/매출 1억원) |
| `carbon_intensity` | FLOAT | YES | | 탄소 집약도 (tCO2e/매출 1억원) |
| **감축 목표** |
| `target_reduction_pct` | FLOAT | YES | | 목표 감축률 (%) |
| `base_year` | INT | YES | | 기준년도 (예: 2021) |
| `base_emissions` | FLOAT | YES | | 기준년도 배출량 (tCO2e) |
| **데이터 출처** |
| `source_doc_id` | INT | YES | | 원본 문서 ID (documents 참조) |
| `data_source` | VARCHAR(500) | YES | | PDF 파일명 등 |
| `extraction_method` | VARCHAR(50) | YES | | regex/gpt_text/gpt_vision |
| `is_verified` | BOOLEAN | YES | | 제3자 검증 여부 |
| **메타데이터** |
| `notes` | TEXT | YES | | 비고 |
| `created_at` | DATETIME | YES | | 생성일시 |
| `updated_at` | DATETIME | YES | | 수정일시 |

### 인덱스

```sql
CREATE INDEX idx_company ON dashboard_emissions(company_id);
CREATE INDEX idx_company_name ON dashboard_emissions(company_name);
CREATE INDEX idx_year ON dashboard_emissions(year);
CREATE INDEX idx_company_year ON dashboard_emissions(company_id, year);
```

### 샘플 데이터

```sql
INSERT INTO dashboard_emissions VALUES (
    1,              -- id
    1,              -- company_id
    '현대건설',      -- company_name
    2025,           -- year
    75000,          -- scope1
    45000,          -- scope2
    130684,         -- scope3
    100000,         -- allowance
    17500000000000, -- revenue (17.5조)
    0.82,           -- energy_intensity (TJ/매출 1억원)
    0.69,           -- carbon_intensity (tCO2e/매출 1억원) - 자동 계산
    12.5,           -- target_reduction_pct
    2021,           -- base_year
    250684,         -- base_emissions
    2,              -- source_doc_id
    '2025_HDEC_Report.pdf', -- data_source
    'gpt_vision',   -- extraction_method
    FALSE,          -- is_verified
    NULL,           -- notes
    NOW(),          -- created_at
    NOW()           -- updated_at
);
```

---

## 📈 2. industry_benchmarks

**용도:** 업계 벤치마크 데이터 (대시보드 비교 분석용)

### 스키마

| Field | Type | Null | Key | Description |
|-------|------|------|-----|-------------|
| `id` | INT | NO | PRI | 자동 증가 ID |
| `industry` | VARCHAR(100) | NO | MUL | 업종 (건설업, 제조업) |
| `year` | INT | NO | MUL | 기준년도 |
| **매출 대비 집약도** |
| `intensity_revenue_top10` | FLOAT | YES | | Top 10% (tCO2e/매출1억) |
| `intensity_revenue_median` | FLOAT | YES | | 중앙값 |
| `intensity_revenue_avg` | FLOAT | YES | | 평균 |
| **생산량 대비 집약도** |
| `intensity_production_top10` | FLOAT | YES | | Top 10% (tCO2e/생산1000) |
| `intensity_production_median` | FLOAT | YES | | 중앙값 |
| `intensity_production_avg` | FLOAT | YES | | 평균 |
| `created_at` | DATETIME | YES | | 생성일시 |
| `updated_at` | DATETIME | YES | | 수정일시 |

### 샘플 데이터

```sql
INSERT INTO industry_benchmarks VALUES (
    1,          -- id
    '건설업',    -- industry
    2025,       -- year
    15.2,       -- intensity_revenue_top10
    22.5,       -- intensity_revenue_median
    25.0,       -- intensity_revenue_avg
    65.0,       -- intensity_production_top10
    92.4,       -- intensity_production_median
    100.0,      -- intensity_production_avg
    NOW(),      -- created_at
    NOW()       -- updated_at
);
```

---

## 📄 3. pdf_extraction_logs

**용도:** PDF 데이터 추출 이력 (모니터링/디버깅)

### 스키마

| Field | Type | Null | Key | Description |
|-------|------|------|-----|-------------|
| `id` | INT | NO | PRI | 자동 증가 ID |
| `company_id` | INT | YES | | 기업 ID |
| `company_name` | VARCHAR(100) | YES | | 기업명 |
| **파일 정보** |
| `file_name` | VARCHAR(255) | NO | | PDF 파일명 |
| `file_path` | VARCHAR(500) | YES | | 파일 경로 |
| `file_hash` | VARCHAR(64) | YES | MUL | SHA-256 해시 |
| `file_size` | INT | YES | | 파일 크기 (bytes) |
| **추출 정보** |
| `extraction_method` | VARCHAR(50) | YES | | regex/gpt_text/gpt_vision |
| `extracted_fields` | TEXT | YES | | 추출 필드 목록 (JSON) |
| `extracted_data` | TEXT | YES | | 추출 원본 데이터 (JSON) |
| **상태** |
| `status` | VARCHAR(20) | YES | MUL | pending/success/failed |
| `error_message` | TEXT | YES | | 오류 메시지 |
| **처리 시간** |
| `started_at` | DATETIME | YES | | 시작 시각 |
| `completed_at` | DATETIME | YES | | 완료 시각 |
| `duration_seconds` | FLOAT | YES | | 처리 시간 (초) |
| `created_at` | DATETIME | YES | | 생성일시 |

---

## 🔍 주요 쿼리 예시

### 1. 특정 기업의 최신 데이터 조회

```sql
SELECT *
FROM dashboard_emissions
WHERE company_name = '현대건설'
ORDER BY year DESC
LIMIT 1;
```

### 2. 특정 연도 전체 기업 데이터 조회

```sql
SELECT
    company_name,
    scope1, scope2, scope3,
    allowance,
    revenue,
    energy_intensity,
    carbon_intensity
FROM dashboard_emissions
WHERE year = 2025
ORDER BY company_name;
```

### 3. 연도별 배출량 추이 조회

```sql
SELECT
    year,
    scope1, scope2, scope3,
    (scope1 + scope2) as total_scope12
FROM dashboard_emissions
WHERE company_id = 1
ORDER BY year;
```

### 4. 매출 집약도 계산 및 벤치마크 비교

```sql
SELECT
    e.company_name,
    e.year,
    (e.scope1 + e.scope2) / (e.revenue / 100000000) as intensity_revenue,
    b.intensity_revenue_top10,
    b.intensity_revenue_median
FROM dashboard_emissions e
LEFT JOIN industry_benchmarks b
    ON e.year = b.year AND b.industry = '건설업'
WHERE e.year = 2025;
```

### 5. 배출권 부족분 계산

```sql
SELECT
    company_name,
    year,
    (scope1 + scope2) as total_emissions,
    allowance,
    GREATEST(0, (scope1 + scope2) - allowance) as liability
FROM dashboard_emissions
WHERE year = 2025;
```

---

## 📦 ORM 모델 (SQLAlchemy)

### DashboardEmission 클래스

```python
from sqlalchemy import Column, Integer, BigInteger, String, Float, Text, Boolean, DateTime
from sqlalchemy.sql import func
from .database import Base

class DashboardEmission(Base):
    """대시보드 조회 전용 통합 테이블"""
    __tablename__ = "dashboard_emissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, nullable=False, index=True)
    company_name = Column(String(100), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)

    # 배출량
    scope1 = Column(Float, default=0)
    scope2 = Column(Float, default=0)
    scope3 = Column(Float, default=0)
    allowance = Column(Float, default=0)

    # 재무
    revenue = Column(BigInteger)

    # 집약도
    energy_intensity = Column(Float, comment="에너지 사용 집약도 (TJ/매출 1억원)")
    carbon_intensity = Column(Float, comment="탄소 집약도 (tCO2e/매출 1억원)")

    # 목표
    target_reduction_pct = Column(Float)
    base_year = Column(Integer)
    base_emissions = Column(Float)

    # 메타
    source_doc_id = Column(Integer)
    data_source = Column(String(500))
    extraction_method = Column(String(50))
    is_verified = Column(Boolean, default=False)
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    @property
    def total_scope12(self) -> float:
        """Scope 1+2 합계"""
        return (self.scope1 or 0) + (self.scope2 or 0)

    @property
    def intensity_revenue(self) -> float:
        """매출 집약도 (tCO2e / 매출 1억원)"""
        if not self.revenue:
            return 0
        return self.total_scope12 / (self.revenue / 100000000)

    @property
    def liability(self) -> float:
        """배출권 부족분"""
        return max(0, self.total_scope12 - (self.allowance or 0))
```

---

## 🚀 테이블 생성 및 초기화

### 1. 테이블 생성

```bash
cd backend/app
python init_db.py create
```

### 2. 샘플 데이터 삽입

```bash
python init_db.py seed
```

### 3. 전체 리셋 (개발용)

```bash
python init_db.py reset
```

### 4. 데이터 확인

```bash
python init_db.py show
```

---

## 📊 데이터 관리 전략

### UPSERT 전략

```python
from sqlalchemy.dialects.mysql import insert

def upsert_emission_data(db, data: dict):
    """기존 데이터 있으면 업데이트, 없으면 삽입"""
    stmt = insert(DashboardEmission).values(
        company_id=data['company_id'],
        company_name=data['company_name'],
        year=data['year'],
        scope1=data['s1'],
        scope2=data['s2'],
        scope3=data['s3'],
        # ... 기타 필드
    )

    # 중복 시 업데이트
    stmt = stmt.on_duplicate_key_update(
        scope1=stmt.inserted.scope1,
        scope2=stmt.inserted.scope2,
        scope3=stmt.inserted.scope3,
        updated_at=func.now()
    )

    db.execute(stmt)
    db.commit()
```

### 데이터 검증

```python
def validate_emission_data(data: dict) -> bool:
    """필수 필드 검증"""
    required = ['company_name', 'year', 'scope1', 'scope2']

    for field in required:
        if field not in data or data[field] is None:
            print(f"❌ 필수 필드 누락: {field}")
            return False

    return True
```

---

## 🔄 마이그레이션 계획

### Phase 1: 테이블 생성
- ✅ dashboard_emissions 테이블 생성
- ✅ industry_benchmarks 테이블 생성
- ✅ pdf_extraction_logs 테이블 생성

### Phase 2: 데이터 마이그레이션
- ⏳ table_cells → dashboard_emissions 변환
- ⏳ emission_extractor 연동
- ⏳ 기존 emission_summary 데이터 이전

### Phase 3: API 개발
- ⏳ FastAPI 엔드포인트 구현
- ⏳ 프론트엔드 연동
- ⏳ 실시간 데이터 업데이트

---

## 📝 변경 이력

### 2026-02-09
- ✅ 대시보드 전용 스키마 설계 완료
- ✅ dashboard_emissions 테이블 정의
- ✅ SQLAlchemy 모델 구현
- ✅ 초기화 스크립트 작성

---

## 📚 참고 문서

- **PDF 추출 스키마**: [PDF_Extraction/docs/DB_SCHEMA.md](../../PDF_Extraction/docs/DB_SCHEMA.md)
- **Emission Extractor 가이드**: [EMISSION_EXTRACTOR_GUIDE.md](EMISSION_EXTRACTOR_GUIDE.md)
- **구현 계획**: [../../Implementation_Plan.md](../../Implementation_Plan.md)
