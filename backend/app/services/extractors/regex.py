"""
정규식 기반 배출량 추출
"""
from typing import Optional, Dict, List
from sqlalchemy import text
from ...database import engine
from .base import (
    detect_year_columns,
    find_row_by_patterns,
    get_cell_value,
    parse_korean_currency
)


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


def find_emission_tables(doc_id: int) -> List[Dict]:
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


def extract_scope_1_2(doc_id: int, tables: List[Dict]) -> Optional[Dict]:
    """Scope 1, 2 데이터 추출"""
    # 우선순위: "온실가스 총 배출량" 또는 "Scope 1&2" 포함 표
    priority_tables = [t for t in tables if '총' in (t['title'] or '') or '현황' in (t['title'] or '')]
    search_tables = priority_tables if priority_tables else tables

    for table in search_tables:
        table_id = table['id']

        # 연도 컬럼 탐지
        year_cols = detect_year_columns(table_id)
        if not year_cols:
            continue

        # Scope 1 row 찾기
        scope1_row = find_row_by_patterns(table_id, SCOPE1_PATTERNS)
        # Scope 2 row 찾기
        scope2_row = find_row_by_patterns(table_id, SCOPE2_PATTERNS)
        # Scope 1+2 합계 row 찾기
        scope1_2_row = find_row_by_patterns(table_id, SCOPE1_2_PATTERNS)

        if scope1_row is None and scope2_row is None:
            continue

        # 최신 연도 데이터 추출
        latest_year = max(year_cols.keys())
        latest_col = year_cols[latest_year]

        s1 = get_cell_value(table_id, scope1_row, latest_col) if scope1_row else None
        s2 = get_cell_value(table_id, scope2_row, latest_col) if scope2_row else None

        # 연도별 데이터 (Scope 1+2 합계)
        yearly = {}
        if scope1_2_row is not None:
            for year, col in year_cols.items():
                val = get_cell_value(table_id, scope1_2_row, col)
                if val:
                    yearly[str(year)] = val

        # 기준연도 찾기
        base_year = None
        base_emissions = None
        if year_cols:
            sorted_years = sorted(year_cols.keys())
            if sorted_years[0] < 2020:  # 2019, 2020 등이면 기준연도
                base_year = sorted_years[0]
                if scope1_2_row is not None:
                    base_emissions = get_cell_value(table_id, scope1_2_row, year_cols[base_year])

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


def extract_scope_3(doc_id: int, tables: List[Dict]) -> Optional[Dict]:
    """Scope 3 데이터 추출 (연도별)"""
    # Scope 3 관련 표 찾기
    scope3_tables = [t for t in tables if 'Scope' in (t['title'] or '') and '3' in (t['title'] or '')]
    if not scope3_tables:
        scope3_tables = tables

    for table in scope3_tables:
        table_id = table['id']

        year_cols = detect_year_columns(table_id)
        if not year_cols:
            continue

        scope3_row = find_row_by_patterns(table_id, SCOPE3_PATTERNS)
        if scope3_row is None:
            continue

        # 최신 연도 데이터
        latest_year = max(year_cols.keys())
        latest_col = year_cols[latest_year]
        s3 = get_cell_value(table_id, scope3_row, latest_col)

        # 연도별 데이터 추출
        yearly_s3 = {}
        for year, col in year_cols.items():
            val = get_cell_value(table_id, scope3_row, col)
            if val:
                yearly_s3[str(year)] = val

        if s3 or yearly_s3:
            print(f"[Extractor] Table {table_id}: S3={s3}, Yearly={len(yearly_s3)} years")
            return {
                'table_id': table_id,
                's3': s3,
                'yearly_s3': yearly_s3
            }

    return None


def extract_revenue(doc_id: int) -> Optional[Dict]:
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
            revenue = parse_korean_currency(content)
            if revenue and revenue > 1000:  # 최소 1000억 이상
                print(f"[Extractor] Table {table_id}: Revenue={revenue}억")
                return {
                    'table_id': table_id,
                    'revenue': revenue
                }

    return None





def extract_energy_intensity(doc_id: int) -> Optional[Dict]:
    """에너지 사용 집약도 추출 (연도별)"""
    sql = """
        SELECT dt.id, dt.title
        FROM doc_tables dt
        WHERE dt.doc_id = :doc_id
          AND (dt.title LIKE '%에너지%' OR dt.title LIKE '%사용량%'
               OR dt.title LIKE '%집약도%' OR dt.title LIKE '%원단위%')
        LIMIT 10
    """
    with engine.connect() as conn:
        tables = conn.execute(text(sql), {'doc_id': doc_id}).fetchall()

    for table_id, title in tables:
        # 먼저 연도 컬럼 탐지
        year_cols = detect_year_columns(table_id)
        
        # 에너지 집약도 행 찾기 (col 0에서 찾기)
        sql = """
            SELECT row_idx
            FROM table_cells
            WHERE table_id = :table_id
              AND col_idx = 0
              AND (content LIKE '%에너지집약도%' OR content LIKE '%에너지 집약도%')
            LIMIT 1
        """
        with engine.connect() as conn:
            row_result = conn.execute(text(sql), {'table_id': table_id}).fetchone()
        
        if not row_result:
            continue
        
        intensity_row = row_result[0]
        
        # 해당 행의 연도별 값 추출
        latest_value = None
        yearly_energy = {}
        
        if year_cols:
            for year, col_idx in year_cols.items():
                val = get_cell_value(table_id, intensity_row, col_idx)
                if val and 0.01 <= val <= 100:  # 에너지 집약도 범위
                    yearly_energy[str(year)] = val
        
        # 최신 연도 값 결정
        if yearly_energy:
            latest_year = max(int(y) for y in yearly_energy.keys())
            latest_value = yearly_energy[str(latest_year)]
        
        if latest_value or yearly_energy:
            print(f"[Extractor] Table {table_id}: Energy Intensity={latest_value} TJ/매출 1억원, Yearly={len(yearly_energy)} years")
            return {
                'table_id': table_id,
                'energy_intensity': latest_value,
                'yearly_energy_intensity': yearly_energy
            }
    
    return None



