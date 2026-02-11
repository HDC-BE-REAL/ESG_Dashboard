"""
GPT-4V 이미지 분석 기반 배출량 추출
"""
import os
import re
import json
import base64
from pathlib import Path
from typing import Optional, Dict, List
from sqlalchemy import text
from openai import OpenAI
from dotenv import load_dotenv
from ...database import engine

load_dotenv()
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# PDF 추출 결과 경로
STRUCTURED_DATA_PATH = Path(os.getenv("STRUCTURED_DATA_PATH", "../PDF_Extraction/data/pages_structured"))


def get_table_image_path(table_id: int) -> Optional[Path]:
    """표 이미지 경로 조회 및 절대 경로 반환"""
    sql = """
        SELECT dt.image_path, d.filename
        FROM doc_tables dt
        JOIN documents d ON dt.doc_id = d.id
        WHERE dt.id = :table_id
    """
    with engine.connect() as conn:
        result = conn.execute(text(sql), {'table_id': table_id}).fetchone()

    if not result or not result[0]:
        return None

    image_rel_path = result[0]  # 예: "page_0050/tables/table_001.png"
    filename = result[1]  # 예: "2025_HDEC_Report.pdf"

    # 파일명에서 .pdf 제거
    doc_name = filename.replace('.pdf', '')

    # 전체 경로 구성
    abs_path = STRUCTURED_DATA_PATH / doc_name / image_rel_path

    return abs_path if abs_path.exists() else None


def encode_image(image_path: Path) -> str:
    """이미지를 base64로 인코딩"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')


def get_table_texts(table_id: int) -> List[str]:
    """표의 모든 텍스트를 DB에서 가져오기 (옵션 3용)"""
    sql = """
        SELECT DISTINCT content
        FROM table_cells
        WHERE table_id = :table_id
          AND content IS NOT NULL
          AND content != ''
        ORDER BY row_idx, col_idx
    """
    with engine.connect() as conn:
        rows = conn.execute(text(sql), {'table_id': table_id}).fetchall()

    return [row[0].strip() for row in rows if row[0] and row[0].strip()]


def extract_with_gpt_vision(doc_id: int, tables: List[Dict], use_table_texts: bool = False, model: str = "gpt-4o-mini") -> Optional[Dict]:
    """
    GPT-4V를 사용하여 표 이미지 직접 분석

    Args:
        doc_id: 문서 ID
        tables: 분석할 표 목록
        use_table_texts: True면 table_cells의 텍스트를 함께 제공 (옵션 3)
        model: 사용할 모델 ("gpt-4o" 또는 "gpt-4o-mini", 기본값: "gpt-4o-mini")

    Returns:
        추출된 배출량 데이터
    """
    if not tables:
        return None

    result = {'source_tables': {}}

    # 상위 10개 표 처리
    for table in tables[:10]:
        table_id = table['id']

        # 표 이미지 경로 가져오기
        image_path = get_table_image_path(table_id)
        if not image_path or not image_path.exists():
            print(f"[GPT-Vision] Table {table_id} 이미지 없음, 건너뜀")
            continue

        # 이미지를 base64로 인코딩
        try:
            image_base64 = encode_image(image_path)
        except Exception as e:
            print(f"[GPT-Vision] Table {table_id} 이미지 인코딩 오류: {e}")
            continue

        # 프롬프트 선택 (옵션 1: Vision 단독 vs 옵션 3: Vision + 텍스트 리스트)
        if use_table_texts:
            # 옵션 3: table_cells의 텍스트 함께 제공
            table_texts = get_table_texts(table_id)

            if not table_texts:
                print(f"[GPT-Vision] Table {table_id} 텍스트 없음, Vision 단독 모드로 전환")
                use_table_texts = False
            else:
                prompt = f"""이 표 이미지에서 ESG 데이터(배출량, 매출액, 에너지)를 추출하세요.

**중요: 이미지의 표 구조를 파악하고, 아래 제공된 텍스트 리스트에서 정확한 값을 선택하세요.**

## 표에서 추출 가능한 텍스트 목록
{chr(10).join(f"- {text}" for text in table_texts[:50])}

