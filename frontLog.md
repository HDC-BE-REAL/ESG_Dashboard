# Frontend 변경 이력 (frontLog.md)

> 이번 세션(2026-02-22 ~ 23)에서 수행된 모든 프론트엔드 변경사항을 기록합니다.

---

## 1. `TargetTab.tsx` — KPI 카드 4개 가운데 정렬

**파일:** `frontend/src/features/목표설정/TargetTab.tsx`

### 변경 전

```tsx
<Card className="flex flex-col justify-between">
  ...
  <div className="flex items-center gap-1 text-slate-500 text-xs font-bold">
    <Flag size={12} />
    ...
  </div>
```

### 변경 후

```tsx
<Card className="flex flex-col justify-between items-center text-center">
  ...
  <div className="flex items-center justify-center gap-1 text-slate-500 text-xs font-bold">
    <Flag size={12} />
    ...
  </div>
```

**설명:**  

- 기준 배출량, 최신 배출량, SBTi 목표달성도, Net Zero 2050 카드 4개 모두에 `items-center text-center` 추가  
- 하위 flex 요소에도 `justify-center` 추가하여 내부 아이콘+텍스트를 가운데 정렬  

---

## 2. `TargetTab.tsx` — 레이아웃 재구성 (좌측 패널 + 우측 차트)

**파일:** `frontend/src/features/목표설정/TargetTab.tsx`

### 변경 전

```tsx
{/* 차트 (풀 너비) */}
<Card padding="lg" className="w-full">
  <div className="h-[480px] w-full">
    ...
  </div>
</Card>

{/* 분석 패널 3개 - 하단 3열 가로 */}
<div className="grid grid-cols-3 gap-6">
  <Card>감축 속도 분석</Card>
  <Card>목표 시뮬레이션</Card>
  <Card>회귀 모델 통계</Card>
</div>
```

### 변경 후

```tsx
{/* 메인 콘텐츠 그리드: 좌측(카드) | 우측(차트) */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

  {/* 좌측 분석 패널 (세로 스택) - 2칸 */}
  <div className="space-y-6 lg:col-span-2">
    <Card className="p-2 bg-transparent border-none shadow-none">감축 속도 분석</Card>
    <Card className="p-2 bg-transparent border-none shadow-none">2030 목표 시뮬레이션</Card>
    <Card className="p-2 bg-transparent border-none shadow-none">회귀 모델 통계</Card>
  </div>

  {/* 우측 차트 패널 - 10칸 */}
  <Card padding="lg" className="lg:col-span-10 flex flex-col min-w-0 bg-transparent border-none shadow-none">
    <div className="h-[450px] w-full">
      ...
    </div>
  </Card>
</div>
```

**설명:**  

- 분석 카드 3개를 차트 하단 가로 배열 → **좌측 세로 스택**으로 이동  
- 전체 그리드를 12칸으로 세분화: 좌측 `col-span-2`(≈17%) + 우측 `col-span-10`(≈83%)  
- 좌측 카드와 우측 차트 모두 `bg-transparent border-none shadow-none` 으로 외곽선·배경 제거  
- 차트 높이: `480px` → `450px` 로 조정  

---

## 3. `App.tsx` — Target 탭 최대 너비 제한 해제

**파일:** `frontend/src/App.tsx`

### 변경 전

```tsx
<main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
```

### 변경 후

```tsx
<main className={`flex-1 p-6 lg:p-10 ${activeTab === 'target' && view === 'dashboard' ? 'max-w-full' : 'max-w-7xl'} mx-auto w-full space-y-8 animate-in fade-in duration-500`}>
```

**설명:**  

- 기존 `max-w-7xl`(1280px) 제한이 모든 탭에 동일하게 적용되어 Target 탭에서 차트가 좁게 보임  
- Target 탭(`activeTab === 'target'`)일 때만 `max-w-full`로 변경하여 **모니터 전체 너비 활용**  
- 다른 탭(Dashboard, Compare, Simulator 등)에는 영향 없음  

---

## 4. `Header.tsx` — 헤더 배경 투명화

**파일:** `frontend/src/components/layout/Header.tsx`

### 변경 전 (nav 태그)

```tsx
<nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4 flex justify-between items-center sticky top-0 z-30">
```

### 변경 후

```tsx
<nav className="bg-transparent px-8 py-4 flex justify-between items-center sticky top-0 z-30">
```

**설명:**  

- `bg-white/80` (흰색 반투명 배경), `backdrop-blur-md` (블러), `border-b border-slate-100` (하단 경계선) 모두 제거  
- 헤더가 페이지 배경에 자연스럽게 녹아들어 시각적 단절감 해소  

---

## 5. `Header.tsx` — 탭 내비게이션 하단 구분선 제거

**파일:** `frontend/src/components/layout/Header.tsx`

