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

    base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
    env_path = os.getenv("STRUCTURED_DATA_PATH")
    
    if env_path and Path(env_path).is_absolute():
        abs_path = Path(env_path) / doc_name / image_rel_path
    else:
        abs_path = base_dir / "PDF_Extraction" / "data" / "pages_structured" / doc_name / image_rel_path

    return abs_path if abs_path.exists() else None


def get_page_image_path(page_id: int) -> Optional[Path]:
    """페이지 이미지 경로 조회 및 절대 경로 반환"""
    sql = """
        SELECT p.image_path, d.filename
        FROM pages p
        JOIN documents d ON p.doc_id = d.id
        WHERE p.id = :page_id
    """
    with engine.connect() as conn:
        result = conn.execute(text(sql), {'page_id': page_id}).fetchone()

    if not result or not result[0]:
        return None

    image_rel_path = result[0]
    filename = result[1]

    doc_name = filename.replace('.pdf', '')
    
    base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
    env_path = os.getenv("STRUCTURED_DATA_PATH")
    
    if env_path and Path(env_path).is_absolute():
        abs_path = Path(env_path) / doc_name / image_rel_path
    else:
        abs_path = base_dir / "PDF_Extraction" / "data" / "pages_structured" / doc_name / image_rel_path

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
        category = table.get('category', 'emission')

        # 카테고리 기각: 명백히 다른 카테고리의 표면 배출량 추출에서 제외
        if category in ['revenue', 'energy']:
            print(f"[GPT-Vision] Table {table_id}는 '{category}' 카테고리이므로 배출량 추출에서 제외")
            continue

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
1. **온실가스 배출량(GHG Emissions)**: 반드시 추출해야 할 대상입니다. (단위: tCO2e 등)
2. **에너지 사용량(Energy Consumption)**: 에너지 표 내부에도 Scope 1, 2 구분이 있을 수 있습니다. (단위: TJ, TOE, MWh 등) **절대로 에너지 사용량의 Scope 1, 2 수치를 온실가스 배출량으로 착각하여 추출하지 마세요! 만약 표 제목이나 단위가 명백히 '에너지 사용량'이라면 추출을 멈추고 모두 null로 반환하세요.**
3. **총배출량/총합** = Scope 1 + Scope 2의 합계 (이것을 추출하지 마세요!)
4. **Scope 1** = 직접 온실가스 배출 (이것을 s1_YYYY에 넣으세요)
5. **Scope 2** = 간접 온실가스 배출 (이것을 s2_YYYY에 넣으세요)
6. **Scope 3** = 기타 간접 온실가스 배출 (이것을 s3_YYYY에 넣으세요)

**국내/해외 구분 및 합계(Total)가 있는 경우의 원칙:**
- 🚨 **가장 중요:** 표에서 특정 연도(예: 2024년)의 데이터 세로 단이 '국내(Domestic)', '해외(Overseas)', '계(Total/합계)' 등 여러 개로 쪼개져 있다면, **나머지는 쳐다보지도 말고 무조건 '계(Total)' 열의 가장 큰 최종 합산 숫자만 쏙 뽑아내세요!**
- '국내' 단이나 '해외' 단 단독 값(예: 3780)을 `s1_2024`로 착각해서 함부로 추출하는 것은 끔찍한 오답입니다. 오직 전체 합계(예: 105329)만을 추출하세요.

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
        return result

    return None

