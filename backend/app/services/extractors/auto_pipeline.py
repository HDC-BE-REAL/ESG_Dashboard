"""
자동 추출 파이프라인 (Rerank 기반)
"""
import os
import re
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
    """이미지가 있는 표만 가져오기"""
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


def score_tables_for_relevance(tables: List[Dict]) -> List[Dict]:
    """GPT-4o-mini로 각 표의 관련도 점수 매기기"""
    scored = []

    for table in tables:
        try:
            # 이미지 인코딩
            image_base64 = encode_image(Path(table['image_path']))

            # GPT-4o-mini로 빠르게 점수 매기기
            prompt = """이 표가 ESG 데이터 추출에 필요한 정보를 포함하고 있는지 0-100 점수로 평가하세요.

## 평가 기준 (엄격함)
- **100점 (필수)**: 온실가스 배출량 **Scope 1, 2, 3가 모두** 한 표에 포함되어 있음. (가장 중요)
- **80점**: Scope 1, 2는 있으나 Scope 3가 명확하지 않음.
- **90점 (별도)**: 에너지 사용량(Energy Consumption) 또는 에너지 집약도(Energy Intensity)가 명확히 포함됨.
- **90점 (별도)**: 매출액(Revenue) 등 재무 데이터가 포함됨.
- 0-30점: 단순 환경 목표, 텍스트 위주의 설명, 또는 무관한 데이터.

**중요: Scope 3가 없는 단순 배출량 표는 80점 이하로 평가하세요. Scope 1, 2, 3가 모두 있어야 100점입니다.**
**반드시 숫자만 반환하세요 (예: 100)**
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
