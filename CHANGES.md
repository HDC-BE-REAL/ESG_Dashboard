# 수정 내역 (Change Log)

> 수정할 때마다 이 파일을 업데이트합니다.
> 형식: 날짜 | 수정 내용 (최대 3줄) | 수정 파일 (경로#줄번호)

---

## 2026-02-19

### [docs] 전체 문서 현행화
- `README.md`: Dashboard·Compare·Simulator(4-Step)·Target·Profile 섹션 전면 업데이트
- `backend/docs/DB_SCHEMA_DASHBOARD.md`: `carbon_intensity_scope1/2/3` 필드 추가, Phase 2/3 완료 상태 반영
- `README.md` / `backend/docs/DB_SCHEMA_DASHBOARD.md`

---

## 2026-02-18

### [fix+refactor] Simulator 탭 전반 개선
- 시간 범위 버튼(1개월/3개월/1년/전체) 미작동 수정: `timeRange` 초기값 `'1y'`→`'1년'`, useMemo 비교값 영문→한글 정합화
- "포트폴리오 확정" 버튼 제거 → `totalCarbonCost` 실시간 자동 계산으로 전환 (`confirmedPurchaseCost` 상태 삭제)
- ETS 가격 시나리오 레이블 `'보수적'/'스트레스'` → `'낙관'/'비관'` 전망형 통일, EU-ETS 차트 색상 `#a5d8ff`→`#4dabf7`
- `frontend/src/App.tsx#168` / `frontend/src/features/시뮬레이터/SimulatorTab.tsx#51` / `frontend/src/data/mockData.ts#5`

### [feat+fix] Profile 설정 전반 개선
- 회사명 `<input>` → API 목록 기반 `<select>` 드롭다운으로 교체
- QuizBadge: 닉네임 동물 키워드(눈표범/물방개/판다/호랑이/독수리) 감지 → 해당 멸종위기 퀴즈, 미감지 시 탄소중립 기본 퀴즈
- QuizBadge hover→click 방식으로 변경, X 버튼 `absolute top-3 right-3` 고정, 눈 아이콘 상태 분리(`showEmailPassword`), 폰트 `font-display` 통일
- 사이드바 `top-28 h-[calc(100vh-7rem)] z-40` 고정, `compare`/`simulator` 탭 라우팅 `navigateTo('dashboard', tab)`으로 수정
- `frontend/src/features/profile/Profile.tsx` / `frontend/src/features/profile/DropoutModal.tsx#74`

### [ui] Header 꽃 아이콘 전탭 확장 및 Profile Setting 통합
- 모든 탭(dashboard 포함)에 꽃+줄기+잎 애니메이션 표시, dashboard 탭 라벨 `'Home'`으로 변경
- Profile 뷰 진입 시 Header 중앙에 꽃 아이콘 + "Profile Setting" 표시, Profile.tsx 내 중복 헤더 블록 제거
- `frontend/src/components/layout/Header.tsx#128`

### [feat] Compare 탭 세부실행계획 → Simulator 탭 연결
- `onNavigateToSimulator` prop 추가, 버튼 클릭 시 `navigateTo('dashboard', 'simulator')` 호출
- `frontend/src/features/경쟁사비교/CompareTab.tsx#236` / `frontend/src/App.tsx#1254`

### [fix+ui] Dashboard TrendChart 툴팁 개선
- actual 값이 있는 연도에서 forecast가 툴팁에 중복 표시되던 문제 수정 (`TrendChartTooltip` 컴포넌트 추가)
- `frontend/src/features/대시보드/components/TrendChart.tsx#17`

### [fix+ui] Target 탭 개선
- SBTi 목표달성도 판정 오류 수정: `yearsElapsed` 기준 `currentYear`→`latestDataYear` (동일 연도 비교)
- 차트 제목 `"Net Zero 경로 (SBTi 1.5°C)"` → `"온실가스 감축 로드맵 (Net Zero 경로)"`, 방법론 주석 `"SBTi 경로:"` → `"온실가스 감축 경로:"`
- `frontend/src/App.tsx#861` / `frontend/src/features/목표설정/TargetTab.tsx#152`

---

## 2026-02-17 이전

### [docs] README 전면 업데이트
- Compare Tab 섹션 신규 추가, Simulator 설명을 실제 K-ETS 로직에 맞게 재작성
- 누락된 API 명세(Dashboard, Profile), 환경변수, DB 스키마 테이블 추가
- 시스템 아키텍처 다이어그램 수정 (HuggingFace → Ollama 로컬 LLM 반영)
- `README.md`