def extract_with_gpt_vision_pages(doc_id: int, pages_list: List[Dict], model: str = "gpt-4o") -> Optional[Dict]:
    if not pages_list:
        return None

    result = {'source_pages': {}}

    for page_item in pages_list[:10]:
        page_id = page_item['id']
        category = page_item.get('category', 'emission')

        if category in ['revenue', 'energy']:
            print(f"[GPT-Vision] Page {page_id}는 '{category}' 카테고리이므로 배출량 추출에서 제외")
            continue

        image_path = get_page_image_path(page_id)
        if not image_path or not image_path.exists():
            print(f"[GPT-Vision] Page {page_id} 이미지 없음, 건너뜀")
            continue

        try:
            image_base64 = encode_image(image_path)
            markdown_text = page_item.get('full_markdown', '')
        except Exception as e:
            continue

        prompt = """당신은 ESG 보고서 페이지의 시각적 표 구조를 완벽히 분석하고 필요한 숫자를 스스로 합산(Sum)할 수 있는 재무 데이터 추출 비전 전문가입니다. 아래 규칙에 따라 '온실가스 배출량(GHG Emissions)' 데이터를 정확히 추출하세요.

## 🚨 1급 경고: 총배출량과 Scope 1의 혼동 절대 금지!
**가장 흔하고 치명적인 오답은 표 최상단에 있는 '총합(Total, Scope 1 + Scope 2)'을 'Scope 1' 값으로 착각하여 추출하는 것입니다.**
- **총배출량/총합** (예: 195,762) = 이거 절대 추출하지 마세요!!
- **Scope 1** (직접 배출량) = 오직 이 라인의 숫자만 s1_YYYY에 넣으세요.
- **Scope 2** (간접 배출량) = 오직 이 라인의 숫자만 s2_YYYY에 넣으세요.

## 📋 핵심 판별 및 덧셈(SUM) 원칙
1. **합산 열(Total Column) 무조건 최우선**: 열(Column)이나 행(Row)이 '국내(Domestic)'와 '해외(Overseas)' 등으로 쪼개져 있다면, **'계(Total, 합계)'라고 적힌 전체 가맹 통합 숫자만 추출하세요.**
2. **⚠️ '합계(Total)' 열이 없는 경우 반드시 덧셈(SUM) 수행 ⚠️**: 표에 '계(Total)' 열이 없고 '국내'와 '해외'만 덩그러니 있다면, **당신이 직접 두 숫자를 모두 찾아 더한(SUM) 최종값을 결과로 반환해야 합니다.** (예: 국내 44,856, 해외 13,580 이면 둘을 더해서 58,436을 반환)
3. **🚨 지역 기반(Location-based) 최우선**: 표에 '지역 기반(Location-based)'과 '시장 기반(Market-based)' 숫자가 동시에 있다면, **무조건 '지역 기반' 숫자를 추출하고 시장 기반 숫자는 무시하세요!** (예: 삼성 Scope 2 시장기반 66,981은 오답, 지역기반 104,197이 정답!)

## 💡 Few-shot Example 1: 총합표 낚시 방어
**[표 형태]**
구분                   2024년
온실가스 배출량 총계      195,762    <-- 🚫 절대 추출 금지
  - Scope 1          91,565     <-- ✅ 이거 추출!

## 💡 Few-shot Example 2: 국내외 덧셈(SUM) 필수
**[표 형태]** (합계 열이 없는 경우)
구분                   국내      해외
Scope 1              44,856   13,580    <-- ✅ 44856 + 13580 산수 결과인 '58436' 반환!
Scope 2              71,856    1,146    <-- ✅ 71856 + 1146 산수 결과인 '73002' 반환!

**[올바른 JSON 반환 예시]**
{
  "s1_2024": 58436, "s2_2024": 73002, "s3_2024": 5269326,
  "s1_2023": 51720, "s2_2023": 73660, "s3_2023": 6074633,
  "s1_2022": 51624, "s2_2022": 69227, "s3_2022": 4081373
}

## 🎯 최종 요청 사항
절대로 부분 수치(해외만, 국내만)를 리턴하지 마세요. 반드시 총합(Total) 열을 찾거나, 없으면 스스스로 더하세요(SUM). 제공된 이미지에서 숫자를 추출하여 **반드시 순수한 JSON 객체만** 반환해야 합니다. 숫자 안의 쉼표(,)는 모두 제거하세요. 데이터가 없으면 필드 값에 null을 넣거나 생략하세요.
"""

        try:
            print(f"[GPT-Vision] Page {page_id} 분석 중 (모델: {model})...")
            response = openai_client.chat.completions.create(
                model=model,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that strictly outputs a JSON object."
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "text", "text": f"\n\n[OCR Markdown 텍스트 원본 (환각 방지 및 숫자 앵커용)]\n{markdown_text}\n\n*명령: 반드시 위 마크다운 텍스트 원본에 실제로 적힌 숫자 데이터만 추출하세요. 이미지 표 구조를 참고하되, 실제 배출량 값은 텍스트를 최우선으로 신뢰하세요.*"},
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
                max_tokens=4000,
                temperature=0,
                stream=True
            )

            full_content = ""
            for chunk in response:
                if chunk.choices[0].delta.content:
                    full_content += chunk.choices[0].delta.content

            content = full_content.strip()

            if len(content) < 50:
                continue

            cleaned_content = content
            if content.startswith("```"):
                cleaned_content = re.sub(r'^```json?\s*', '', content)
                cleaned_content = re.sub(r'```.*$', '', cleaned_content, flags=re.DOTALL)

            cleaned_content = re.sub(r':\s*(\d{1,3}(?:,\d{3})+)', lambda m: ': ' + m.group(1).replace(',', ''), cleaned_content)
            
            print(f"[GPT-Vision] Page {page_id} 파싱 전 응답 내용:\n{cleaned_content[:200]}...")

            try:
                data = json.loads(cleaned_content)
            except json.JSONDecodeError as e:
                # Try to find the first JSON object in the string
                match = re.search(r'\{.*?\}', cleaned_content, re.DOTALL)
                if match:
                    try:
                        data = json.loads(match.group(0))
                    except Exception as e2:
                        print(f"[GPT-Vision] Page {page_id} JSON 정규식 파싱 실패: {e2}")
                        continue
                else:
                    print(f"[GPT-Vision] Page {page_id} JSON 패턴 찾기 실패")
                    continue

            # 결과 병합
            if not result.get('s1'):
                for year in ['2024', '2023', '2022', '2021']:
                    if data.get(f's1_{year}'):
                        result['s1'] = float(data[f's1_{year}'])
                        result['source_pages']['s1'] = page_id
                        break

            if not result.get('s2'):
                for year in ['2024', '2023', '2022', '2021']:
                    if data.get(f's2_{year}'):
                        result['s2'] = float(data[f's2_{year}'])
                        result['source_pages']['s2'] = page_id
                        break

            if not result.get('s3'):
                for year in ['2024', '2023', '2022', '2021']:
                    if data.get(f's3_{year}'):
                        result['s3'] = float(data[f's3_{year}'])
                        result['source_pages']['s3'] = page_id
                        break
                        
            # 연도별 저장
            if not result.get('yearly_s1'):
                yearly_s1 = {}
                for year in ['2024', '2023', '2022', '2021']:
                    s1_val = data.get(f's1_{year}')
                    if s1_val: yearly_s1[year] = float(s1_val)
                if yearly_s1: result['yearly_s1'] = yearly_s1

            if not result.get('yearly_s2'):
                yearly_s2 = {}
                for year in ['2024', '2023', '2022', '2021']:
                    s2_val = data.get(f's2_{year}')
                    if s2_val: yearly_s2[year] = float(s2_val)
                if yearly_s2: result['yearly_s2'] = yearly_s2
                
            if not result.get('yearly_s3'):
                yearly_s3 = {}
                for year in ['2024', '2023', '2022', '2021']:
                    s3_val = data.get(f's3_{year}')
                    if s3_val: yearly_s3[year] = float(s3_val)
                if yearly_s3: result['yearly_s3'] = yearly_s3

            if result.get('s1') and result.get('s2') and result.get('s3'):
                print(f"[GPT-Vision] ✅ Page {page_id}에서 S1, S2, S3 모두 확보, 조기 종료")
                break

        except Exception as e:
            continue

    if result.get('source_pages'):
        return result

    return None



