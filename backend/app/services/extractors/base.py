"""
공통 유틸리티 함수들
"""
import re
from typing import Optional, Dict, List
from sqlalchemy import text
from ...database import engine


def parse_number(text: str) -> Optional[float]:
    """텍스트에서 숫자 추출"""
    if not text:
        return None
    clean = re.sub(r'[^\d.-]', '', text.replace(',', ''))
    try:
        return float(clean)
    except:
        return None


def parse_korean_currency(text: str) -> Optional[float]:
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


def detect_year_columns(table_id: int) -> Dict[int, int]:
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


def find_row_by_patterns(table_id: int, patterns: List[str]) -> Optional[int]:
    """모든 컬럼에서 패턴 매칭하여 row_idx 반환 (정확한 매칭 우선)"""
    sql = """
        SELECT row_idx, col_idx, content
        FROM table_cells
        WHERE table_id = :table_id
          AND content IS NOT NULL
        ORDER BY row_idx, col_idx
    """
    with engine.connect() as conn:
        rows = conn.execute(text(sql), {'table_id': table_id}).fetchall()

    # 정확한 매칭을 위해 row별로 그룹화
    row_contents = {}
    for row_idx, col_idx, content in rows:
        if row_idx not in row_contents:
            row_contents[row_idx] = []
        row_contents[row_idx].append((col_idx, content))

    # 패턴 우선순위대로 검색
    for pattern in patterns:
        # col_idx가 작은 컬럼(왼쪽)을 우선하여 매칭
        for row_idx in sorted(row_contents.keys()):
            for col_idx, content in sorted(row_contents[row_idx], key=lambda x: x[0]):
                if re.search(pattern, content, re.IGNORECASE):
                    return row_idx

    return None


def get_cell_value(table_id: int, row_idx: int, col_idx: int) -> Optional[float]:
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
            return parse_number(result[1])

    return None


def get_document_info(doc_id: int) -> Optional[Dict]:
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
