"""
자동 추출 파이프라인 (Rerank 기반)
"""
import os
import re
import json
from pathlib import Path
from typing import List, Dict
from sqlalchemy import text
from openai import OpenAI
from dotenv import load_dotenv
from ...database import engine
from .gpt_vision import encode_image

load_dotenv()
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

STRUCTURED_DATA_PATH = Path(os.getenv("STRUCTURED_DATA_PATH", "../PDF_Extraction/data/pages_structured"))


def find_all_tables_with_images(doc_id: int) -> List[Dict]:
    """이미지가 있는 표만 가져오기 (키워드 우선순위 적용)"""
    sql = """
        SELECT dt.id, dt.title, dt.page_no, dt.image_path,
               (SELECT COUNT(*) FROM table_cells tc WHERE tc.table_id = dt.id) as cell_count,
               d.filename
        FROM doc_tables dt
        JOIN documents d ON dt.doc_id = d.id
        WHERE dt.doc_id = :doc_id
          AND dt.image_path IS NOT NULL
        ORDER BY dt.page_no DESC
    """
    with engine.connect() as conn:
        rows = conn.execute(text(sql), {'doc_id': doc_id}).fetchall()

    # 키워드 리스트 (배출량 관련) - PDF에 실제로 있는 표현 사용
    priority_keywords = [
        '온실가스', '배출', 'emission', 'ghg',
        'scope 1', 'scope 2', 'scope 3', 'scope1', 'scope2', 'scope3',
        '탄소', 'carbon', '환경', 'environmental',
        '에너지', 'energy', '매출', 'revenue', '재무', 'financial'
    ]

    tables = []
    priority_tables = []  # 키워드 매칭 테이블

    for r in rows:
        table_id, title, page_no, image_path, cell_count, filename = r

        # 실제 이미지 파일 존재 확인
        doc_name = filename.replace('.pdf', '')
        abs_path = STRUCTURED_DATA_PATH / doc_name / image_path

        if abs_path.exists():
            table_data = {
                'id': table_id,
                'title': title,
                'page_no': page_no,
                'image_path': str(abs_path),
                'cell_count': cell_count
            }

            # 제목에 키워드가 있으면 우선순위 테이블로
            if title:
                title_lower = title.lower()
                has_keyword = any(kw in title_lower for kw in priority_keywords)
                if has_keyword:
                    priority_tables.append(table_data)
                else:
                    tables.append(table_data)
            else:
                tables.append(table_data)

    # 키워드 매칭 테이블을 앞에 배치
    return priority_tables + tables


def score_tables_for_relevance(tables: List[Dict]) -> List[Dict]:
    """GPT-4o-mini로 각 표의 관련도 점수 매기기 + 카테고리 분류"""
    scored = []

    for table in tables:
        try:
            # 이미지 인코딩
            image_base64 = encode_image(Path(table['image_path']))

            # GPT-4o-mini로 빠르게 점수 매기기 + 카테고리 분류
            prompt = """이 표가 ESG 데이터 추출에 필요한 정보를 포함하고 있는지 0-100 점수로 평가하고, 카테고리를 분류하세요.

## 평가 기준
- **100점**: 온실가스 배출량 Scope 1, 2, 3가 모두 포함
- **80점**: Scope 1, 2는 있으나 Scope 3 없음
- **90점**: 에너지 사용량/집약도 명확히 포함
- **90점**: 매출액(Revenue) 등 재무 데이터 포함
- 0-30점: 무관한 데이터

## 카테고리
- **emission**: 온실가스 배출량 (Scope 1, 2, 3)
- **revenue**: 매출액, 재무 데이터
- **energy**: 에너지 사용량, 에너지 집약도
- **other**: 기타

**출력 형식 (JSON):**
{"score": 숫자, "category": "카테고리"}

예시: {"score": 80, "category": "emission"}
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
                                    "detail": "low"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=50,
                temperature=0
            )

            response_text = response.choices[0].message.content.strip()

            # JSON 파싱 시도
            try:
                # 코드 블록 제거
                if response_text.startswith("```"):
                    response_text = re.sub(r'^```json?\s*', '', response_text)
                    response_text = re.sub(r'```.*$', '', response_text, flags=re.DOTALL)

                data = json.loads(response_text)
                score = int(data.get('score', 0))
                category = data.get('category', 'other')
            except:
                # JSON 파싱 실패 시 숫자만 추출 (backward compatibility)
                score_match = re.search(r'\d+', response_text)
                score = int(score_match.group()) if score_match else 0
                category = 'other'

            table['score'] = score
            table['category'] = category
            scored.append(table)
            print(f"  Table {table['id']}: {score}점 ({category})")

        except Exception as e:
            print(f"  Table {table['id']}: 점수 계산 실패 ({e})")
            table['score'] = 0
            scored.append(table)

    return scored


def count_year_columns(table_id: int) -> int:
    """표에 연도 컬럼이 몇 개나 있는지 확인"""
    sql = """
        SELECT COUNT(DISTINCT col_idx)
        FROM table_cells
        WHERE table_id = :table_id
          AND row_idx = 0
          AND content REGEXP '20[0-9]{2}'
    """
    with engine.connect() as conn:
        result = conn.execute(text(sql), {'table_id': table_id}).fetchone()
        return result[0] if result else 0


def select_top_candidates_by_category(scored_tables: List[Dict], min_score: int = 60) -> Dict[str, List[Dict]]:
    """카테고리별로 Top 1 후보 선택 (GPT-4o 사용 최소화)

    동점일 때는 연도 컬럼이 많은 표를 우선 선택
    """
    # 점수 기준 필터링
    candidates = [t for t in scored_tables if t['score'] >= min_score]

    # 카테고리별 그룹화
    by_category = {
        'emission': [],
        'revenue': [],
        'energy': [],
        'other': []
    }

    for table in candidates:
        category = table.get('category', 'other')
        by_category[category].append(table)

    # 각 카테고리에서 Top 1 선택
    top_candidates = {}
    for category, tables in by_category.items():
        if tables:
            # 1차: 점수 내림차순
            # 2차: 연도 컬럼 개수 내림차순 (동점 시 더 많은 과거 데이터 우선)
            for t in tables:
                t['year_count'] = count_year_columns(t['id'])

            sorted_tables = sorted(tables,
                                 key=lambda x: (x['score'], x['year_count']),
                                 reverse=True)

            top_table = sorted_tables[0]
            top_candidates[category] = [top_table]

            year_info = f", {top_table['year_count']}개년" if top_table['year_count'] > 0 else ""
            print(f"[{category.upper()}] Top 1: Table {top_table['id']} (점수: {top_table['score']}{year_info})")

    return top_candidates