def extract_revenue_with_vision(tables: List[Dict]) -> Optional[Dict]:
    """Revenue만 추출하는 별도 함수 (간단한 프롬프트)"""
    for table in tables:
        category = table.get('category', 'revenue')
        if category in ['emission', 'energy']:
            continue
            
        table_id = table['id']
        image_path = get_table_image_path(table_id)

        if not image_path or not image_path.exists():
            continue

        try:
            image_base64 = encode_image(image_path)

            prompt = """이 표에서 **매출액(Revenue)** 데이터와 그 단위를 함께 찾아주세요.

**출력 형식:**
{"revenue": 숫자, "unit": "백만원" 또는 "억원" 또는 "원"}

예시 1: 표에 단위가 '백만원'이고 숫자가 '32,670,300' 이면 -> {"revenue": 32670300, "unit": "백만원"}
예시 2: 표에 단위가 '억원'이고 숫자가 '104,192' 이면 -> {"revenue": 104192, "unit": "억원"}
예시 3: 표에 단위가 '원'이고 숫자가 '30,000,000,000' 이면 -> {"revenue": 30000000000, "unit": "원"}

**주의:**
- 오직 '연결재무상태표', '포괄손익계산서', '매출 현황' 등의 핵심 재무 표에서만 추출하세요. 동반성장, 중소기업 상생, 기타 ESG 투자금액 표를 매출로 착각하지 마세요.
- 표 상단이나 제목 근처에 적힌 단위(백만원, 억원, 원 등)를 반드시 정확히 확인해서 "unit" 필드에 적어주세요.
- 숫자는 쉼표 없이 순수한 숫자만 적어주세요.
- 표에 여러 종류의 매출액이 있다면, '연결(Consolidated)' 기준의 가장 큰 '매출액 총계' 값을 가져오세요.
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
                print(f"[GPT-Vision] ✅ Table {table_id}에서 Revenue 추출: {data['revenue']}, 단위: {data.get('unit', '알수없음')}")
                return {
                    'revenue': float(data['revenue']),
                    'revenue_unit': data.get('unit', '억원'),
                    'source_tables': {'revenue': table_id}
                }

        except Exception as e:
            continue

    return None


def extract_energy_with_vision(tables: List[Dict]) -> Optional[Dict]:
    """Energy Intensity만 추출하는 별도 함수"""
    for table in tables:
        category = table.get('category', 'energy')
        if category in ['emission', 'revenue']:
            continue
            
        table_id = table['id']
        image_path = get_table_image_path(table_id)

        if not image_path or not image_path.exists():
            continue

        try:
            image_base64 = encode_image(image_path)

            prompt = """이 표에서 **에너지 집약도(Energy Intensity)** 데이터와 그 단위를 함께 찾아주세요.

