"""
ESG 보고서에서 배출량 데이터 추출

Usage:
    from app.services.emission_extractor import EmissionExtractor

    extractor = EmissionExtractor()
    data = extractor.extract_for_document(doc_id=2)
    extractor.save_to_summary(data)

    # GPT 기반 추출 (더 유연한 패턴 인식)
    data = extractor.extract_for_document(doc_id=2, use_gpt=True)
"""

import os
import re
import json
import base64
from pathlib import Path
from typing import Optional, Dict, Any, List, Union
from decimal import Decimal
from sqlalchemy import text
from openai import OpenAI
from dotenv import load_dotenv
from ..database import engine

load_dotenv()

# OpenAI 클라이언트 초기화
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# PDF 추출 결과 경로 (환경변수로 설정 가능)
STRUCTURED_DATA_PATH = Path(os.getenv("STRUCTURED_DATA_PATH", "../PDF_Extraction/data/pages_structured"))


class EmissionExtractor:
    """table_cells에서 배출량 데이터 추출"""

    # 키워드 패턴 (정규식)
    SCOPE1_PATTERNS = [
        r'직접.*온실가스.*Scope.?1',
        r'직접온실가스배출.*Scope.?1',
        r'Scope.?1.*직접',
        r'^직접배출',
    ]

    SCOPE2_PATTERNS = [
        r'간접.*온실가스.*Scope.?2',
        r'간접온실가스배출.*Scope.?2',
        r'Scope.?2.*간접',
        r'^간접배출',
    ]

    SCOPE1_2_PATTERNS = [
        r'Scope.?1.?&.?2',
        r'Scope.?1.?2',
        r'직.?간접.*온실가스',
        r'직/간접',
    ]

    SCOPE3_PATTERNS = [
        r'Scope.?3',
        r'기타.*간접.*온실가스',
    ]

    def extract_for_document(self, doc_id: int, use_gpt: Union[bool, str] = False) -> Dict[str, Any]:
        """
        단일 문서에서 모든 ESG 수치 추출

        Args:
            doc_id: 문서 ID
            use_gpt: 추출 방식 선택
                - False: 정규식 패턴 (빠름, 무료)
                - True: GPT 텍스트 분석 (유연함, $0.001/회사)
                - 'vision': GPT-4V 이미지 분석 (가장 정확, $0.05/회사)

        Returns:
            {
                'doc_id': 2,
                'company_name': 'HDEC',
                'report_year': 2025,
                'data_year': 2024,
                's1': 137450.0,
                's2': 113234.0,
                's3': 5198461.0,
                'revenue': 326703.0,
                'yearly_emissions': {'2021': 296841, '2022': 384836, ...},
                'base_year': 2019,
                'base_emissions': 596140.0,
                'source_tables': {'s1': 151, 's2': 151, 's3': 281, 'revenue': 72},
                'allowance': 100273.6,  # 추정치
                'data_source': 'auto' | 'gpt'
            }
        """
        result = {
            'doc_id': doc_id,
            'source_tables': {},
            'data_source': 'auto'
        }

        # 1. 문서 정보 가져오기
        doc_info = self._get_document_info(doc_id)
        if not doc_info:
            raise ValueError(f"Document {doc_id} not found")

        result['company_name'] = doc_info['company_name']
        result['report_year'] = doc_info['report_year']
        result['data_year'] = doc_info['report_year'] - 1  # 보통 전년도 데이터

        # 2. 배출량 관련 표 찾기
        if use_gpt:
            # GPT 모드: 제목 필터링 없이 모든 표 검토 (내용 기반 판단)
            emission_tables = self._find_all_tables(doc_id)
            mode_name = "GPT-4V 이미지" if use_gpt == 'vision' else "GPT 텍스트"
            print(f"[Extractor] 전체 표 {len(emission_tables)}개 검토 ({mode_name} 모드)")
        else:
            # 정규식 모드: 제목으로 필터링 (빠른 처리)
            emission_tables = self._find_emission_tables(doc_id)
            print(f"[Extractor] 배출량 관련 표 {len(emission_tables)}개 발견")

        # GPT 모드: GPT API로 추출
        if use_gpt:
            if use_gpt == 'vision':
                # GPT-4V 이미지 분석
                result['data_source'] = 'gpt-vision'
                gpt_data = self._extract_with_gpt_vision(doc_id, emission_tables)
            else:
                # GPT 텍스트 분석
                result['data_source'] = 'gpt'
                gpt_data = self._extract_with_gpt(doc_id, emission_tables)

            if gpt_data:
                result.update(gpt_data)
                # 할당량 추정 (Scope 1+2의 40%)
                if result.get('s1') and result.get('s2'):
                    result['allowance'] = (result['s1'] + result['s2']) * 0.4
                return result
            else:
                print("[Extractor] GPT 추출 실패, 정규식 fallback")

        # 3. Scope 1, 2 추출 (주요 표에서) - 정규식 방식
        scope_data = self._extract_scope_1_2(doc_id, emission_tables)
        if scope_data:
            result['s1'] = scope_data.get('s1')
            result['s2'] = scope_data.get('s2')
            result['yearly_emissions'] = scope_data.get('yearly')
            result['base_emissions'] = scope_data.get('base_emissions')
            result['base_year'] = scope_data.get('base_year')
            result['source_tables']['s1'] = scope_data.get('table_id')
            result['source_tables']['s2'] = scope_data.get('table_id')

        # 4. Scope 3 추출
        scope3_data = self._extract_scope_3(doc_id, emission_tables)
        if scope3_data:
            result['s3'] = scope3_data.get('s3')
            result['source_tables']['s3'] = scope3_data.get('table_id')

        # 5. 매출액 추출
        revenue_data = self._extract_revenue(doc_id)
        if revenue_data:
            result['revenue'] = revenue_data.get('revenue')
            result['source_tables']['revenue'] = revenue_data.get('table_id')

        # 6. 할당량 추정 (Scope 1+2의 40%)
        if result.get('s1') and result.get('s2'):
            result['allowance'] = (result['s1'] + result['s2']) * 0.4

        return result

    def _get_document_info(self, doc_id: int) -> Optional[Dict]:
        """문서 메타데이터 조회"""
        sql = """
            SELECT id, company_name, report_year, filename
            FROM documents
            WHERE id = :doc_id
        """
        with engine.connect() as conn:
            row = conn.execute(text(sql), {'doc_id': doc_id}).fetchone()
            if row:
                return {
                    'id': row[0],
                    'company_name': row[1],
                    'report_year': row[2],
                    'filename': row[3]
                }
        return None

    def _find_emission_tables(self, doc_id: int) -> List[Dict]:
        """배출량 관련 표 탐색 (제목 키워드 기반)"""
        sql = """
            SELECT dt.id, dt.title, dt.page_no,
                   (SELECT COUNT(*) FROM table_cells tc WHERE tc.table_id = dt.id) as cell_count
            FROM doc_tables dt
            WHERE dt.doc_id = :doc_id
              AND (
                  dt.title LIKE '%온실가스%'
                  OR dt.title LIKE '%배출%'
                  OR dt.title LIKE '%Scope%'
                  OR dt.title LIKE '%GHG%'
              )
            ORDER BY dt.page_no
        """
        with engine.connect() as conn:
            rows = conn.execute(text(sql), {'doc_id': doc_id}).fetchall()
            return [
                {'id': r[0], 'title': r[1], 'page_no': r[2], 'cell_count': r[3]}
                for r in rows
            ]

    def _find_all_tables(self, doc_id: int) -> List[Dict]:
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

    def _extract_scope_1_2(self, doc_id: int, tables: List[Dict]) -> Optional[Dict]:
        """Scope 1, 2 데이터 추출"""

        # 우선순위: "온실가스 총 배출량" 또는 "Scope 1&2" 포함 표
        priority_tables = [t for t in tables if '총' in (t['title'] or '') or '현황' in (t['title'] or '')]
        search_tables = priority_tables if priority_tables else tables

        for table in search_tables:
            table_id = table['id']

            # 연도 컬럼 탐지
            year_cols = self._detect_year_columns(table_id)
            if not year_cols:
                continue

            # Scope 1 row 찾기
            scope1_row = self._find_row_by_patterns(table_id, self.SCOPE1_PATTERNS)
            # Scope 2 row 찾기
            scope2_row = self._find_row_by_patterns(table_id, self.SCOPE2_PATTERNS)
            # Scope 1+2 합계 row 찾기
            scope1_2_row = self._find_row_by_patterns(table_id, self.SCOPE1_2_PATTERNS)

            if scope1_row is None and scope2_row is None:
                continue

            # 최신 연도 데이터 추출
            latest_year = max(year_cols.keys())
            latest_col = year_cols[latest_year]

            s1 = self._get_cell_value(table_id, scope1_row, latest_col) if scope1_row else None
            s2 = self._get_cell_value(table_id, scope2_row, latest_col) if scope2_row else None

            # 연도별 데이터 (Scope 1+2 합계)
            yearly = {}
            if scope1_2_row is not None:
                for year, col in year_cols.items():
                    val = self._get_cell_value(table_id, scope1_2_row, col)
                    if val:
                        yearly[str(year)] = val

            # 기준연도 찾기 (마지막 컬럼이 보통 기준연도)
            base_year = None
            base_emissions = None
            if year_cols:
                # "기준연도" 또는 가장 오래된 연도
                sorted_years = sorted(year_cols.keys())
                if sorted_years[0] < 2020:  # 2019, 2020 등이면 기준연도
                    base_year = sorted_years[0]
                    if scope1_2_row is not None:
                        base_emissions = self._get_cell_value(table_id, scope1_2_row, year_cols[base_year])

            if s1 or s2:
                print(f"[Extractor] Table {table_id}: S1={s1}, S2={s2}")
                return {
                    'table_id': table_id,
                    's1': s1,
                    's2': s2,
                    'yearly': yearly,
                    'base_year': base_year,
                    'base_emissions': base_emissions
                }

        return None

    def _extract_scope_3(self, doc_id: int, tables: List[Dict]) -> Optional[Dict]:
        """Scope 3 데이터 추출"""

        # Scope 3 관련 표 찾기
        scope3_tables = [t for t in tables if 'Scope' in (t['title'] or '') and '3' in (t['title'] or '')]
        if not scope3_tables:
            scope3_tables = tables

        for table in scope3_tables:
            table_id = table['id']

            year_cols = self._detect_year_columns(table_id)
            if not year_cols:
                continue

            scope3_row = self._find_row_by_patterns(table_id, self.SCOPE3_PATTERNS)
            if scope3_row is None:
                continue

            latest_year = max(year_cols.keys())
            latest_col = year_cols[latest_year]

            # Scope 3는 여러 컬럼 중 "현대건설" 컬럼을 찾아야 할 수도 있음
            s3 = self._get_cell_value(table_id, scope3_row, latest_col)

            if s3:
                print(f"[Extractor] Table {table_id}: S3={s3}")
                return {
                    'table_id': table_id,
                    's3': s3
                }

        return None

    def _extract_revenue(self, doc_id: int) -> Optional[Dict]:
        """매출액 추출 (회사 개요 표에서)"""

        # "개요" 또는 "현황" 표 찾기
        sql = """
            SELECT dt.id, dt.title
            FROM doc_tables dt
            WHERE dt.doc_id = :doc_id
              AND (dt.title LIKE '%개요%' OR dt.title LIKE '%현황%' OR dt.title LIKE '%일반%')
            LIMIT 10
        """
        with engine.connect() as conn:
            tables = conn.execute(text(sql), {'doc_id': doc_id}).fetchall()

        for table_id, title in tables:
            # 매출액 텍스트 찾기
            sql = """
                SELECT content
                FROM table_cells
                WHERE table_id = :table_id
                  AND (content LIKE '%조%억%원%' OR content LIKE '%매출%')
                ORDER BY row_idx
            """
            with engine.connect() as conn:
                rows = conn.execute(text(sql), {'table_id': table_id}).fetchall()

            for row in rows:
                content = row[0]
                revenue = self._parse_korean_currency(content)
                if revenue and revenue > 1000:  # 최소 1000억 이상
                    print(f"[Extractor] Table {table_id}: Revenue={revenue}억")
                    return {
                        'table_id': table_id,
                        'revenue': revenue
                    }

        return None

    def _extract_with_gpt(self, doc_id: int, tables: List[Dict]) -> Optional[Dict]:
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
            table_text = self._format_table_for_gpt(table_id)

            if not table_text or len(table_text) < 50:
                continue

            prompt = f"""다음은 ESG 보고서의 표입니다. 아래 정보를 추출하여 JSON으로 반환하세요.

## 추출 대상
- scope1: Scope 1 (직접 배출량) - 가장 최신 연도 값 (단위: tCO2e)
- scope2: Scope 2 (간접 배출량) - 가장 최신 연도 값 (단위: tCO2e)
- scope3: Scope 3 (기타 간접 배출량) - 있으면 추출 (단위: tCO2e)
- yearly_emissions: 연도별 총 배출량 (Scope 1+2 합계) 딕셔너리 {{"2021": 12345, "2022": 23456, ...}}
- base_year: 기준연도 (있으면)
- base_emissions: 기준연도 배출량

## 규칙
1. 숫자만 반환 (단위, 콤마 제외)
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
                    # 연도별 데이터 정규화 (문자열 키 → 정수 값)
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

    def _format_table_for_gpt(self, table_id: int) -> str:
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

    def _extract_with_gpt_vision(self, doc_id: int, tables: List[Dict]) -> Optional[Dict]:
        """
        GPT-4V를 사용하여 표 이미지 직접 분석
        docling 추출 품질과 무관하게 원본 이미지로 정확히 추출
        """
        if not tables:
            return None

        result = {'source_tables': {}}

        # 상위 10개 표 처리 (이미지 분석은 비용이 높으므로)
        for table in tables[:10]:
            table_id = table['id']

            # 표 이미지 경로 가져오기
            image_path = self._get_table_image_path(table_id)
            if not image_path or not image_path.exists():
                print(f"[GPT-Vision] Table {table_id} 이미지 없음, 건너뜀")
                continue

            # 이미지를 base64로 인코딩
            try:
                image_base64 = self._encode_image(image_path)
            except Exception as e:
                print(f"[GPT-Vision] Table {table_id} 이미지 인코딩 오류: {e}")
                continue

            # GPT-4V API 호출
            prompt = """이 표 이미지에서 온실가스 배출량 데이터를 추출하세요.

