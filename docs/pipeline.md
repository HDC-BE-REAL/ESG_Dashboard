# ESG PDF 파이프라인 가이드

## 🚀 파이프라인 통합 실행 (`src/run_pipeline.py`)

전체 추출 및 적재 과정을 한 번에 실행하는 **Orchestrator 스크립트**를 사용하는 것을 권장합니다.

```bash
# 기본 실행 (추출 -> DB 적재)
python src/run_pipeline.py --pdf data/input/2023_HDEC_Report.pdf --pages 1-10 --load-db

# 처음 실행 시 DB 초기화 포함
python src/run_pipeline.py --pdf data/input/2023_HDEC_Report.pdf --pages 1-10 --load-db --init-db

# GPT 설명 생략 (비용 절약)
python src/run_pipeline.py --pdf data/input/2023_HDEC_Report.pdf --skip-gpt
```

### 주요 옵션
- `--load-db`: 추출 결과를 MySQL 데이터베이스에 적재합니다.
- `--init-db`: DB 테이블을 초기화(생성)합니다. (최초 1회 필요)
- `--skip-sanitize`: PDF 인코딩 보정(Sanitization) 단계를 건너뜁니다.
- `--skip-gpt`: 그림/도식에 대한 GPT 설명을 생성하지 않습니다.

---

## 단계별 상세 (Pipeline Steps)

아래 스크립트들은 `run_pipeline.py`에 의해 순차적으로 실행됩니다. 개별 실행도 가능합니다.

### 0. (자동) PDF 인코딩 보정 (`src/pdf_text_extractor.py`)
- **목적**: 텍스트 인코딩이 깨진 PDF를 감지하여 시각적(Visual) 기반으로 재구축(`*.sanitized.pdf`)합니다.
- 파이프라인은 이 단계가 성공하면 자동으로 보정된 PDF를 후속 단계에 입력으로 전달합니다.

### 1. Docling 기반 구조화 (`src/structured_extract.py`)
- **목적**: 문서를 페이지별 Markdown, 표(JSON), 그림(Image)으로 구조화합니다.
- **주요 기능**:
  - **Token Reduction**: 헤더/푸터 등 반복되는 노이즈를 자동으로 감지하여 제거합니다 (전략 1, 2).
  - **Image Preservation**: `[IMAGE]` 태그를 유지하여 그림 위치를 보존합니다.
- **산출물**: `data/pages_structured/<Report_Name>/page_XXXX/`

### 2. 표 텍스트 추출 (`src/table_ocr.py`)
- **목적**: 정확한 표 데이터 추출을 위해 PDF 텍스트 레이어(`pymupdf`) 또는 이미지 OCR(`rapidocr`)을 사용합니다.
- **기본값**: `pymupdf` (PDF 원본 텍스트 사용으로 숫자 정확도 확보).

### 3. 그림/도식 GPT 설명 (`src/figure_ocr.py`)
- **목적**: 이미지를 GPT-4o-mini에 전달하여 다이어그램 구조와 주요 텍스트를 Markdown 설명으로 변환합니다.
- **최적화**:
  - 페이지 면적 1% 미만 아이콘 Skip.
  - 헤더 영역(상단 12%) 이미지 Skip.

### 4. 표 숫자 검증 (`src/table_diff.py`)
- **목적**: Docling 추출 결과와 RapidOCR 결과의 숫자를 비교하여 누락되거나 잘못된 인식을 감지합니다. (`diff.json` 생성)

### 5. 데이터베이스 적재 (`src/load_to_db.py`)
- **목적**: 구조화된 모든 데이터(텍스트, 표, 그림, 메타데이터)를 RDBMS에 저장합니다.
- **저장되는 데이터**:
  - **`documents`**: 문서 메타정보, 전체 페이지 수.
  - **`pages`**: 페이지별 Markdown 본문, 시각적 밀도.
  - **`doc_tables` / `table_cells`**: 표 정보 및 정규화된 셀 데이터(숫자, 단위 자동 파싱).
  - **`doc_figures`**: 그림 캡션 및 GPT 설명.
