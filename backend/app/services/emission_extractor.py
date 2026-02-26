"""
ESG 보고서에서 배출량 데이터 추출

Usage:
    from app.services.emission_extractor import EmissionExtractor

    extractor = EmissionExtractor()

    # 정규식 모드
    data = extractor.extract_for_document(doc_id=2)

    # GPT 텍스트 모드
    data = extractor.extract_for_document(doc_id=2, use_gpt=True)

    # GPT Vision 모드
    data = extractor.extract_for_document(doc_id=2, use_gpt='vision')

    # 자동 추출 및 저장
    data = extractor.extract_and_save_auto(doc_id=2)
"""

import json
from typing import Dict, Any, Union
from .extractors import base, regex, gpt_text, gpt_vision, auto_pipeline
from ..database import engine
from sqlalchemy import text


class EmissionExtractor:
    """table_cells에서 배출량 데이터 추출"""

    def extract_for_document(self, doc_id: int, use_gpt: Union[bool, str] = False, use_table_texts: bool = False) -> Dict[str, Any]:
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
                'allowance': 100273.6,
                'data_source': 'auto' | 'gpt' | 'gpt-vision'
            }
        """
        result = {
            'doc_id': doc_id,
            'source_tables': {},
            'data_source': 'auto'
        }

        # 1. 문서 정보 가져오기
        doc_info = base.get_document_info(doc_id)
        if not doc_info:
            raise ValueError(f"Document {doc_id} not found")

        result['company_name'] = doc_info['company_name']
        result['report_year'] = doc_info['report_year']
        result['data_year'] = doc_info['report_year'] - 1

        # 2. 배출량 관련 표 찾기
        if use_gpt:
            emission_tables = gpt_text.find_all_tables(doc_id)
            mode_name = "GPT-4V 이미지" if use_gpt == 'vision' else "GPT 텍스트"
            print(f"[Extractor] 전체 표 {len(emission_tables)}개 검토 ({mode_name} 모드)")
        else:
            emission_tables = regex.find_emission_tables(doc_id)
            print(f"[Extractor] 배출량 관련 표 {len(emission_tables)}개 발견")

        # 3. GPT 모드: GPT API로 추출
        if use_gpt:
            if use_gpt == 'vision':
                result['data_source'] = 'gpt-vision'
                gpt_data = gpt_vision.extract_with_gpt_vision(doc_id, emission_tables, use_table_texts=use_table_texts)
            else:
                result['data_source'] = 'gpt'
                gpt_data = gpt_text.extract_with_gpt(doc_id, emission_tables)

            if gpt_data:
                result.update(gpt_data)
                if result.get('s1') and result.get('s2'):
                    result['allowance'] = (result['s1'] + result['s2']) * 0.4
                return result
            else:
                print("[Extractor] GPT 추출 실패, 정규식 fallback")

        # 4. 정규식 모드: Scope 1, 2 추출
        scope_data = regex.extract_scope_1_2(doc_id, emission_tables)
        if scope_data:
            result['s1'] = scope_data.get('s1')
            result['s2'] = scope_data.get('s2')
            result['yearly_emissions'] = scope_data.get('yearly')
            result['base_emissions'] = scope_data.get('base_emissions')
            result['base_year'] = scope_data.get('base_year')
            result['source_tables']['s1'] = scope_data.get('table_id')
            result['source_tables']['s2'] = scope_data.get('table_id')

        # 5. Scope 3 추출 (연도별 데이터 포함)
        scope3_data = regex.extract_scope_3(doc_id, emission_tables)
        if scope3_data:
            result['s3'] = scope3_data.get('s3')
            result['yearly_s3'] = scope3_data.get('yearly_s3', {})
            result['source_tables']['s3'] = scope3_data.get('table_id')

        # 6. 매출액 추출
        revenue_data = regex.extract_revenue(doc_id)
        if revenue_data:
            result['revenue'] = revenue_data.get('revenue')
            result['source_tables']['revenue'] = revenue_data.get('table_id')

        # 7. 에너지 집약도 추출 (연도별 데이터 포함)
        energy_data = regex.extract_energy_intensity(doc_id)
        if energy_data:
            result['energy_intensity'] = energy_data.get('energy_intensity')
            result['yearly_energy_intensity'] = energy_data.get('yearly_energy_intensity', {})
            result['source_tables']['energy'] = energy_data.get('table_id')

        return result

    def extract_and_save_auto(self, doc_id: int, save: bool = True) -> Dict[str, Any]:
        """
        자동 추출 및 저장 파이프라인
        1. GPT-4o-mini로 모든 표 이미지 스캔
        2. 관련도 점수로 상위 후보 선택
        3. GPT-4o로 정밀 분석
        4. DB에 자동 저장
        """
        print("=" * 60)
        print("자동 추출 및 저장 파이프라인 시작")
        print("=" * 60)

        # Step 1: 이미지 있는 표 수집
        all_tables = auto_pipeline.find_all_tables_with_images(doc_id)
        print(f"\n[Step 1] 이미지 있는 표 {len(all_tables)}개 발견")

        if not all_tables:
            print("이미지가 있는 표가 없습니다.")
            return None

        # Step 2: GPT-4o-mini로 관련도 점수 매기기 + 카테고리 분류
        print(f"\n[Step 2] GPT-4o-mini로 관련도 점수 계산 + 카테고리 분류 중...")
        scored_tables = auto_pipeline.score_tables_for_relevance(all_tables)

        # 점수 높은 순으로 정렬
        scored_tables.sort(key=lambda x: x['score'], reverse=True)

        print(f"\n상위 5개 후보:")
        for i, t in enumerate(scored_tables[:5], 1):
            title = (t.get('title') or 'No title')[:50]
            category = t.get('category', 'other')
            print(f"  {i}. Table {t['id']} (점수: {t['score']}/100, 카테고리: {category}) - {title}")

        # Step 3: 카테고리별 Top 1 선택 (GPT-4o 사용 최소화)
        print(f"\n[Step 3] 카테고리별 Top 1 선택 (GPT-4o 전략 사용)")
        top_by_category = auto_pipeline.select_top_candidates_by_category(scored_tables, min_score=60)

        # GPT-4o 사용할 테이블 (카테고리별 Top 1, 최대 3개)
        gpt4o_tables = []
        for category in ['emission', 'revenue', 'energy']:
            if category in top_by_category and top_by_category[category]:
                gpt4o_tables.extend(top_by_category[category])

        # 나머지는 GPT-4o-mini 사용
        gpt4o_mini_tables = []
        for t in scored_tables:
            if t['score'] >= 60 and t not in gpt4o_tables:
                gpt4o_mini_tables.append(t)
        gpt4o_mini_tables = gpt4o_mini_tables[:7]  # mini는 최대 7개

        print(f"\n🔥 GPT-4o 사용: {len(gpt4o_tables)}개 표 (최대 3개, 카테고리별 Top 1)")
        for t in gpt4o_tables:
            title = (t.get('title') or 'No title')[:40]
            print(f"    Table {t['id']} ({t.get('category', 'unknown')}): {title}")

        print(f"\n⚡ GPT-4o-mini 사용: {len(gpt4o_mini_tables)}개 표")

        # 후보 표 GPT-Vision으로 분석
        result = {'source_tables': {}, 'data_source': 'gpt-vision-auto'}
        doc_info = base.get_document_info(doc_id)
        result.update(doc_info)
        result['doc_id'] = doc_id
        result['data_year'] = result.get('report_year', 2024) - 1

        # 먼저 GPT-4o로 중요한 표 분석
        gpt_data = None
        if gpt4o_tables:
            print(f"\n[Step 3-1] GPT-4o로 핵심 표 분석 중...")
            gpt_data = gpt_vision.extract_with_gpt_vision(doc_id, gpt4o_tables, use_table_texts=False, model="gpt-4o")

        # GPT-4o로 충분하지 않으면 mini로 추가 분석
        if gpt_data and not (gpt_data.get('s1') and gpt_data.get('s2') and gpt_data.get('s3')):
            print(f"\n[Step 3-2] GPT-4o-mini로 추가 표 분석 중...")
            mini_data = gpt_vision.extract_with_gpt_vision(doc_id, gpt4o_mini_tables, use_table_texts=False, model="gpt-4o-mini")
            if mini_data:
                # mini 데이터 병합 (기존 값 유지)
                for key in ['s1', 's2', 's3', 'revenue', 'energy_intensity']:
                    if not gpt_data.get(key) and mini_data.get(key):
                        gpt_data[key] = mini_data[key]
        elif not gpt_data:
            # GPT-4o 실패 시 mini로 시도
            print(f"\n[Step 3-2] GPT-4o 실패, GPT-4o-mini로 전체 재시도...")
            all_candidates = gpt4o_tables + gpt4o_mini_tables
            gpt_data = gpt_vision.extract_with_gpt_vision(doc_id, all_candidates[:10], use_table_texts=False, model="gpt-4o-mini")

        # GPT 데이터 유효성 확인 (S1, S2, S3 중 하나라도 있어야 성공)
        is_gpt_success = gpt_data and (gpt_data.get('s1') or gpt_data.get('s2') or gpt_data.get('s3'))

        # **대우건설 2024 (doc_id=18) 하드코딩 패치**
        # 2024년 표가 '국내'와 '해외'로 페이지 상에서 심하게 물리적으로 분할되어, OCR과 비전이 '계'(Total) 열을 완전히 유실함. 
        # 이에 따라 수기 교정 적용. (S1 총합 105,329 / S2 총합 59,410 / S3 총합 5,507,006)
        if doc_id == 18 and is_gpt_success:
            print("[Patch] 대우건설 2024 (doc_id=18)의 파편화된 표 구조로 인해, 2024년도 누락된 '해외' 및 '합계' 배출량 강제 보정 적용")
            gpt_data['s1'] = 105329.0
            gpt_data['s2'] = 59410.0
            gpt_data['s3'] = 5507006.0
            
            if 'yearly_s1' not in gpt_data: gpt_data['yearly_s1'] = {}
            if 'yearly_s2' not in gpt_data: gpt_data['yearly_s2'] = {}
            if 'yearly_s3' not in gpt_data: gpt_data['yearly_s3'] = {}
            
            gpt_data['yearly_s1']['2024'] = 105329.0
            gpt_data['yearly_s2']['2024'] = 59410.0
            gpt_data['yearly_s3']['2024'] = 5507006.0

        fallback_result = self.extract_for_document(doc_id, use_gpt=False)

        if not is_gpt_success:
            print("GPT-Vision으로 배출량 데이터 추출 실패, 정규식 fallback 적용...")
            if fallback_result and (fallback_result.get('s1') or fallback_result.get('s2')):
                print(f"\\n[Step 4] 정규식 추출 데이터 DB에 저장 중...")
                self.save_to_summary(fallback_result)
                print(f"✅ 저장 완료: {fallback_result.get('company_name')} {fallback_result.get('report_year')}")
            return fallback_result

        # GPT-Vision 성공 시, 매출액/에너지 별도 추출
        all_candidates = gpt4o_tables + gpt4o_mini_tables
        
        if not gpt_data.get('revenue'):
            rev_data = gpt_vision.extract_revenue_with_vision(all_candidates)
            if rev_data:
                gpt_data.update(rev_data)
                
        if not gpt_data.get('energy_intensity'):
            eng_data = gpt_vision.extract_energy_with_vision(all_candidates)
            if eng_data:
                gpt_data.update(eng_data)

        # 정규식 Fallback으로 누락된 핵심 항목 즉각 지원
        for key in ['revenue', 'energy_intensity', 'yearly_energy_intensity']:
            if not gpt_data.get(key) and fallback_result.get(key):
                print(f"[Fallback] 정규식으로 '{key}' 누락 데이터 복구: {fallback_result.get(key)}")
                gpt_data[key] = fallback_result.get(key)
                
        # GPT가 캐치하지 못한 과년도 데이터 (과거 3~4년 전 데이터 등) 정규식으로 보완
        for subkey in ['yearly_s1', 'yearly_s2', 'yearly_s3', 'yearly_emissions']:
            if fallback_result.get(subkey):
                if subkey not in gpt_data:
                    gpt_data[subkey] = {}
                for y, val in fallback_result[subkey].items():
                    if y not in gpt_data[subkey] or not gpt_data[subkey][y]:
                        gpt_data[subkey][y] = val

        result.update(gpt_data)

        # Step 4: DB에 저장
        if result and (result.get('s1') or result.get('s2')):
            if save:
                print(f"\n[Step 4] DB에 저장 중...")
                self.save_to_summary(result)
                print(f"✅ 저장 완료: {result.get('company_name')} {result.get('report_year')}")
            else:
                print(f"\n[Step 4] DB 저장 생략 (테스트 모드: save=False)")
            return result
        else:
            print("추출된 데이터가 없습니다.")
            return None

    def save_to_dashboard(self, data: Dict[str, Any], year: int = None) -> int:
        """
        추출된 데이터를 dashboard_emissions 테이블에 저장

        Args:
            data: 추출된 데이터
            year: 저장할 연도 (None이면 data_year 사용)
        """

        # 회사 ID 자동 조회 (dashboard_emissions 테이블에서)
        company_name = data.get('company_name')
        company_id = None

        if company_name:
            # 기존 company_id 조회
            sql = "SELECT company_id FROM dashboard_emissions WHERE company_name = :name LIMIT 1"
            with engine.connect() as conn:
                result = conn.execute(text(sql), {'name': company_name}).fetchone()
                if result:
                    company_id = result[0]

        # 없으면 새로운 company_id 생성
        if company_id is None:
            sql = "SELECT COALESCE(MAX(company_id), 0) + 1 FROM dashboard_emissions"
            with engine.connect() as conn:
                result = conn.execute(text(sql)).fetchone()
                company_id = result[0]

        # 데이터 연도 결정
        if year is None:
            year = data.get('data_year') or (data.get('report_year', 2024) - 1)

        # 매출액 단위 변환 (단위 힌트 기반 절대 원화 변환)
        revenue = data.get('revenue')
        revenue_unit = data.get('revenue_unit', '')
        
        if revenue:
            if '백만' in revenue_unit:
                revenue = revenue * 1000000
            elif '억' in revenue_unit:
                revenue = revenue * 100000000
            elif '천' in revenue_unit:
                revenue = revenue * 1000
            elif not revenue_unit:
                # 단위가 추출되지 않은 경우 Fallback (기존 휴리스틱 적용)
                if revenue < 10000000:
                    revenue = revenue * 100000000
                else:
                    revenue = revenue * 1000000

        # 탄소 집약도 계산 (scope별)
        carbon_intensity = 0
        carbon_intensity_scope1 = 0
        carbon_intensity_scope2 = 0
        carbon_intensity_scope3 = 0
        
        if revenue and revenue > 0:
            s1 = data.get('s1', 0) or 0
            s2 = data.get('s2', 0) or 0
            s3 = data.get('s3', 0) or 0
            revenue_100m = revenue / 100000000  # tCO2e / 매출 1억원
            
            carbon_intensity = (s1 + s2) / revenue_100m  # 총량 (S1+S2)
            carbon_intensity_scope1 = s1 / revenue_100m
            carbon_intensity_scope2 = s2 / revenue_100m
            carbon_intensity_scope3 = s3 / revenue_100m if s3 else 0

        # 에너지 집약도 단위 환산 (10억 원 분모 보정 등)
        energy_intensity = data.get('energy_intensity')
        energy_unit = data.get('energy_unit', '')
        
        if energy_intensity and energy_unit:
            # 예: Lottecon "10억" 단위 -> 1억원당 환산시 값을 10으로 나눔
            if '10억' in energy_unit or '십억' in energy_unit:
                energy_intensity = energy_intensity / 10.0
            # 예: 백만원 기준 -> 1백만원당 값에 100을 곱해 1억원당으로 스케일링
            elif '백만' in energy_unit:
                energy_intensity = energy_intensity * 100.0

        sql = """
            INSERT INTO dashboard_emissions
            (company_id, company_name, year,
             scope1, scope2, scope3,
             revenue, energy_intensity, 
             carbon_intensity, carbon_intensity_scope1, carbon_intensity_scope2, carbon_intensity_scope3,
             base_year, base_emissions,
             source_doc_id, data_source, extraction_method, is_verified,
             created_at, updated_at)
            VALUES
            (:company_id, :company_name, :year,
             :scope1, :scope2, :scope3,
             :revenue, :energy_intensity,
             :carbon_intensity, :carbon_intensity_scope1, :carbon_intensity_scope2, :carbon_intensity_scope3,
             :base_year, :base_emissions,
             :source_doc_id, :data_source, :extraction_method, :is_verified,
             NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                scope1 = VALUES(scope1),
                scope2 = VALUES(scope2),
                scope3 = VALUES(scope3),
                revenue = VALUES(revenue),
                energy_intensity = VALUES(energy_intensity),
                carbon_intensity = VALUES(carbon_intensity),
                carbon_intensity_scope1 = VALUES(carbon_intensity_scope1),
                carbon_intensity_scope2 = VALUES(carbon_intensity_scope2),
                carbon_intensity_scope3 = VALUES(carbon_intensity_scope3),
                base_year = VALUES(base_year),
                base_emissions = VALUES(base_emissions),
                extraction_method = VALUES(extraction_method),
                updated_at = NOW()
        """

        params = {
            'company_id': company_id,
            'company_name': data.get('company_name'),
            'year': year,
            'scope1': data.get('s1'),
            'scope2': data.get('s2'),
            'scope3': data.get('s3'),
            'revenue': revenue,
            'energy_intensity': data.get('energy_intensity'),
            'carbon_intensity': carbon_intensity,
            'carbon_intensity_scope1': carbon_intensity_scope1,
            'carbon_intensity_scope2': carbon_intensity_scope2,
            'carbon_intensity_scope3': carbon_intensity_scope3,
            'base_year': data.get('base_year'),
            'base_emissions': data.get('base_emissions'),
            'source_doc_id': data.get('doc_id'),
            'data_source': f"PDF: {data.get('company_name')}_{data.get('report_year', year)}.pdf",
            'extraction_method': data.get('data_source', 'auto'),
            'is_verified': False
        }

        with engine.connect() as conn:
            result = conn.execute(text(sql), params)
            conn.commit()
            print(f"[Extractor] ✅ Saved to dashboard_emissions: {data.get('company_name')} {year}")

        # 연도별 데이터도 함께 저장
        yearly_s1 = data.get('yearly_s1', {})
        yearly_s2 = data.get('yearly_s2', {})
        yearly_s3 = data.get('yearly_s3', {})
        yearly_energy = data.get('yearly_energy_intensity', {})
        yearly_emissions = data.get('yearly_emissions', {})  # 하위 호환성

        # 모든 연도 통합 (중복 제거)
        all_years = set()
        if yearly_s1:
            all_years.update(yearly_s1.keys())
        if yearly_s2:
            all_years.update(yearly_s2.keys())
        if yearly_s3:
            all_years.update(yearly_s3.keys())
        if yearly_energy:
            all_years.update(yearly_energy.keys())
        if yearly_emissions:
            all_years.update(yearly_emissions.keys())

        if all_years and len(all_years) > 0:
            print(f"[Extractor] 📅 연도별 데이터 {len(all_years)}개 발견: {all_years}")
            print(f"Debug: yearly_s1={yearly_s1.keys()}, yearly_s2={yearly_s2.keys()}, yearly_s3={yearly_s3.keys()}, yearly_energy={yearly_energy.keys()}")

            for hist_year_str in all_years:
                try:
                    hist_year = int(hist_year_str)
                    # 이미 저장한 연도는 건너뛰기
                    if hist_year == year:
                        continue

                    # 개별 Scope 데이터 수집 (우선)
                    s1_hist = yearly_s1.get(hist_year_str)
                    s2_hist = yearly_s2.get(hist_year_str)
                    hist_s3 = yearly_s3.get(hist_year_str)
                    hist_energy = yearly_energy.get(hist_year_str)

                    # 개별 데이터가 없으면 총합으로 추정 (하위 호환성)
                    total_emission = None
                    if (s1_hist is None or s2_hist is None) and yearly_emissions:
                        total_emission = yearly_emissions.get(hist_year_str)
                        if total_emission and s1_hist is None:
                            s1_hist = total_emission * 0.55  # 추정
                        if total_emission and s2_hist is None:
                            s2_hist = total_emission * 0.45  # 추정

                    # 에너지 집약도 과거치 스케일링
                    if hist_energy and energy_unit:
                        if '10억' in energy_unit or '십억' in energy_unit:
                            hist_energy = hist_energy / 10.0
                        elif '백만' in energy_unit:
                            hist_energy = hist_energy * 100.0

                    # 탄소 집약도 계산 (과거 연도)
                    carbon_intensity_hist = 0
                    carbon_intensity_scope1_hist = 0
                    carbon_intensity_scope2_hist = 0
                    carbon_intensity_scope3_hist = 0
                    
                    if revenue and revenue > 0:
                        revenue_100m = revenue / 100000000
                        if total_emission:
                            carbon_intensity_hist = total_emission / revenue_100m
                        if s1_hist:
                            carbon_intensity_scope1_hist = s1_hist / revenue_100m
                        if s2_hist:
                            carbon_intensity_scope2_hist = s2_hist / revenue_100m
                        if hist_s3:
                            carbon_intensity_scope3_hist = hist_s3 / revenue_100m

                    hist_params = params.copy()
                    hist_params['year'] = hist_year
                    hist_params['scope1'] = s1_hist
                    hist_params['scope2'] = s2_hist
                    hist_params['scope3'] = hist_s3  # 연도별 scope3 데이터 사용
                    hist_params['energy_intensity'] = hist_energy  # 연도별 에너지 집약도 사용
                    hist_params['carbon_intensity'] = carbon_intensity_hist
                    hist_params['carbon_intensity_scope1'] = carbon_intensity_scope1_hist
                    hist_params['carbon_intensity_scope2'] = carbon_intensity_scope2_hist
                    hist_params['carbon_intensity_scope3'] = carbon_intensity_scope3_hist

                    with engine.connect() as conn:
                        conn.execute(text(sql), hist_params)
                        conn.commit()
                    
                    # 로그 메시지 개선
                    parts = []
                    if s1_hist and s2_hist:
                        parts.append(f"S1: {s1_hist:,.0f}, S2: {s2_hist:,.0f}")
                    elif s1_hist or s2_hist:
                        if s1_hist:
                            parts.append(f"S1: {s1_hist:,.0f}")
                        if s2_hist:
                            parts.append(f"S2: {s2_hist:,.0f}")
                    if hist_s3:
                        parts.append(f"S3: {hist_s3:,.0f}")
                    if hist_energy:
                        parts.append(f"Energy: {hist_energy}")

                    info_str = ", ".join(parts) if parts else "No data"
                    print(f"[Extractor]   ↳ {hist_year}년 저장 ({info_str})")
                except Exception as e:
                    print(f"[Extractor]   ↳ {hist_year_str}년 저장 실패: {e}")

        return result.rowcount

    # 하위 호환성을 위한 별칭
    def save_to_summary(self, data: Dict[str, Any]) -> int:
        """save_to_dashboard의 별칭 (하위 호환성)"""
        return self.save_to_dashboard(data)


# CLI 테스트용
if __name__ == "__main__":
    import sys

    extractor = EmissionExtractor()

    args = [arg.lower() for arg in sys.argv[1:]]

    # AUTO 모드
    if 'auto' in args:
        print("🤖 자동 추출 모드")
        doc_id = None
        for arg in sys.argv[1:]:
            if arg.startswith('--doc-id='):
                doc_id = int(arg.split('=')[1])

        if doc_id is not None:
            result = extractor.extract_and_save_auto(doc_id)
            results = [result] if result else []
        else:
            print("(--doc-id 지정 안됨) dashboard_emissions에 없는 모든 문서 자동 추출 시작...")
            from sqlalchemy import text
            from ..database import engine
            with engine.connect() as conn:
                query = text("""
                    SELECT id, filename FROM documents 
                    WHERE id NOT IN (SELECT DISTINCT source_doc_id FROM dashboard_emissions WHERE source_doc_id IS NOT NULL)
                """)
                missing_docs = conn.execute(query).fetchall()
            
            results = []
            for d_id, fname in missing_docs:
                print(f"\\n>>> Processing Document {d_id}: {fname} <<<")
                res = extractor.extract_and_save_auto(d_id)
                if res:
                    results.append(res)

        for result in results:
            print("\\n" + "=" * 60)
            print("✅ 추출 및 저장 완료!")
            print("=" * 60)
            print(f"회사: {result.get('company_name')}")
            print(f"S1: {result.get('s1')}")
            print(f"S2: {result.get('s2')}")
            print(f"S3: {result.get('s3')}")
            print(f"Revenue: {result.get('revenue')}")
            print(f"Energy Intensity: {result.get('energy_intensity')}")
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
    use_table_texts = '--with-texts' in args

    mode_desc = mode
    if use_gpt == 'vision' and use_table_texts:
        mode_desc += " + DB 텍스트"

    print("=" * 60)
    print(f"HDEC 데이터 추출 테스트 [{mode_desc} 모드]")
    print("=" * 60)

    data = extractor.extract_for_document(doc_id=2, use_gpt=use_gpt, use_table_texts=use_table_texts)

    print("\n추출 결과:")
    for k, v in data.items():
        print(f"  {k}: {v}")

    if auto_save:
        print("\n자동 저장 중...")
        extractor.save_to_summary(data)
        print("저장 완료!")
    else:
        print("\n사용법:")
        print("  정규식:           python3 -m app.services.emission_extractor")
        print("  GPT 텍스트:       python3 -m app.services.emission_extractor gpt")
        print("  GPT 비전:         python3 -m app.services.emission_extractor vision")
        print("  비전 + DB텍스트:  python3 -m app.services.emission_extractor vision --with-texts")
        print("  🤖 자동 추출:     python3 -m app.services.emission_extractor auto")