**중요: 데이터가 없어도 반드시 JSON 형식으로만 응답하세요. 설명이나 다른 텍스트는 절대 포함하지 마세요.**

## 추출 대상
- scope1: Scope 1 (직접 배출량) - 가장 최신 연도 값 (단위: tCO2e)
- scope2: Scope 2 (간접 배출량) - 가장 최신 연도 값 (단위: tCO2e)
- scope3: Scope 3 (기타 간접 배출량) - 있으면 추출 (단위: tCO2e)
- yearly_emissions: 연도별 총 배출량 (Scope 1+2 합계) 딕셔너리 {"2021": 12345, "2022": 23456, ...}
- base_year: 기준연도 (있으면)
- base_emissions: 기준연도 배출량

## 규칙
1. 숫자만 반환 (단위, 콤마 제거)
2. 값을 찾지 못하면 해당 필드는 null
3. "직접 온실가스", "직접배출", "Scope 1" 등은 모두 Scope 1
4. "간접 온실가스", "간접배출", "Scope 2" 등은 모두 Scope 2
5. 표에 여러 연도가 있으면, "기준연도" 컬럼 제외하고 가장 큰 숫자 연도의 값 사용 (2024 > 2023)
6. "국내", "해외" 등 하위 항목이 아닌 상위 합계 행의 값 사용