## 추출 대상 및 원칙 (엄격함)
1. **모든 연도 추출**: 표에 나와 있는 **모든 과거 연도(3개년 이상)**의 데이터를 추출하세요.
2. **Scope 3 필수**: Scope 1, 2 뿐만 아니라 **Scope 3** 데이터가 반드시 포함되어야 합니다.
3. **단위 통합**: 모든 배출량은 tCO2e 단위로 변환하세요.

## 응답 형식 (JSON만)
{{"scope1": 숫자|null, "scope2": 숫자|null, "scope3": 숫자|null, "yearly_emissions": {{}}|null, "base_year": 숫자|null, "base_emissions": 숫자|null, "revenue": 숫자|null, "energy_intensity": 숫자|null, "yearly_energy_intensity": {{}}|null}}
"""

        # Vision 단독 모드 (또는 텍스트 없음으로 전환된 경우)
        if not use_table_texts:
            # 개선된 프롬프트: 2단계 분석 + 명확한 지시
            prompt = """당신은 ESG 보고서 표에서 배출량 데이터를 추출하는 전문가입니다.

## 📋 중요한 구별 사항

**표에는 여러 종류의 배출량이 있을 수 있습니다:**
1. **총배출량/총합** = Scope 1 + Scope 2의 합계 (이것을 추출하지 마세요!)
2. **Scope 1** = 직접 배출 (이것을 s1_YYYY에 넣으세요)
3. **Scope 2** = 간접 배출 (이것을 s2_YYYY에 넣으세요)
4. **Scope 3** = 기타 간접 배출 (이것을 s3_YYYY에 넣으세요)

**지역기반 vs 시장기반:**
- 두 가지가 모두 있으면 **지역기반(Location-based)** 값을 사용하세요

---

## 📋 Few-shot Example

**예시 표:**
```
구분              2022년   2023년   2024년
총배출량 총합      185488   203167   195762  ← 이건 총합! 무시!
  Scope1          85655   100589    91565   ← 이걸 추출!
  Scope2          99833   102578   104197   ← 이걸 추출!
지역기반 총배출량   88184    93787    93090   ← 지역기반 소계
기타 배출량
  총합            81936    92515    56053   ← Scope 3 추출!
```

**정답 JSON:**
{"s1_2022": 85655, "s1_2023": 100589, "s1_2024": 91565, "s2_2022": 99833, "s2_2023": 102578, "s2_2024": 104197, "s3_2022": 81936, "s3_2023": 92515, "s3_2024": 56053}

---

## 🎯 실제 작업

**단계 1: 표에서 다음 행을 찾으세요**
- "Scope1" 또는 "Scope 1"이라고 명시된 행 → s1_YYYY
- "Scope2" 또는 "Scope 2"이라고 명시된 행 → s2_YYYY
- "Scope 3" 또는 "기타 배출량"의 "총합" 행 → s3_YYYY

**단계 2: JSON 출력 (순수 JSON만, 설명 금지)**
```json
{
  "s1_2024": 숫자,
  "s1_2023": 숫자,
  "s1_2022": 숫자,
  "s2_2024": 숫자,
  "s2_2023": 숫자,
  "s2_2022": 숫자,
  "s3_2024": 숫자,
  "s3_2023": 숫자,
  "s3_2022": 숫자
}
```

