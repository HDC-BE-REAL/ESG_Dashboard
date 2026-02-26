"""
자동 문서 전체 페이지 단위 추출 파이프라인 (Rerank 기반)
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


def find_all_pages_with_images(doc_id: int) -> List[Dict]:
    """이미지가 있는 전체이지만 가져오기 (문서 후반부 40%만) + 원본 텍스트(full_markdown) 포함"""
    sql = """
        SELECT p.id, p.page_no, p.image_path, p.full_markdown,
               d.filename,
               d.total_pages
        FROM pages p
        JOIN documents d ON p.doc_id = d.id
        WHERE p.doc_id = :doc_id
          AND p.image_path IS NOT NULL
        ORDER BY p.page_no DESC
    """
    with engine.connect() as conn:
        rows = conn.execute(text(sql), {'doc_id': doc_id}).fetchall()

    pages = []

    for r in rows:
        page_id, page_no, image_path, full_markdown, filename, total_pages = r

        # Skip tables in the first 60% of the document (Data appendices are almost always in the last 40%)
        if total_pages and page_no < (total_pages * 0.6):
            continue

        doc_name = filename.replace('.pdf', '')
        base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
        
        env_path = os.getenv("STRUCTURED_DATA_PATH")
        if env_path and Path(env_path).is_absolute():
            abs_path = Path(env_path) / doc_name / image_path
        else:
            abs_path = base_dir / "PDF_Extraction" / "data" / "pages_structured" / doc_name / image_path

        if abs_path.exists():
            pages.append({
                'id': page_id,
                'title': f"Page {page_no}",
                'page_no': page_no,
                'image_path': str(abs_path),
                'full_markdown': full_markdown or "",
                'cell_count': 100 
            })
        else:
            print(f"이미지 누락: {abs_path}")

    return pages


def pass_1_and_2_text_filter(pages_list: List[Dict], target_year: int = 2024) -> Dict[str, List[Dict]]:
    """Pass 1 & 2: 비용 0원, 순수 텍스트 기반 후보군 필터링 및 함정 제거"""
    candidates = {
        'emission': [],
        'energy': [],
        'revenue': []
    }
    
    prev_year_str = str(target_year - 1)

    for p in pages_list:
        text = p['full_markdown'].lower()
        text_no_space = text.replace(" ", "")
        
        # 전년도(Target - 1) 필수 포함 검사 (보고서의 시계열 실적표라면 무조건 존재해야 함)
        short_yr = prev_year_str[-2:]
        import re
        # 페이지 내에 20xx 형태의 연도 표기가 아예 없는지 확인 (표가 길어서 다음 페이지로 넘어간 경우 헤더가 없을 수 있음)
        has_any_year = bool(re.search(r'\b20\d{2}\b', text))
        
        has_target_year = prev_year_str in text or f"'{short_yr}" in text or f"{short_yr}년" in text
        
        # 연도 표기가 존재하는데 타겟 연도가 없다면 과거/미래 데이터 표이므로 무시. 연도가 아예 없으면 다중 페이지 표일 확률이 있으므로 통과.
        if has_any_year and not has_target_year:
            continue

        # Pass 1: 카테고리별 필수 키워드 검사 (Keyword Filter)
        
        # Emission
        has_scope1 = ('scope1' in text_no_space) or ('직접배출' in text_no_space)
        has_scope2 = ('scope2' in text_no_space) or ('간접배출' in text_no_space)
        has_ghg = ('온실가스' in text) or ('탄소' in text) or ('ghg' in text) or ('emissions' in text)
        if has_scope1 and has_scope2 and has_ghg:
            p_copy = p.copy()
            p_copy['category'] = 'emission'
            candidates['emission'].append(p_copy)
            
        # 에너지 집약도 단위에 gj 추가
        # Energy
        has_energy = ('에너지' in text) or ('energy' in text)
        has_nrg_unit = ('집약도' in text) or ('원단위' in text) or ('intensity' in text) or ('tj' in text) or ('mwh' in text) or ('toe' in text) or ('gj' in text)
        if has_energy and has_nrg_unit:
            p_copy = p.copy()
            p_copy['category'] = 'energy'
            candidates['energy'].append(p_copy)
            
        # Revenue
        has_rev = ('매출액' in text) or ('매출' in text) or ('영업이익' in text) or ('revenue' in text) or ('경제적가치' in text_no_space) or ('손익' in text)
        has_rev_unit = ('단위' in text) or ('unit' in text) or ('백만원' in text) or ('억원' in text) or ('천원' in text) or ('krw' in text) or ('usd' in text)
        if has_rev and has_rev_unit:
            p_copy = p.copy()
            p_copy['category'] = 'revenue'
            candidates['revenue'].append(p_copy)
            
    return candidates


def pass_3_expert_verification(candidate_pools: Dict[str, List[Dict]]) -> List[Dict]:
    """Pass 3: 텍스트 검문을 통과한 이미지만 GPT 전문가에게 검증 요청 (0~100점)"""
    scored = []
    
    prompts = {
        'emission': "당신은 ESG 온실가스 데이터 전문가입니다. 해당 이미지가 **과거 3개년 이상의 Scope 1, Scope 2 배출량 수치**를 명확히 포함하고 있는 정식 '환경 데이터 실적표(Performance Data)'가 맞는지 평가하세요. 맞다면 100점, 일부만 있거나 텍스트/그래프 위주면 50점 이하, 검증성명서/목차면 0점을 부여하세요.",
        'energy': "당신은 ESG 에너지 데이터 전문가입니다. 해당 이미지가 **과거 3개년 이상의 에너지 사용량 및 에너지 집약도(원단위)** 수치를 명확히 포함하고 있는 정식 '환경 데이터 실적표(Performance Data)'가 맞는지 평가하세요. 맞다면 100점, 일부만 있거나 텍스트/그래프 위주면 50점 이하, 검증성명서/목차면 0점을 부여하세요.",
        'revenue': "당신은 재무 데이터 전문가입니다. 해당 이미지가 **과거 3개년 이상의 연결 매출액/영업이익** 수치를 명확히 포함하고 있는 정식 '재무상태표/손익계산서/경제적 가치 창출표'가 맞는지 평가하세요. 맞다면 100점, 일부만 있거나 텍스트/그래프 위주면 50점 이하, 검증성명서/목차면 0점을 부여하세요."
    }

    for category, pages in candidate_pools.items():
        print(f"[{category.upper()}] 후보 페이지 {len(pages)}개 GPT 검증 시작...")
        for page_item in pages:
            try:
                image_base64 = encode_image(Path(page_item['image_path']))
                
                sys_prompt = prompts[category] + '\n출력 형식 (오직 JSON만): {"is_valid_data_table": true/false, "reason": "이유", "score": 0~100}'
                
                response = openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": "You must respond with a valid JSON object only."},
                        {"role": "user", "content": [
                            {"type": "text", "text": sys_prompt},
                            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_base64}", "detail": "high"}}
                        ]}
                    ],
                    max_tokens=200,
                    temperature=0
                )
                
                data = json.loads(response.choices[0].message.content.strip())
                score = int(data.get('score', 0))
                
                # Pass 4: 소수점 Tie-breaker 가중치 (문서 뒤쪽일수록 미세하게 높은 점수)
                decimal_bonus = (page_item.get('page_no', 0) % 1000) / 1000.0
                final_score = min(100.999, score + decimal_bonus)
                
                page_item['score'] = final_score
                scored.append(page_item)
                print(f"  -> Page {page_item['page_no']}: {final_score:.3f}점 ({data.get('reason', '')[:30]}...)")
                
                # 100점 만점이 나왔으면 해당 카테고리는 조기 종료 (비용 절약)
                if score == 100:
                    print(f"  -> {category} 완벽한 표 탐지. 조기 종료.")
                    break
                    
            except Exception as e:
                print(f"  Page {page_item['page_no']} GPT Error: {e}")
                page_item['score'] = 0
                scored.append(page_item)
                
    return scored


def select_top_candidates_by_category_pages(scored_pages: List[Dict], min_score: float = 60.0) -> Dict[str, List[Dict]]:
    """Pass 4: 카테고리별로 소수점까지 비교하여 결함 없는 최고의 Top 1 페이지 선정"""
    candidates = [p for p in scored_pages if p['score'] >= min_score]

    by_category = {
        'emission': [],
        'revenue': [],
        'energy': []
    }

    for p in candidates:
        category = p.get('category')
        if category in by_category:
            by_category[category].append(p)

    top_candidates = {}
    for category, pages_l in by_category.items():
        if pages_l:
            sorted_pages = sorted(pages_l, key=lambda x: x['score'], reverse=True)
            top_page = sorted_pages[0]
            top_candidates[category] = [top_page]
            print(f"[{category.upper()}] 최종 선정: Page {top_page['page_no']} (점수: {top_page['score']:.3f})")

    return top_candidates