## 응답 형식 (JSON만, 설명 없이)
{"scope1": 숫자|null, "scope2": 숫자|null, "scope3": 숫자|null, "yearly_emissions": {}|null, "base_year": 숫자|null, "base_emissions": 숫자|null}
"""

            try:
                response = openai_client.chat.completions.create(
                    model="gpt-4o",  # GPT-4V 지원 모델
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/png;base64,{image_base64}",
                                        "detail": "high"  # 고해상도 분석
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=500,
                    temperature=0
                )

                content = response.choices[0].message.content.strip()
                print(f"[GPT-Vision] Table {table_id} 응답: {content[:200]}...")

                # JSON 파싱 (코드블록 제거)
                if content.startswith("```"):
                    content = re.sub(r'^```json?\s*', '', content)
                    content = re.sub(r'```\s*$', '', content)

                data = json.loads(content)
                print(f"[GPT-Vision] Table {table_id} 추출: {data}")

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
                print(f"[GPT-Vision] Table {table_id} JSON 파싱 오류: {e}")
                continue
            except Exception as e:
                print(f"[GPT-Vision] Table {table_id} API 오류: {e}")
                continue

        # 최소한 s1 또는 s2가 있어야 성공
        if result.get('s1') or result.get('s2'):
            return result

        return None

    def _get_table_image_path(self, table_id: int) -> Optional[Path]:
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

        # 전체 경로 구성: pages_structured/2025_HDEC_Report/page_0050/tables/table_001.png
        abs_path = STRUCTURED_DATA_PATH / doc_name / image_rel_path

        return abs_path if abs_path.exists() else None

    def _encode_image(self, image_path: Path) -> str:
        """이미지를 base64로 인코딩"""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')

    def _detect_year_columns(self, table_id: int) -> Dict[int, int]:
        """헤더 행에서 연도 컬럼 자동 탐지"""
        sql = """
            SELECT col_idx, content
            FROM table_cells
            WHERE table_id = :table_id
              AND row_idx = 0
            ORDER BY col_idx
        """
        year_cols = {}
        with engine.connect() as conn:
            rows = conn.execute(text(sql), {'table_id': table_id}).fetchall()

        for col_idx, content in rows:
            if not content:
                continue
            # "2021", "2022년", "2023 1)", "기준연도 (2019/2020)" 등 패턴
            match = re.search(r'(20\d{2})', content)
            if match:
                year = int(match.group(1))
                year_cols[year] = col_idx

        return year_cols

    def _find_row_by_patterns(self, table_id: int, patterns: List[str]) -> Optional[int]:
        """col0(헤더 컬럼)에서 패턴 매칭하여 row_idx 반환"""
        sql = """
            SELECT row_idx, content
            FROM table_cells
            WHERE table_id = :table_id
              AND col_idx = 0
              AND content IS NOT NULL
            ORDER BY row_idx
        """
        with engine.connect() as conn:
            rows = conn.execute(text(sql), {'table_id': table_id}).fetchall()

        for row_idx, content in rows:
            for pattern in patterns:
                if re.search(pattern, content, re.IGNORECASE):
                    return row_idx

        return None

    def _get_cell_value(self, table_id: int, row_idx: int, col_idx: int) -> Optional[float]:
        """특정 셀의 numeric_value 반환"""
        if row_idx is None or col_idx is None:
            return None

        sql = """
            SELECT numeric_value, content
            FROM table_cells
            WHERE table_id = :table_id AND row_idx = :row AND col_idx = :col
        """
        with engine.connect() as conn:
            result = conn.execute(text(sql), {
                'table_id': table_id,
                'row': row_idx,
                'col': col_idx
            }).fetchone()

        if result:
            if result[0]:  # numeric_value가 있으면
                return float(result[0])
            # numeric_value가 없으면 content에서 파싱 시도
            if result[1]:
                return self._parse_number(result[1])

        return None

    def _parse_number(self, text: str) -> Optional[float]:
        """텍스트에서 숫자 추출"""
        if not text:
            return None
        # 쉼표 제거하고 숫자 추출
        clean = re.sub(r'[^\d.-]', '', text.replace(',', ''))
        try:
            return float(clean)
        except:
            return None

    def _parse_korean_currency(self, text: str) -> Optional[float]:
        """
        한국어 금액 표기를 억원 단위 숫자로 변환
        "32조6,703억 원" → 326703.0
        """
        if not text:
            return None

        text = text.replace(',', '').replace(' ', '')

        # 조 + 억
        match = re.search(r'(\d+)조(\d+)억', text)
        if match:
            return int(match.group(1)) * 10000 + int(match.group(2))

        # 조만
        match = re.search(r'(\d+)조', text)
        if match:
            return int(match.group(1)) * 10000

        # 억만
        match = re.search(r'(\d+)억', text)
        if match:
            return int(match.group(1))

        return None

    def extract_and_save_auto(self, doc_id: int) -> Dict[str, Any]:
        """
        자동 추출 및 저장 파이프라인
        1. GPT-4o-mini로 모든 표 이미지 스캔 (빠르고 저렴)
        2. 관련도 점수로 상위 후보 선택
        3. GPT-4o로 정밀 분석
        4. DB에 자동 저장
        """
        print("=" * 60)
        print("자동 추출 및 저장 파이프라인 시작")
        print("=" * 60)

        # 1. 모든 표 가져오기 (이미지 있는 것만)
        all_tables = self._find_all_tables_with_images(doc_id)
        print(f"\n[Step 1] 이미지 있는 표 {len(all_tables)}개 발견")

        if not all_tables:
            print("이미지가 있는 표가 없습니다.")
            return None

        # 2. GPT-4o-mini로 관련도 점수 매기기
        print(f"\n[Step 2] GPT-4o-mini로 관련도 점수 계산 중...")
        scored_tables = self._score_tables_for_relevance(all_tables)

        # 점수 높은 순으로 정렬
        scored_tables.sort(key=lambda x: x['score'], reverse=True)

        print(f"\n상위 5개 후보:")
        for i, t in enumerate(scored_tables[:5], 1):
            title = (t.get('title') or 'No title')[:50]
            print(f"  {i}. Table {t['id']} (점수: {t['score']}/100) - {title}")

        # 3. 상위 후보만 GPT-4o로 정밀 분석
        print(f"\n[Step 3] 상위 후보 GPT-4o 정밀 분석 중...")
        candidates = [t for t in scored_tables if t['score'] >= 60][:5]  # 점수 60 이상, 최대 5개

        if not candidates:
            print(f"점수 60 이상인 표가 없습니다. 상위 3개로 시도...")
            candidates = scored_tables[:3]

        # 후보 표만 GPT-Vision으로 분석
        result = {'source_tables': {}, 'data_source': 'gpt-vision-auto'}
        result.update(self._get_document_info(doc_id))
        result['doc_id'] = doc_id
        result['data_year'] = result.get('report_year', 2024) - 1

        gpt_data = self._extract_with_gpt_vision(doc_id, candidates)

        if not gpt_data:
            print("GPT-Vision으로 데이터 추출 실패, 정규식 fallback 시도...")
            return self.extract_for_document(doc_id, use_gpt=False)

        result.update(gpt_data)
        data = result

        # 4. DB에 저장
        if data and (data.get('s1') or data.get('s2')):
            print(f"\n[Step 4] DB에 저장 중...")
            self.save_to_summary(data)
            print(f"✅ 저장 완료: {data.get('company_name')} {data.get('report_year')}")
            return data
        else:
            print("추출된 데이터가 없습니다.")
            return None

    def _find_all_tables_with_images(self, doc_id: int) -> List[Dict]:
        """이미지가 있는 표만 가져오기"""
        sql = """
            SELECT dt.id, dt.title, dt.page_no, dt.image_path,
                   (SELECT COUNT(*) FROM table_cells tc WHERE tc.table_id = dt.id) as cell_count,
                   d.filename
            FROM doc_tables dt
            JOIN documents d ON dt.doc_id = d.id
            WHERE dt.doc_id = :doc_id
              AND dt.image_path IS NOT NULL
            ORDER BY dt.page_no
        """
        with engine.connect() as conn:
            rows = conn.execute(text(sql), {'doc_id': doc_id}).fetchall()

        tables = []
        for r in rows:
            table_id, title, page_no, image_path, cell_count, filename = r

            # 실제 이미지 파일 존재 확인
            doc_name = filename.replace('.pdf', '')
            abs_path = STRUCTURED_DATA_PATH / doc_name / image_path

            if abs_path.exists():
                tables.append({
                    'id': table_id,
                    'title': title,
                    'page_no': page_no,
                    'image_path': str(abs_path),
                    'cell_count': cell_count
                })

        return tables

    def _score_tables_for_relevance(self, tables: List[Dict]) -> List[Dict]:
        """GPT-4o-mini로 각 표의 관련도 점수 매기기"""
        scored = []

        for table in tables:
            try:
                # 이미지 인코딩
                image_base64 = self._encode_image(Path(table['image_path']))

                # GPT-4o-mini로 빠르게 점수 매기기
                prompt = """이 표가 온실가스 배출량 데이터(Scope 1, 2, 3)를 포함하고 있을 가능성을 0-100 점수로 평가하세요.