**주의:**
- 쉼표 없이 숫자만 (91565 ⭕, 91,565 ❌)
- 찾을 수 없으면 null
- 코드 블록(```) 없이 JSON만
"""


        try:
            print(f"[GPT-Vision] Table {table_id} 분석 중 (모델: {model})...")
            response = openai_client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{image_base64}",
                                    "detail": "auto"  # auto: GPT가 자동으로 적절한 해상도 선택
                                }
                            }
                        ]
                    }
                ],
                max_tokens=4000,  # 2000 → 4000 (충분한 응답 길이 확보)
                temperature=0,
                stream=True  # Streaming 활성화 (응답 잘림 방지)
            )

            # Streaming 응답 수집
            full_content = ""
            for chunk in response:
                if chunk.choices[0].delta.content:
                    full_content += chunk.choices[0].delta.content

            content = full_content.strip()
            print(f"[GPT-Vision] Table {table_id} 응답: {content[:150]}...")

            # 응답 길이 확인 (디버깅용)
            if len(content) < 50:
                print(f"[GPT-Vision] ⚠️ 응답이 너무 짧음 ({len(content)}자), 건너뜀")
                continue

            # JSON 추출 개선: 여러 방법으로 시도
            data = None

            # 방법 1: ``` 코드 블록 제거
            cleaned_content = content
            if content.startswith("```"):
                cleaned_content = re.sub(r'^```json?\s*', '', content)
                cleaned_content = re.sub(r'```.*$', '', cleaned_content, flags=re.DOTALL)

            # 방법 2: 숫자에서 쉼표 제거 (GPT가 1,000처럼 출력한 경우 대비)
            # "s1_2024": 195,762 → "s1_2024": 195762
            cleaned_content = re.sub(r':\s*(\d{1,3}(?:,\d{3})+)', lambda m: ': ' + m.group(1).replace(',', ''), cleaned_content)

            # 방법 3: 첫 번째 { } 쌍만 추출
            try:
                data = json.loads(cleaned_content)
            except json.JSONDecodeError as e:
                # JSON 파싱 실패시, { }로 감싸진 첫 번째 JSON만 추출
                match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', cleaned_content, re.DOTALL)
                if match:
                    try:
                        data = json.loads(match.group(0))
                    except:
                        print(f"[GPT-Vision] Table {table_id} JSON 파싱 오류: {e}")
                        continue
                else:
                    print(f"[GPT-Vision] Table {table_id} JSON 파싱 오류: {e}")
                    continue
            # print(f"[GPT-Vision] Table {table_id} 추출: {data}")

            # 결과 병합 (새로운 flat JSON 구조 처리)
            # Scope 1: 최신 연도 값 추출
            if not result.get('s1'):
                for year in ['2024', '2023', '2022', '2021']:
                    if data.get(f's1_{year}'):
                        result['s1'] = float(data[f's1_{year}'])
                        result['source_tables']['s1'] = table_id
                        break

            # Scope 2: 최신 연도 값 추출
            if not result.get('s2'):
                for year in ['2024', '2023', '2022', '2021']:
                    if data.get(f's2_{year}'):
                        result['s2'] = float(data[f's2_{year}'])
                        result['source_tables']['s2'] = table_id
                        break

            # Scope 3: 최신 연도 값 추출
            if not result.get('s3'):
                for year in ['2024', '2023', '2022', '2021']:
                    if data.get(f's3_{year}'):
                        result['s3'] = float(data[f's3_{year}'])
                        result['source_tables']['s3'] = table_id
                        break

            # 연도별 Scope 1 개별 저장
            if not result.get('yearly_s1'):
                yearly_s1 = {}
                for year in ['2024', '2023', '2022', '2021', '2020', '2019']:
                    s1_val = data.get(f's1_{year}')
                    if s1_val:
                        yearly_s1[year] = float(s1_val)
                if yearly_s1:
                    result['yearly_s1'] = yearly_s1

            # 연도별 Scope 2 개별 저장
            if not result.get('yearly_s2'):
                yearly_s2 = {}
                for year in ['2024', '2023', '2022', '2021', '2020', '2019']:
                    s2_val = data.get(f's2_{year}')
                    if s2_val:
                        yearly_s2[year] = float(s2_val)
                if yearly_s2:
                    result['yearly_s2'] = yearly_s2

            # 연도별 배출량 (Scope 1 + Scope 2 총합) - 하위 호환성
            if not result.get('yearly_emissions'):
                yearly = {}
                for year in ['2024', '2023', '2022', '2021', '2020', '2019']:
                    s1_val = data.get(f's1_{year}')
                    s2_val = data.get(f's2_{year}')
                    if s1_val and s2_val:
                        yearly[year] = float(s1_val) + float(s2_val)
                    elif s1_val or s2_val:
                        yearly[year] = float(s1_val or 0) + float(s2_val or 0)

                if yearly:
                    result['yearly_emissions'] = yearly

            # 연도별 Scope 3
            if not result.get('yearly_s3'):
                yearly_s3 = {}
                for year in ['2024', '2023', '2022', '2021', '2020', '2019']:
                    s3_val = data.get(f's3_{year}')
                    if s3_val:
                        yearly_s3[year] = float(s3_val)

                if yearly_s3:
                    result['yearly_s3'] = yearly_s3

            # 조기 종료 조건: Scope 1, 2, 3 모두 확보
            if result.get('s1') and result.get('s2') and result.get('s3'):
                print(f"[GPT-Vision] ✅ Table {table_id}에서 S1, S2, S3 모두 확보, 조기 종료")
                break

        except json.JSONDecodeError as e:
            print(f"[GPT-Vision] Table {table_id} JSON 파싱 오류: {e}")
            continue
        except Exception as e:
            print(f"[GPT-Vision] Table {table_id} API 오류: {e}")
            continue

    # 최소한 s1 또는 s2가 있어야 성공
    if result.get('source_tables'):
        # 추가: Revenue와 Energy Intensity 별도 추출 시도
        if not result.get('revenue'):
            revenue_data = extract_revenue_with_vision(tables[:5])
            if revenue_data:
                result.update(revenue_data)

        if not result.get('energy_intensity'):
            energy_data = extract_energy_with_vision(tables[:5])
            if energy_data:
                result.update(energy_data)

        return result

    return None


def extract_revenue_with_vision(tables: List[Dict]) -> Optional[Dict]:
    """Revenue만 추출하는 별도 함수 (간단한 프롬프트)"""
    for table in tables:
        table_id = table['id']
        image_path = get_table_image_path(table_id)

        if not image_path or not image_path.exists():
            continue

        try:
            image_base64 = encode_image(image_path)

            prompt = """이 표에서 **매출액(Revenue)** 데이터만 찾아주세요.

**출력 형식:**
{"revenue": 숫자 (억원 단위)}

예시: {"revenue": 326703}

**주의:**
- 조 단위면 억원으로 변환 (1조 = 10,000억)
- 순수 JSON만 반환, 설명 금지
"""

            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{image_base64}",
                                    "detail": "auto"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=500,
                temperature=0,
                stream=True
            )

            full_content = ""
            for chunk in response:
                if chunk.choices[0].delta.content:
                    full_content += chunk.choices[0].delta.content

            content = full_content.strip()

            # JSON 파싱
            if content.startswith("```"):
                content = re.sub(r'^```json?\s*', '', content)
                content = re.sub(r'```.*$', '', content, flags=re.DOTALL)

            data = json.loads(content)

            if data.get('revenue'):
                print(f"[GPT-Vision] ✅ Table {table_id}에서 Revenue 추출: {data['revenue']}")
                return {
                    'revenue': float(data['revenue']),
                    'source_tables': {'revenue': table_id}
                }

        except Exception as e:
            continue

    return None