### 변경 전

```tsx
<div className="absolute bottom-0 left-0 right-0 h-[1px] bg-neutral-200"></div>
```

### 변경 후

```tsx
<div className="absolute bottom-0 left-0 right-0 h-[1px] bg-transparent"></div>
```

**설명:**  

- 중앙 탭 표시 영역(현재 활성 탭과 꽃 아이콘 아래)의 회색 구분선 제거  
- Profile 뷰와 일반 대시보드 뷰 두 경우 모두 처리  

---

## 6. `Header.tsx` — 기업 선택/프로필 버튼 배경 투명화

**파일:** `frontend/src/components/layout/Header.tsx`

### 변경 전 (기업 선택 버튼)

```tsx
className="... hover:bg-white hover:shadow-sm"
```

### 변경 후

```tsx
className="... "  {/* hover:bg-white hover:shadow-sm 제거 */}
```

### 변경 전 (프로필 아이콘 버튼)

```tsx
className="flex items-center justify-center size-10 rounded-full bg-slate-100 hover:bg-slate-200 transition-all border-2 border-transparent hover:border-emerald-700/30 shadow-sm"
```

### 변경 후

```tsx
className="flex items-center justify-center size-10 rounded-full bg-transparent hover:bg-black/5 transition-all"
```

**설명:**  

- 기업 선택 버튼의 hover 시 흰색 배경·그림자 제거  
- 프로필 버튼의 회색 배경, 테두리, 그림자 모두 제거하여 깔끔한 투명 버튼으로 변경  

---

## 7. `App.tsx` — 페이지 배경 ambient warmth 효과 복구 및 설정

**파일:** `frontend/src/App.tsx`

### 변경 전

```tsx
{/* Background Layer: Ambient Warmth & Daylight Cycle */}
<div className="fixed inset-0 pointer-events-none z-0">
  <div className="ambient-warmth opacity-60"></div>
  <div className="absolute inset-0 bg-sunrise-glow opacity-0 pointer-events-none"></div>
</div>
```

### 변경 후

```tsx
{/* Background Layer (ESG 새싹 밑으로 퍼지는 빛 효과) */}
<div className="fixed inset-0 pointer-events-none z-0">
  <div className="ambient-warmth opacity-60"></div>
</div>
```

**설명:**  

- 불필요한 `bg-sunrise-glow` 레이어 제거  
- `ambient-warmth` 클래스 유지 (CSS에서 효과를 새롭게 정의함 — 항목 8 참고)  

---

## 8. `index.css` — ambient-warmth 배경 효과 재설계

**파일:** `frontend/src/index.css`

### 변경 전

```css
.ambient-warmth {
  background: radial-gradient(circle at 50% 30%, rgba(255, 248, 225, 0.8) 0%, rgba(255, 255, 255, 0) 70%);
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  z-index: 0;
}
```

### 변경 후 (최종)

```css
.ambient-warmth {
  /* 노을 끝 무렵의 아주 연하고 은은한 따뜻한 황금빛이 페이지 전역에 부드럽게 스며드는 효과 */
  background:
    radial-gradient(ellipse 160% 60% at 50% -5%, rgba(255, 200, 80, 0.18) 0%, rgba(255, 180, 60, 0.10) 50%, transparent 100%),
    linear-gradient(to bottom, rgba(255, 200, 100, 0.07) 0%, rgba(255, 220, 150, 0.04) 50%, rgba(255, 240, 200, 0.02) 100%);
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  z-index: 0;
}
```

**설명:**  

- 기존: 화면 30% 지점에 집중된 원형(circle) 주황빛 — 위치가 애매하고 너무 집중됨  
- 변경: 두 레이어 조합으로 노을이 지는 끝 무렵의 은은한 따뜻함을 전역에 표현  
  - **상단 radial-gradient**: 상단 중앙(-5%)에서 타원형으로 황금빛이 퍼져나감 (0.18 → 투명)  
  - **하단 linear-gradient**: 위에서 아래로 매우 연한 복숭아빛이 서서히 사라짐 (0.07 → 0.02)  
- `absolute` → `fixed`로 변경하여 스크롤해도 배경이 고정  
- 투명도를 매우 낮게(최대 0.18) 유지해 과하지 않고 세련된 warm tint 연출  

---

## 변경 파일 요약

| 파일 | 변경 내용 |
|---|---|
| `TargetTab.tsx` | KPI 카드 4개 가운데 정렬 / 좌패널+우차트 레이아웃 / 외곽선 투명화 / 차트 높이 450px |
| `App.tsx` | Target 탭 max-w-full 해제 / ambient warmth 레이어 단순화 |
| `Header.tsx` | nav 배경 투명화 / 구분선 제거 / 버튼 배경 제거 |
| `index.css` | ambient-warmth 노을빛 전역 tint로 재설계 |