## 평가 기준
- 100점: Scope 1, 2, 3 배출량이 명확히 표시됨
- 80-90점: 온실가스/배출량 관련 수치가 있음
- 50-70점: 환경 관련 데이터이지만 배출량은 불확실
- 30-50점: 일반 ESG 지표 (에너지, 폐기물 등)
- 0-30점: 배출량과 무관 (재무, 인사, 개요 등)

**반드시 숫자만 반환하세요 (예: 85)**
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
                                        "detail": "low"  # 저해상도로 빠르게
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=10,
                    temperature=0
                )

                score_text = response.choices[0].message.content.strip()
                # 숫자만 추출
                score = int(re.search(r'\d+', score_text).group())

                table['score'] = score
                scored.append(table)
                print(f"  Table {table['id']}: {score}점")

            except Exception as e:
                print(f"  Table {table['id']}: 점수 계산 실패 ({e})")
                table['score'] = 0
                scored.append(table)

        return scored

    def save_to_summary(self, data: Dict[str, Any]) -> int:
        """추출된 데이터를 emission_summary 테이블에 저장"""
        sql = """
            INSERT INTO emission_summary
            (doc_id, company_name, report_year, data_year,
             s1, s2, s3, yearly_emissions, base_year, base_emissions,
             revenue, allowance, source_tables, data_source)
            VALUES
            (:doc_id, :company_name, :report_year, :data_year,
             :s1, :s2, :s3, :yearly_emissions, :base_year, :base_emissions,
             :revenue, :allowance, :source_tables, :data_source)
            ON DUPLICATE KEY UPDATE
                s1 = VALUES(s1),
                s2 = VALUES(s2),
                s3 = VALUES(s3),
                yearly_emissions = VALUES(yearly_emissions),
                base_year = VALUES(base_year),
                base_emissions = VALUES(base_emissions),
                revenue = VALUES(revenue),
                allowance = VALUES(allowance),
                source_tables = VALUES(source_tables),
                data_source = VALUES(data_source),
                updated_at = CURRENT_TIMESTAMP
        """

        params = {
            'doc_id': data.get('doc_id'),
            'company_name': data.get('company_name'),
            'report_year': data.get('report_year'),
            'data_year': data.get('data_year'),
            's1': data.get('s1'),
            's2': data.get('s2'),
            's3': data.get('s3'),
            'yearly_emissions': json.dumps(data.get('yearly_emissions', {})),
            'base_year': data.get('base_year'),
            'base_emissions': data.get('base_emissions'),
            'revenue': data.get('revenue'),
            'allowance': data.get('allowance'),
            'source_tables': json.dumps(data.get('source_tables', {})),
            'data_source': data.get('data_source', 'auto')
        }

        with engine.connect() as conn:
            result = conn.execute(text(sql), params)
            conn.commit()
            print(f"[Extractor] Saved to emission_summary: {data.get('company_name')} {data.get('report_year')}")
            return result.rowcount