def extract_energy_with_vision(tables: List[Dict]) -> Optional[Dict]:
    """Energy Intensity만 추출하는 별도 함수"""
    for table in tables:
        table_id = table['id']
        image_path = get_table_image_path(table_id)

        if not image_path or not image_path.exists():
            continue

        try:
            image_base64 = encode_image(image_path)

            prompt = """이 표에서 **에너지 집약도(Energy Intensity)** 데이터만 찾아주세요.

**출력 형식:**
{"energy_intensity": 숫자, "energy_2023": 숫자, "energy_2022": 숫자}

예시: {"energy_intensity": 4.48, "energy_2023": 4.88, "energy_2022": 7.29}

**주의:**
- 단위: TJ/매출 1억원 또는 유사 단위
- 최신 연도는 energy_intensity에 저장
- 순수 JSON만 반환, 설명 금지
"""

            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{image_base64}",
                                    "detail": "auto"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=500,
                temperature=0,
                stream=True
            )

            full_content = ""
            for chunk in response:
                if chunk.choices[0].delta.content:
                    full_content += chunk.choices[0].delta.content

            content = full_content.strip()

            # JSON 파싱
            if content.startswith("```"):
                content = re.sub(r'^```json?\s*', '', content)
                content = re.sub(r'```.*$', '', content, flags=re.DOTALL)

            data = json.loads(content)

            if data.get('energy_intensity'):
                result = {
                    'energy_intensity': float(data['energy_intensity']),
                    'source_tables': {'energy': table_id}
                }

                # 연도별 데이터가 있으면 추가
                yearly_energy = {}
                for year in ['2024', '2023', '2022', '2021']:
                    if data.get(f'energy_{year}'):
                        yearly_energy[year] = float(data[f'energy_{year}'])

                if yearly_energy:
                    result['yearly_energy_intensity'] = yearly_energy

                print(f"[GPT-Vision] ✅ Table {table_id}에서 Energy Intensity 추출: {data['energy_intensity']}")
                return result

        except Exception as e:
            continue

    return None
