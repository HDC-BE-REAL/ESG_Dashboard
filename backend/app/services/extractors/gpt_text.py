"""
GPT 텍스트 분석 기반 배출량 추출
"""
import os
import re
import json
from typing import Optional, Dict, List
from sqlalchemy import text
from openai import OpenAI
from dotenv import load_dotenv
from ...database import engine

load_dotenv()
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def find_all_tables(doc_id: int) -> List[Dict]:
    """문서의 모든 표 가져오기 (GPT 모드용, 키워드 표 우선순위)"""
    # 1. 키워드 있는 표 (우선순위 1)
    sql_keyword = """
        SELECT dt.id, dt.title, dt.page_no,
               (SELECT COUNT(*) FROM table_cells tc WHERE tc.table_id = dt.id) as cell_count,
               1 as priority
        FROM doc_tables dt
        WHERE dt.doc_id = :doc_id
          AND (
              dt.title LIKE '%온실가스%'
              OR dt.title LIKE '%배출%'
              OR dt.title LIKE '%Scope%'
              OR dt.title LIKE '%GHG%'
              OR dt.title LIKE '%탄소%'
          )
        HAVING cell_count >= 20
    """

    # 2. 나머지 큰 표들 (우선순위 2)
    sql_rest = """
        SELECT dt.id, dt.title, dt.page_no,
               (SELECT COUNT(*) FROM table_cells tc WHERE tc.table_id = dt.id) as cell_count,
               2 as priority
        FROM doc_tables dt
        WHERE dt.doc_id = :doc_id
          AND NOT (
              dt.title LIKE '%온실가스%'
              OR dt.title LIKE '%배출%'
              OR dt.title LIKE '%Scope%'
              OR dt.title LIKE '%GHG%'
              OR dt.title LIKE '%탄소%'
          )
        HAVING cell_count >= 30
        ORDER BY cell_count DESC
        LIMIT 15
    """

    tables = []
    with engine.connect() as conn:
        # 키워드 표
        rows = conn.execute(text(sql_keyword), {'doc_id': doc_id}).fetchall()
        tables.extend([
            {'id': r[0], 'title': r[1], 'page_no': r[2], 'cell_count': r[3], 'priority': r[4]}
            for r in rows
        ])

        # 나머지 표
        rows = conn.execute(text(sql_rest), {'doc_id': doc_id}).fetchall()
        tables.extend([
            {'id': r[0], 'title': r[1], 'page_no': r[2], 'cell_count': r[3], 'priority': r[4]}
            for r in rows
        ])

    # 우선순위와 페이지 순으로 정렬
    tables.sort(key=lambda x: (x['priority'], x['page_no']))
    return tables


def format_table_for_gpt(table_id: int) -> str:
    """표 셀을 GPT가 이해할 수 있는 텍스트 형식으로 변환"""
    sql = """
        SELECT row_idx, col_idx, content
        FROM table_cells
        WHERE table_id = :table_id
        ORDER BY row_idx, col_idx
    """
    with engine.connect() as conn:
        rows = conn.execute(text(sql), {'table_id': table_id}).fetchall()

    if not rows:
        return ""

    # 행별로 그룹화
    table_data = {}
    for row_idx, col_idx, content in rows:
        if row_idx not in table_data:
            table_data[row_idx] = {}
        table_data[row_idx][col_idx] = content or ""

    # 마크다운 테이블 형식으로 변환
    lines = []
    for row_idx in sorted(table_data.keys()):
        row = table_data[row_idx]
        cols = [row.get(c, "") for c in range(max(row.keys()) + 1)]
        lines.append(" | ".join(str(c)[:50] for c in cols))  # 셀당 50자 제한

    return "\n".join(lines[:30])  # 최대 30행


def extract_with_gpt(doc_id: int, tables: List[Dict]) -> Optional[Dict]:
    """
    GPT API를 사용하여 배출량 데이터 추출
    정규식보다 더 유연하게 다양한 표 형식 처리 가능
    """
    if not tables:
        return None

    result = {'source_tables': {}}

    # 상위 10개 표 처리 (키워드 표 우선, 비용 약 $0.01)
    for table in tables[:10]:
        table_id = table['id']
        table_text = format_table_for_gpt(table_id)

        if not table_text or len(table_text) < 50:
            continue

        prompt = f"""다음은 ESG 보고서의 표입니다. 아래 정보를 추출하여 JSON으로 반환하세요.

**중요: 데이터가 없어도 반드시 JSON 형식으로만 응답하세요. 설명이나 다른 텍스트는 절대 포함하지 마세요.**

## 추출 대상
- scope1: Scope 1 (직접 배출량) - 가장 최신 연도 값 (단위: tCO2e)
- scope2: Scope 2 (간접 배출량) - 가장 최신 연도 값 (단위: tCO2e)
- scope3: Scope 3 (기타 간접 배출량) - 있으면 추출 (단위: tCO2e)
- yearly_emissions: 연도별 총 배출량 (Scope 1+2 합계) 딕셔너리 {{"2021": 12345, "2022": 23456, ...}}
- base_year: 기준연도 (있으면)
- base_emissions: 기준연도 배출량

## 규칙
1. 숫자만 반환 (단위, 콤마 제거)
2. 값을 찾지 못하면 해당 필드는 null
3. "직접 온실가스", "직접배출", "Scope 1" 등은 모두 Scope 1
4. "간접 온실가스", "간접배출", "Scope 2" 등은 모두 Scope 2
5. **중요**: 표에 여러 연도(2021, 2022, 2023, 2024 등)가 있으면, "기준연도" 컬럼을 제외하고 가장 큰 숫자 연도의 값을 사용 (예: 2024 > 2023)
6. 연도 헤더에 "2024 1)" 같은 주석이 있어도 숫자만 보고 판단
7. "국내", "해외" 등 하위 항목 아닌 상위 합계 행 값 사용

## 표 데이터
{table_text}

## 응답 형식 (JSON만, 설명 없이)
{{"scope1": 숫자|null, "scope2": 숫자|null, "scope3": 숫자|null, "yearly_emissions": {{}}|null, "base_year": 숫자|null, "base_emissions": 숫자|null}}
"""
        try:
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "ESG 보고서 데이터 추출 전문가. JSON만 반환."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0,
                max_tokens=500
            )

            content = response.choices[0].message.content.strip()

            # JSON 파싱 (코드블록 제거)
            if content.startswith("```"):
                content = re.sub(r'^```json?\s*', '', content)
                content = re.sub(r'```\s*$', '', content)

            data = json.loads(content)
            print(f"[GPT] Table {table_id} 추출: {data}")

            # 결과 병합
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

            # Scope 1, 2 둘 다 찾았으면 조기 종료
            if result.get('s1') and result.get('s2'):
                break

        except json.JSONDecodeError as e:
            print(f"[GPT] Table {table_id} JSON 파싱 오류: {e}")
            continue
        except Exception as e:
            print(f"[GPT] Table {table_id} API 오류: {e}")
            continue

    # 최소한 s1 또는 s2가 있어야 성공
    if result.get('s1') or result.get('s2'):
        return result

    return None