# CLI 테스트용
if __name__ == "__main__":
    import sys

    extractor = EmissionExtractor()

    # 인자로 모드 선택: python emission_extractor.py [regex|gpt|vision|auto] [--save]
    args = [arg.lower() for arg in sys.argv[1:]]

    # AUTO 모드: 자동 추출 및 저장
    if 'auto' in args:
        print("🤖 자동 추출 모드")
        doc_id = 2  # 기본값

        # doc_id 지정 가능: python ... auto --doc-id=4
        for arg in sys.argv[1:]:
            if arg.startswith('--doc-id='):
                doc_id = int(arg.split('=')[1])

        result = extractor.extract_and_save_auto(doc_id)

        if result:
            print("\n" + "=" * 60)
            print("✅ 추출 및 저장 완료!")
            print("=" * 60)
            print(f"회사: {result.get('company_name')}")
            print(f"S1: {result.get('s1')}")
            print(f"S2: {result.get('s2')}")
            print(f"S3: {result.get('s3')}")
            print(f"Revenue: {result.get('revenue')}")
        else:
            print("\n❌ 추출 실패")

        sys.exit(0)

    # 일반 모드
    if 'vision' in args:
        use_gpt = 'vision'
        mode = "GPT-4V 이미지"
    elif 'gpt' in args:
        use_gpt = True
        mode = "GPT 텍스트"
    else:
        use_gpt = False
        mode = "정규식"

    auto_save = '--save' in args

    # HDEC 2025 보고서 (doc_id=2) 테스트
    print("=" * 60)
    print(f"HDEC 데이터 추출 테스트 [{mode} 모드]")
    print("=" * 60)

    data = extractor.extract_for_document(doc_id=2, use_gpt=use_gpt)

    print("\n추출 결과:")
    for k, v in data.items():
        print(f"  {k}: {v}")

    # DB에 저장
    if auto_save:
        print("\n자동 저장 중...")
        extractor.save_to_summary(data)
        print("저장 완료!")
    else:
        print("\n* DB에 저장하려면 --save 플래그를 추가하세요.")
        print("\n사용법:")
        print("  정규식:      python3 -m app.services.emission_extractor")
        print("  GPT 텍스트:  python3 -m app.services.emission_extractor gpt")
        print("  GPT 비전:    python3 -m app.services.emission_extractor vision")
        print("  🤖 자동 추출: python3 -m app.services.emission_extractor auto")
        print("  저장:        python3 -m app.services.emission_extractor vision --save")
