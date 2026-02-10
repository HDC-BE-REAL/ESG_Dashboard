# Emission Extractor - 빠른 시작

ESG 보고서에서 온실가스 배출량을 자동으로 추출하고 대시보드 DB에 저장하는 도구입니다.

---

## 🚀 빠른 시작

### 1. 자동 추출 및 저장 (권장)

```bash
cd backend
python3 -m app.services.emission_extractor auto
```

**동작:**
1. 이미지 있는 표 해당 문서 내 스캔
2. GPT-4o-mini로 관련도 점수 계산
3. 상위 후보만 GPT-4o Vision 정밀 분석
4. `dashboard_emissions` 테이블에 자동 저장

**비용:** ~$0.02/회사 (약 27원)
**시간:** ~15초
**정확도:** ~90%

---

### 2. 다른 추출 방식

```bash
# 정규식 (빠름, 무료, ~80% 정확도)
python3 -m app.services.emission_extractor

# GPT 텍스트 분석 (유연, $0.001, ~85% 정확도)
python3 -m app.services.emission_extractor gpt

# GPT Vision (정확, $0.05, ~95% 정확도)
python3 -m app.services.emission_extractor vision

# 특정 문서 지정
python3 -m app.services.emission_extractor auto --doc-id=4

# DB에 저장
python3 -m app.services.emission_extractor vision --save
```

---

## 📊 추출 데이터

```json
{
  "company_name": "현대건설",
  "report_year": 2025,
  "data_year": 2024,
  "s1": 137450.0,          // Scope 1 배출량 (tCO2e)
  "s2": 113234.0,          // Scope 2 배출량
  "s3": 5198461.0,         // Scope 3 배출량
  "revenue": 326703.0,     // 매출액 (억원)
  "energy_intensity": 4.48, // 에너지 집약도 (TJ/매출 1억원)
  "yearly_emissions": {    // 연도별 Scope 1+2 추이
    "2021": 296841.0,
    "2022": 384836.0,
    "2023": 363374.0,
    "2024": 250681.0
  },
  "yearly_s3": {           // 연도별 Scope 3 추이
    "2021": 9281746.0,
    "2024": 5198461.0
  },
  "base_year": 2019,       // 기준연도
  "base_emissions": 596140.0
}
```

**저장 위치:** `dashboard_emissions` 테이블 (대시보드 조회 전용)

---

## 🗃️ 데이터베이스 구조

### dashboard_emissions 테이블

| Field | Type | Description |
|-------|------|-------------|
| `company_name` | VARCHAR | 기업명 |
| `year` | INT | 데이터 연도 |
| `scope1` | FLOAT | Scope 1 배출량 (tCO2e) |
| `scope2` | FLOAT | Scope 2 배출량 (tCO2e) |
| `scope3` | FLOAT | Scope 3 배출량 (tCO2e) |
| `revenue` | BIGINT | 매출액 (원) |
| `energy_intensity` | FLOAT | 에너지 사용 집약도 (TJ/매출 1억원) |
| `carbon_intensity` | FLOAT | 탄소 집약도 (tCO2e/매출 1억원) |
| `carbon_intensity_scope1` | FLOAT | Scope 1 탄소 집약도 |
| `carbon_intensity_scope2` | FLOAT | Scope 2 탄소 집약도 |
| `carbon_intensity_scope3` | FLOAT | Scope 3 탄소 집약도 |
| `data_source` | VARCHAR | 데이터 출처 (PDF 파일명) |
| `extraction_method` | VARCHAR | 추출 방식 (regex/gpt/vision) |

**상세 스키마:** [docs/DB_SCHEMA_DASHBOARD.md](docs/DB_SCHEMA_DASHBOARD.md)

---

## 🔧 Python API

```python
from app.services.emission_extractor import EmissionExtractor

extractor = EmissionExtractor()

# 방법 1: 자동 추출 및 저장 (권장)
data = extractor.extract_and_save_auto(doc_id=2)

# 방법 2: 수동 추출 후 저장
data = extractor.extract_for_document(doc_id=2, use_gpt='vision')
if data:
    extractor.save_to_dashboard(data)  # dashboard_emissions에 저장
```

---

## 📈 비용 및 성능 비교

| 방식 | 비용 | 시간 | 정확도 | 특징 |
|------|------|------|--------|------|
| **정규식** | $0 | 즉시 | ~80% | 빠름, 무료, 표 형식 민감 |
| **GPT 텍스트** | $0.001 | 5초 | ~85% | 유연, 저렴, DB 품질 의존 |
| **GPT Vision** | $0.05 | 10초 | ~95% | 가장 정확, 비용 높음 |
| **자동 파이프라인** ⭐ | **$0.02** | **15초** | **~90%** | **최적 균형, 권장** |

---

## 💾 DB 초기화

```bash
cd backend/app

# 1. 테이블 생성
python init_db.py create

# 2. 샘플 데이터 삽입
python init_db.py seed

# 3. 전체 리셋 (개발용)
python init_db.py reset

# 4. 데이터 확인
python init_db.py show
```

---

## ⚠️ 문제 해결

### 이미지를 찾을 수 없음
```
[GPT-Vision] Table 151 이미지 없음, 건너뜀
```

**해결:** PDF 재추출 필요
```bash
cd ../PDF_Extraction
python src/structured_extract.py --pdf data/input/2025_HDEC_Report.pdf
python src/load_to_db.py --doc-name "2025_HDEC_Report"
```

### GPT가 데이터를 못 찾음
**해결:** 자동 파이프라인 사용 (Rerank로 관련 표 필터링)
```bash
python3 -m app.services.emission_extractor auto
```

### DB 연결 오류
**확인사항:**
1. MySQL 서버 실행 여부
2. `.env` 파일 설정 확인
3. `backend/app/init_db.py check` 실행

---

## 📚 상세 문서

- **전체 가이드**: [docs/EMISSION_EXTRACTOR_GUIDE.md](docs/EMISSION_EXTRACTOR_GUIDE.md)
- **DB 스키마**: [docs/DB_SCHEMA_DASHBOARD.md](docs/DB_SCHEMA_DASHBOARD.md)
- **구현 계획**: [../Implementation_Plan.md](../Implementation_Plan.md)

---

## 🎯 다음 단계

### 완료 ✅
- [x] 추출 로직 완성 (Regex, GPT Text, GPT Vision)
- [x] 자동 파이프라인 구현 (Rerank 기반)
- [x] DB 스키마 설계 (`dashboard_emissions`)
- [x] 초기화 스크립트 작성
- [x] 데이터 정합성 개선 (연도별 Scope 3, 에너지 집약도)

### 진행 중 ⏳
- [ ] API 엔드포인트 구현 (`/api/emissions`)
- [ ] 프론트엔드 연동
- [ ] 추가 회사 데이터 확보

### 계획 📋
- [ ] 실시간 데이터 업데이트 기능
- [ ] 대시보드 캐싱 최적화
- [ ] 추출 정확도 모니터링

---

**최종 업데이트:** 2026-02-09
**작성자:** ESG Dashboard Team
