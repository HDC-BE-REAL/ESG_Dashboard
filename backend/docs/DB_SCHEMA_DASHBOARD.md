# Dashboard Database Schema

대시보드/시뮬레이터 조회용 스키마 정리 문서입니다.

---

## 1. 설계 목적

- 조회 단순화: 프론트에서 조인 없이 회사 단위 데이터를 바로 사용
- 이원화 지원: 일반 탭(총량)과 시뮬레이터(국내/해외 분리) 동시 지원
- 확장성: PDF 추출 결과를 누적 반영 가능한 구조

데이터 흐름:

```text
PDF 추출(table_cells 등) -> 정제/패치 -> dashboard_emissions 저장 -> API(/companies) 제공
```

---

## 2. 테이블 구성

```text
[원본/정규화]
documents, pages, doc_tables, table_cells, doc_figures

[조회/서비스]
dashboard_emissions        # 회사/연도별 배출·재무 통합
industry_benchmarks        # Compare 기준선(top10/median)
pdf_extraction_logs        # 추출 이력
```

---

## 3. `dashboard_emissions` (핵심)

한 Row = 한 회사의 한 연도 데이터.

### 3.1 핵심 컬럼

| 그룹 | 컬럼 | 설명 |
|---|---|---|
| 식별 | `company_id`, `company_name`, `year` | 회사/연도 키 |
| 총 배출량 | `scope1`, `scope2`, `scope3` | 일반 탭(Dashboard/Compare/Target) 기준값 |
| 지역 분리(옵션) | `s1_domestic`, `s2_domestic`, `s3_domestic`, `s1_abroad`, `s2_abroad`, `s3_abroad` | 시뮬레이터 국내/해외 분리 계산용 |
| 할당/재무 | `allowance`, `revenue` | 무상할당, 매출 |
| 집약도 | `energy_intensity`, `carbon_intensity`, `carbon_intensity_scope1/2/3` | 비교/KPI 계산 |
| 목표/기준 | `base_year`, `base_emissions`, `target_reduction_pct` | Target 탭 기준 |
| 메타 | `source_doc_id`, `data_source`, `extraction_method`, `is_verified`, `created_at`, `updated_at` | 출처/이력 |

### 3.2 사용 규칙(중요)

- 일반 탭(Dashboard/Compare/Target): `scope1/2/3` 또는 API에서 합산된 `s1/s2/s3` 사용
- Simulator Step1(국내): `s1_domestic + s2_domestic` 우선
  - 국내 컬럼이 비어 있으면 fallback으로 `scope1 + scope2` 사용
- Simulator Step3(해외): `s1_abroad + s2_abroad` 사용

### 3.3 인덱스 권장

```sql
CREATE INDEX idx_dashboard_company ON dashboard_emissions(company_id);
CREATE INDEX idx_dashboard_year ON dashboard_emissions(year);
CREATE INDEX idx_dashboard_company_year ON dashboard_emissions(company_id, year);
```

---

## 4. `industry_benchmarks`

Compare 탭 기준선 테이블.

| 컬럼 | 설명 |
|---|---|
| `industry`, `year` | 업종/연도 |
| `carbon_intensity_top10`, `carbon_intensity_median`, `carbon_intensity_avg` | 탄소 집약도 기준선 |
| `energy_intensity_top10`, `energy_intensity_median`, `energy_intensity_avg` | 에너지 집약도 기준선 |

---

## 5. `pdf_extraction_logs`

추출 파이프라인 이력/모니터링.

| 컬럼 | 설명 |
|---|---|
| `file_name`, `file_hash`, `file_size` | 입력 파일 정보 |
| `extraction_method`, `extracted_fields`, `extracted_data` | 추출 결과 |
| `status`, `error_message` | 성공/실패 상태 |
| `started_at`, `completed_at`, `duration_seconds` | 처리 시간 |

---

## 6. API 매핑

`GET /api/v1/dashboard/companies` 응답에서 사용되는 대표 필드:

- 총량: `s1`, `s2`, `s3`
- 지역 분리: `s1Domestic`, `s2Domestic`, `s1Overseas`, `s2Overseas`
- 보조: `allowance`, `revenue`, `energy_intensity`, `carbon_intensity_scope1/2/3`, `history[]`

---

## 7. 검증 쿼리 예시

### 7.1 회사 최신 레코드

```sql
SELECT *
FROM dashboard_emissions
WHERE company_name = '현대건설'
ORDER BY year DESC
LIMIT 1;
```

### 7.2 국내/해외 분리값 확인

```sql
SELECT year, company_name,
       scope1, scope2,
       s1_domestic, s2_domestic,
       s1_abroad, s2_abroad,
       allowance
FROM dashboard_emissions
WHERE company_name = '현대건설'
ORDER BY year DESC;
```

### 7.3 시뮬레이터용 순노출량 점검(국내 기준)

```sql
SELECT year,
       COALESCE(s1_domestic, scope1) + COALESCE(s2_domestic, scope2) AS domestic_s1s2,
       allowance,
       GREATEST(0, (COALESCE(s1_domestic, scope1) + COALESCE(s2_domestic, scope2)) - allowance) AS net_exposure_est
FROM dashboard_emissions
WHERE company_name = '현대건설'
ORDER BY year DESC;
```

---

## 8. 참고

- 실제 프론트 계산식은 `frontend/src/features/시뮬레이터/SimulatorTab.tsx` 기준
- API 조합 로직은 `backend/app/routers/dashboard.py` 기준
