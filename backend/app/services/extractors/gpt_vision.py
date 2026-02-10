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


def extract_with_gpt_vision(doc_id: int, tables: List[Dict], use_table_texts: bool = False) -> Optional[Dict]:
    """
    GPT-4V를 사용하여 표 이미지 직접 분석

    Args:
        doc_id: 문서 ID
        tables: 분석할 표 목록
        use_table_texts: True면 table_cells의 텍스트를 함께 제공 (옵션 3)

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
            # 옵션 1: Vision 단독 - 엄격한 추출 모드
            system_prompt = """
당신은 기업의 ESG 보고서에서 '온실가스 배출량', '에너지 사용량', '매출액' 데이터를 정확하게 추출하는 전문가입니다.
주어진 이미지(표)를 분석하여 JSON 형식으로 데이터를 추출하세요.

## 추출 원칙 (매우 중요)
1. **모든 연도 추출**: 표에 나와 있는 **모든 과거 연도(3개년 이상)**의 데이터를 추출하세요. (예: 2021, 2022, 2023, 2024 ...)
2. **Scope 3 필수**: Scope 1, 2 뿐만 아니라 **Scope 3** 데이터가 반드시 포함되어야 합니다.
   - 만약 Scope 3가 표에 없다면 `calculated_scope3` 필드를 null로 두세요.
   - 단, 텍스트나 주석에 Scope 3가 있다면 포함하세요.
3. **단위 통합**: 모든 배출량은 tCO2e 단위로 변환하세요. (만약 만 톤 단위라면 * 10,000)
4. **에너지 집약도**: '에너지 사용량(Energy Consumption)'은 찾되, '집약도(Intensity)'가 명시되어 있다면 그것을 우선 추출하세요.

## JSON 출력 형식
```json
{
  "company_name": "회사명",
  "report_year": 2024,
  "unit": "tCO2e",
  "yearly_emissions": {
    "2024": 12345,
    "2023": 12000,
    "2022": 11500
  },
  "yearly_scope3": {
    "2024": 5000,
    "2023": 4800,
    "2022": 4500
  },
  "yearly_energy_intensity": {
    "2024": 5.5,
    "2023": 5.6,
    "2022": 5.8
  },
  "revenue": 12345678, 
  "revenue_unit": "KRW",
  "base_year": 2021,
  "base_emissions": 10000
}
```
"""

            user_prompt = """
이 이미지에서 온실가스 배출량(Scope 1, 2, 3), 매출액, 에너지 집약도를 추출해줘.
특히 **Scope 3**와 **에너지 집약도**, **매출액**이 있으면 놓치지 말고 찾아내.
표에 여러 연도가 있으면 `yearly_emissions`와 `yearly_s3`에 모두 담아줘.
"""

            prompt = system_prompt + user_prompt


        try:
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
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=800,
                temperature=0
            )

            content = response.choices[0].message.content.strip()
            print(f"[GPT-Vision] Table {table_id} 응답: {content[:100]}...")

            if content.startswith("```"):
                content = re.sub(r'^```json?\s*', '', content)
                content = re.sub(r'```\s*$', '', content)

            data = json.loads(content)
            # print(f"[GPT-Vision] Table {table_id} 추출: {data}")

            # 결과 병합 (기존 값 덮어쓰지 않음, 비어있을 때만 채움)
            if data.get('scope1') and not result.get('s1'):
                result['s1'] = float(data['scope1'])
                result['source_tables']['s1'] = table_id

            if data.get('scope2') and not result.get('s2'):
                result['s2'] = float(data['scope2'])
                result['source_tables']['s2'] = table_id

            if data.get('scope3') and not result.get('s3'):
                result['s3'] = float(data['scope3'])
                result['source_tables']['s3'] = table_id

            if data.get('yearly_emissions') and not result.get('yearly_emissions'):
                yearly = {}
                for year, val in data['yearly_emissions'].items():
                    if val:
                        yearly[str(year)] = float(val)
                if yearly:
                    result['yearly_emissions'] = yearly

            if data.get('base_year') and not result.get('base_year'):
                result['base_year'] = int(data['base_year'])

            if data.get('base_emissions') and not result.get('base_emissions'):
                result['base_emissions'] = float(data['base_emissions'])

            # [NEW] Revenue 병합
            if data.get('revenue') and not result.get('revenue'):
                result['revenue'] = float(data['revenue'])
                result['source_tables']['revenue'] = table_id

            # [NEW] Energy Intensity 병합
            if data.get('energy_intensity') and not result.get('energy_intensity'):
                result['energy_intensity'] = float(data['energy_intensity'])
                result['source_tables']['energy'] = table_id
            
            if data.get('yearly_energy_intensity') and not result.get('yearly_energy_intensity'):
                yearly_energy = {}
                for year, val in data['yearly_energy_intensity'].items():
                    if val:
                        yearly_energy[str(year)] = float(val)
                if yearly_energy:
                    result['yearly_energy_intensity'] = yearly_energy

            # 조기 종료 조건 완화: 모든 필수 데이터가 모였을 때만 종료
            # 필수: s1, s2, revenue, energy_intensity
            if (result.get('s1') and result.get('s2') and 
                result.get('revenue') and result.get('energy_intensity')):
                print("[GPT-Vision] 모든 필수 데이터 확보, 조기 종료")
                break

        except json.JSONDecodeError as e:
            print(f"[GPT-Vision] Table {table_id} JSON 파싱 오류: {e}")
            continue
        except Exception as e:
            print(f"[GPT-Vision] Table {table_id} API 오류: {e}")
            continue

    # 최소한 s1 또는 s2가 있어야 성공
    # (하지만 Revenue만 찾거나 Energy만 찾은 경우도 저장해야 할까? 일단 추출 결과는 반환)
    if result.get('source_tables'):
        return result

    return None