**출력 형식:**
{"energy_intensity": 숫자, "energy_2023": 숫자, "energy_2022": 숫자, "unit": "단위 문자열"}

예시: {"energy_intensity": 105.2, "energy_2023": 110.5, "energy_2022": 112.1, "unit": "TJ/억원"}

**주의:**
- 표에 적힌 에너지 집약도의 정확한 단위를 "unit" 필드에 적어주세요 (예: TJ/억원, MWh/10억원, TJ/백만원 등).
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
                    'energy_unit': data.get('unit', 'TJ/억원'),
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

def extract_revenue_with_vision_pages(pages_list: List[Dict], model: str = "gpt-4o-mini") -> Optional[Dict]:
    """페이지 기반 Revenue 추출"""
    for page_item in pages_list[:5]:
        category = page_item.get('category', 'revenue')
        if category in ['emission', 'energy']:
            continue
            
        page_id = page_item['id']
        image_path = get_page_image_path(page_id)

        if not image_path or not image_path.exists():
            continue

        try:
            image_base64 = encode_image(image_path)
            markdown_text = page_item.get('full_markdown', '')

            prompt = """당신은 데이터 추출 전문가입니다. 이 페이지 이미지의 핵심 재무 표에서 **매출액(Revenue)** 데이터와 그 표에 명시된 '단위'를 찾아주세요.

**출력 형식 (반드시 JSON만 출력):**
{"revenue": 숫자, "unit": "표에 적힌 단위 문자열"}

예시 1: 표 단위가 '백만원'이고 숫자가 '32,670,300' 이면 -> {"revenue": 32670300, "unit": "백만원"}
예시 2: 표 단위가 '억원'이고 숫자가 '104,192' 이면 -> {"revenue": 104192, "unit": "억원"}
예시 3: 표 단위가 '원'이고 숫자가 '30,000,000,000' 이면 -> {"revenue": 30000000000, "unit": "원"}

**주의:**
- 오직 '연결재무상태표', '포괄손익계산서', '경제적 가치 창출' 등 핵심 재무 표에서만 구분하세요. (부록, 상생 투자 등 무관한 수치 무시)
- 표 상단에 적힌 단위(백만원, 억원, 천원, 원 등)를 명확히 확인해서 "unit" 필드에 그대로 적어주세요.
- 표에 여러 매출액이 있다면, '연결(Consolidated)' 기준의 가장 최신 '매출액 총계' 값을 하나만 추출하세요. 숫자에서 쉼표(,)는 제거하세요.
"""
            response = openai_client.chat.completions.create(
                model=model,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that strictly outputs a JSON object."
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "text", "text": f"\n\n[OCR Markdown 텍스트 원본 (환각 방지 및 숫자 앵커용)]\n{markdown_text}\n\n*명령: 반드시 위 마크다운 텍스트 원본에 실제로 적힌 매출액 데이터만 추출하세요. 이미지 표 구조를 참고하되, 실제 값은 텍스트를 최우선으로 신뢰하세요.*"},
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
                max_tokens=600,
                temperature=0
            )

            data = json.loads(response.choices[0].message.content.strip())
            
            if data.get('revenue'):
                raw_rev = float(data['revenue'])
                unit_str = data.get('unit', '').replace(' ', '').lower()
                multiplier = 1
                
                if '백만' in unit_str or 'million' in unit_str:
                    multiplier = 1_000_000
                elif '십억' in unit_str or 'billion' in unit_str:
                    multiplier = 1_000_000_000
                elif '억' in unit_str:
                    multiplier = 100_000_000
                elif '조' in unit_str or 'trillion' in unit_str:
                    multiplier = 1_000_000_000_000
                elif '천' in unit_str or 'thousand' in unit_str:
                    multiplier = 1_000
                
                final_revenue = raw_rev * multiplier

                print(f"[GPT-Vision] Page {page_id} Revenue 추출: {raw_rev} {unit_str} -> {final_revenue} 원")

                return {
                    'revenue': final_revenue,
                    'revenue_unit': '원',
                    'raw_revenue': raw_rev,
                    'raw_unit': data.get('unit', ''),
                    'source_pages': {'revenue': page_id}
                }
        except Exception as e:
            print(f"[GPT-Vision] Page {page_id} Revenue 추출 오류: {e}")
            continue

    return None

