# Emission Extractor 사용 가이드

ESG 보고서에서 온실가스 배출량 데이터를 자동으로 추출하는 도구입니다.

## 📋 목차

1. [개요](#개요)
2. [추출 방식](#추출-방식)
3. [사용법](#사용법)
4. [비용 및 성능](#비용-및-성능)
5. [API 레퍼런스](#api-레퍼런스)

---

## 개요

### 추출 데이터
- **Scope 1**: 직접 온실가스 배출량 (tCO2e)
- **Scope 2**: 간접 온실가스 배출량 (tCO2e)
- **Scope 3**: 기타 간접 배출량 (tCO2e)
- **연도별 배출량**: 과거 연도별 Scope 1+2 데이터
- **연도별 Scope 3**: 과거 연도별 Scope 3 데이터
- **에너지 집약도**: 에너지 사용 집약도 (TJ/매출 1억원) 및 연도별 데이터
- **매출액**: 회사 매출액 (억원)

### 데이터 저장
추출된 데이터는 `dashboard_emissions` 테이블에 저장됩니다.

**DB 스키마:** [DB_SCHEMA_DASHBOARD.md](DB_SCHEMA_DASHBOARD.md) 참조

---

## 추출 방식

### 1️⃣ 정규식 모드 (기본)

**특징:**
- ✅ 빠름 (즉시)
- ✅ 무료
- ❌ 표 형식에 민감함
- ❌ 유연성 낮음

**정확도:** ~80%

**사용 시나리오:**
- 표준화된 보고서 형식
- 빠른 테스트
- 비용 절감

```python
from app.services.emission_extractor import EmissionExtractor

extractor = EmissionExtractor()
data = extractor.extract_for_document(doc_id=2)
```

---

### 2️⃣ GPT 텍스트 분석 모드

**특징:**
- ✅ 유연함 (다양한 형식 대응)
- ✅ 저렴 (~$0.001/회사)
- ⚠️ DB 텍스트 품질에 의존
- ⏱️ 약 5초 소요

**정확도:** ~85%

**사용 시나리오:**
- 다양한 보고서 형식
- Docling 추출 품질이 양호할 때
- 비용과 정확도의 균형

```python
data = extractor.extract_for_document(doc_id=2, use_gpt=True)
```

**내부 동작:**
1. DB의 table_cells에서 텍스트 추출
2. 마크다운 표 형식으로 변환
3. GPT-4o-mini로 분석
4. JSON 파싱 후 반환

---

### 3️⃣ GPT-4V 이미지 분석 모드

**특징:**
- ✅ 가장 정확함 (~95%)
- ✅ Docling 품질과 무관
- ✅ 원본 표 이미지 직접 분석
- ❌ 비용 높음 (~$0.05/회사)
- ⏱️ 약 10초 소요

**정확도:** ~95%

**사용 시나리오:**
- Docling 추출 실패
- 최대 정확도 필요
- 복잡한 표 구조
- 비용 고려 없음

```python
data = extractor.extract_for_document(doc_id=2, use_gpt='vision')
```

**내부 동작:**
1. doc_tables에서 표 이미지 경로 조회
2. 이미지를 base64로 인코딩
3. GPT-4o Vision API 호출
4. 원본 이미지 직접 OCR 및 분석
5. JSON 파싱 후 반환

---

### 4️⃣ 자동 추출 파이프라인 (권장) 🤖

**특징:**
- ✅ 최적의 비용/성능 균형
- ✅ 완전 자동화
- ✅ Rerank 기반 스마트 필터링
- 💰 약 $0.02/회사

**정확도:** ~90%

**사용 시나리오:**
- 프로덕션 환경
- 대량 보고서 처리
- 사람 개입 최소화

```bash
python3 -m app.services.emission_extractor auto
```

**파이프라인 단계:**

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: 이미지 있는 표 수집                              │
│ - doc_tables에서 image_path가 있는 표만 필터링          │
│ - 실제 파일 존재 여부 확인                               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 2: GPT-4o-mini로 관련도 점수 매기기 (Rerank)       │
│ - 각 표 이미지를 저해상도로 스캔                         │
│ - 배출량 데이터 포함 가능성 0-100 점수                  │
│ - 비용: ~$0.002 (17개 표 기준)                          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 3: 상위 후보만 GPT-4o로 정밀 분석                   │
│ - 점수 60점 이상, 최대 5개 표만 선택                     │
│ - GPT-4o Vision으로 고해상도 분석                        │
│ - 비용: ~$0.02 (1개 표 기준)                            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 4: DB 자동 저장                                     │
│ - dashboard_emissions 테이블에 upsert                      │
│ - data_source: 'gpt-vision-auto'                        │
└─────────────────────────────────────────────────────────┘
```

---

## 사용법

### CLI 사용

```bash
cd backend

# 1. 정규식 모드 (기본)
python3 -m app.services.emission_extractor

# 2. GPT 텍스트 모드
python3 -m app.services.emission_extractor gpt

# 3. GPT Vision 모드
python3 -m app.services.emission_extractor vision

# 4. 자동 추출 및 저장 (권장)
python3 -m app.services.emission_extractor auto

# 5. 특정 문서 지정
python3 -m app.services.emission_extractor auto --doc-id=4

# 6. 결과를 DB에 저장
python3 -m app.services.emission_extractor vision --save
```

### Python API 사용

```python
from app.services.emission_extractor import EmissionExtractor

extractor = EmissionExtractor()

# 방법 1: 정규식
data = extractor.extract_for_document(doc_id=2, use_gpt=False)

# 방법 2: GPT 텍스트
data = extractor.extract_for_document(doc_id=2, use_gpt=True)

# 방법 3: GPT Vision
data = extractor.extract_for_document(doc_id=2, use_gpt='vision')

# 방법 4: 자동 추출 및 저장 (권장)
data = extractor.extract_and_save_auto(doc_id=2)

# DB 저장
if data:
    extractor.save_to_dashboard(data)
```

---

## 비용 및 성능

### 비용 비교 (회사당)

| 방식 | OpenAI 비용 | 시간 | 정확도 |
|------|------------|------|--------|
| **정규식** | $0 | 즉시 | ~80% |
| **GPT 텍스트** | ~$0.001 | 5초 | ~85% |
| **GPT Vision** | ~$0.05 | 10초 | ~95% |
| **자동 파이프라인** | ~$0.02 | 15초 | ~90% |

### 비용 세부 내역 (자동 파이프라인)

```
Step 2: GPT-4o-mini 점수 계산 (17개 표)
- 입력: 17 images × 500 tokens = 8,500 tokens
- 출력: 17 × 10 tokens = 170 tokens
- 비용: $0.00128 + $0.00010 = $0.00138

Step 3: GPT-4o Vision 정밀 분석 (1개 표)
- 입력: 1 image (high detail) = ~3,000 tokens
- 출력: ~200 tokens
- 비용: $0.0075 + $0.012 = $0.0195

총 비용: ~$0.02 (약 27원)
```

---

## API 레퍼런스

### `EmissionExtractor.extract_for_document()`

```python
def extract_for_document(
    self,
    doc_id: int,
    use_gpt: Union[bool, str] = False
) -> Dict[str, Any]
```

**파라미터:**
- `doc_id` (int): 문서 ID (documents 테이블)
- `use_gpt` (bool | str): 추출 방식
  - `False`: 정규식 (기본)
  - `True`: GPT 텍스트 분석
  - `'vision'`: GPT-4V 이미지 분석

**반환값:**
```python
{
    'doc_id': 2,
    'company_name': 'HDEC',
    'report_year': 2025,
    'data_year': 2024,
    's1': 137450.0,
    's2': 113234.0,
    's3': 5198461.0,
    'revenue': 326703.0,
    'energy_intensity': 4.48,
    'yearly_emissions': {
        '2021': 296841.0,
        '2022': 384836.0,
        '2023': 363374.0,
        '2024': 250681.0
    },
    'yearly_s3': {
        '2021': 9281746.0,
        '2022': 6658746.0,
        '2023': 5765722.0,
        '2024': 5198461.0
    },
    'yearly_energy_intensity': {
        '2021': 6.12,
        '2022': 7.29,
        '2023': 4.88,
        '2024': 4.48
    },
    'base_year': 2019,
    'base_emissions': 596140.0,
    'source_tables': {
        's1': 151,
        's2': 151,
        's3': 281,
        'revenue': 72,
        'energy': 282
    },
    'data_source': 'auto' | 'gpt' | 'gpt-vision'
}
```

---

### `EmissionExtractor.extract_and_save_auto()`

```python
def extract_and_save_auto(self, doc_id: int) -> Dict[str, Any]
```

**파라미터:**
- `doc_id` (int): 문서 ID

**반환값:**
- 추출 성공: 데이터 딕셔너리 (위와 동일)
- 추출 실패: `None`

**특징:**
- 자동으로 DB에 저장
- Rerank 기반 스마트 필터링
- 최적의 비용/성능 균형

---

### `EmissionExtractor.save_to_dashboard()`

```python
def save_to_dashboard(self, data: Dict[str, Any]) -> int
```

**파라미터:**
- `data` (dict): `extract_for_document()` 반환값

**반환값:**
- `int`: 영향받은 행 수 (1 또는 0)

**동작:**
- `dashboard_emissions` 테이블에 UPSERT
- 기존 데이터 있으면 업데이트
- 없으면 새로 삽입

---

## 트러블슈팅

### 1. 이미지를 찾을 수 없음

**증상:**
```
[GPT-Vision] Table 151 이미지 없음, 건너뜀
```

**원인:**
- PDF가 부분적으로만 추출됨
- image_path가 DB에 없음
- 파일 경로 불일치

**해결:**
```bash
# PDF 재추출
cd PDF_Extraction
python src/structured_extract.py --pdf data/input/2025_HDEC_Report.pdf

# DB 재로드
python src/load_to_db.py --doc-name "2025_HDEC_Report" --input-dir data/pages_structured
```

### 2. GPT가 데이터를 못 찾음

**증상:**
```
[GPT-Vision] Table 67 추출: {'scope1': None, ...}
```

**원인:**
- 해당 표에 배출량 데이터가 없음
- 표 형식이 너무 복잡함

**해결:**
```python
# 자동 파이프라인 사용 (Rerank로 관련 표만 필터링)
extractor.extract_and_save_auto(doc_id=2)
```

### 3. JSON 파싱 오류

**증상:**
```
[GPT-Vision] JSON 파싱 오류: Expecting value: line 1 column 1
```

**원인:**
- GPT가 JSON 대신 텍스트로 응답
- 프롬프트가 불명확함

**해결:**
- 자동으로 프롬프트에 "JSON만 반환" 강조
- 코드블록 제거 로직 포함

---

## 변경 이력

### 2026-02-09
- ✅ Energy Intensity 연도별 데이터 추출 개선
- ✅ Scope 3 연도별 데이터 추출 개선
- ✅ 불필요 데이터 필드(생산량, 투자액 등) 제거
- ✅ Scope 별 집약도 데이터 추가

### 2025-02-07
- ✅ GPT 텍스트 분석 추가
- ✅ GPT-4V 이미지 분석 추가
- ✅ 자동 추출 파이프라인 추가
- ✅ Rerank 기반 스마트 필터링
- ✅ 비용 최적화

### 2025-02-06
- ✅ 정규식 기반 추출 구현
- ✅ dashboard_emissions 테이블 설계
- ✅ DB 저장 기능

---

## 라이선스

MIT License