def extract_energy_with_vision_pages(pages_list: List[Dict], model: str = "gpt-4o-mini") -> Optional[Dict]:
    """페이지 기반 Energy Intensity 추출"""
    for page_item in pages_list[:5]:
        category = page_item.get('category', 'energy')
        if category in ['emission', 'revenue']:
            continue
            
        page_id = page_item['id']
        image_path = get_page_image_path(page_id)

        if not image_path or not image_path.exists():
            continue

        try:
            image_base64 = encode_image(image_path)
            markdown_text = page_item.get('full_markdown', '')

            prompt = """당신은 데이터 추출 전문가입니다. 이 페이지 이미지의 환경 데이터 표에서 **에너지 집약도(Energy Intensity)** 수치 및 단위를 확실하게 추출해주세요.

**출력 형식 (반드시 JSON만 출력):**
{"energy_2024": 숫자, "energy_2023": 숫자, "energy_2022": 숫자, "unit": "단위 문자열"}

예시: {"energy_2024": 110.5, "energy_2023": 105.2, "energy_2022": 112.1, "unit": "TJ/억원"}

**주의:**
- 표 최상단 혹은 카테고리명 근처에 (단위: MJ/백만원, TJ/억원 등) 텍스트가 있다면 그것을 반드시 추출해서 "unit"에 기재하세요.
- **연도 매칭 주의**: 2022년도 단의 숫자는 반드시 `energy_2022`에, 2023년도는 `energy_2023`에 정확히 넣으세요. 연도가 밀리거나 당겨지면 치명적 오류입니다. 
- 표에 2024년 값이 없고 2023년까지만 있다면 `energy_2024`는 null로 처리하세요. (없는 연도를 억지로 만들지 마세요)
"""
            response = openai_client.chat.completions.create(
                model=model,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that strictly outputs a JSON object."
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "text", "text": f"\n\n[OCR Markdown 텍스트 원본 (환각 방지 및 숫자 앵커용)]\n{markdown_text}\n\n*명령: 반드시 위 마크다운 텍스트 원본에 실제로 적힌 에너지 집약도 데이터만 추출하세요. 표의 구조를 분석하되, 실제 값은 반드시 텍스트를 최우선으로 신뢰하세요.*"},
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
                max_tokens=600,
                temperature=0
            )

            data = json.loads(response.choices[0].message.content.strip())
            
            latest_intensity = data.get('energy_2024')
            if latest_intensity is None:
                latest_intensity = data.get('energy_2023')
            
            if latest_intensity is not None:
                result = {
                    'energy_intensity': float(latest_intensity),
                    'energy_unit': data.get('unit', 'Unknown'),
                    'source_pages': {'energy': page_id}
                }
                
                yearly_energy = {}
                for year in ['2024', '2023', '2022', '2021']:
                    val = data.get(f'energy_{year}')
                    if val is not None:
                        yearly_energy[year] = float(val)
                
                if yearly_energy:
                    result['yearly_energy_intensity'] = yearly_energy

                return result
        except Exception as e:
            print(f"[GPT-Vision] Page {page_id} Energy 추출 오류: {e}")
            continue

    return None
