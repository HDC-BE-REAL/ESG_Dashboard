/**
 * 공통 스타일 variants 및 재사용 가능한 스타일 조합
 */

// 카드 스타일 variants
export const cardVariants = {
    default: "bg-white p-6 rounded-2xl border border-slate-200 shadow-sm",
    elevated: "bg-white p-6 rounded-2xl border border-slate-200 shadow-lg",
    dark: "bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg text-white",
    glass: "bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/50 shadow-md",
    gradient: "bg-gradient-to-br from-emerald-50 to-white p-6 rounded-2xl border border-emerald-100 shadow-sm",
} as const;

// 버튼 스타일 variants
export const buttonVariants = {
    primary: "px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors",
    secondary: "px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors",
    outline: "px-6 py-3 border-2 border-emerald-600 text-emerald-600 rounded-xl font-bold hover:bg-emerald-50 transition-colors",
    ghost: "px-6 py-3 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-colors",
    danger: "px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors",
} as const;

// 배지 스타일 variants
export const badgeVariants = {
    default: "px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700",
    success: "px-3 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-700",
    warning: "px-3 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-700",
    danger: "px-3 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-700",
    info: "px-3 py-1 text-xs font-bold rounded-lg bg-blue-100 text-blue-700",
} as const;

// 입력 필드 스타일
export const inputVariants = {
    default: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all",
    error: "w-full px-4 py-3 rounded-xl border border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all",
} as const;

// 차트 컨테이너 스타일
export const chartContainerVariants = {
    small: "h-[300px] w-full",
    medium: "h-[420px] w-full",
    large: "h-[600px] w-full",
} as const;

// 그리드 레이아웃 variants
export const gridVariants = {
    cols2: "grid grid-cols-1 md:grid-cols-2 gap-6",
    cols3: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
    cols4: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
    autoFit: "grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6",
} as const;

// 텍스트 스타일 variants
export const textVariants = {
    heading1: "text-4xl font-black text-slate-900",
    heading2: "text-3xl font-black text-slate-900",
    heading3: "text-2xl font-black text-slate-900",
    heading4: "text-xl font-bold text-slate-900",
    body: "text-base text-slate-700",
    caption: "text-sm text-slate-500",
    label: "text-xs font-bold uppercase tracking-wider text-slate-400",
} as const;

// KPI 카드 전용 스타일
export const kpiCardStyles = {
    container: "bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow",
    label: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1",
    value: "text-3xl font-black",
    subtext: "mt-4 text-[10px] text-slate-400 font-bold",
    trend: {
        positive: "mt-4 flex items-center gap-1 text-emerald-500 font-bold text-xs",
        negative: "mt-4 flex items-center gap-1 text-rose-500 font-bold text-xs",
    },
} as const;

// 슬라이더 컨트롤 스타일
export const sliderStyles = {
    container: "space-y-3",
    label: "flex items-center justify-between mb-2",
    labelText: "text-xs font-bold text-slate-700",
    value: "text-xs font-black text-emerald-600",
    track: "w-full h-2 bg-slate-200 rounded-full",
    thumb: "appearance-none w-5 h-5 bg-emerald-600 rounded-full cursor-pointer hover:scale-110 transition-transform",
} as const;

// 스페이싱 유틸리티
export const spacing = {
    section: "space-y-8",
    card: "space-y-6",
    tight: "space-y-4",
    loose: "space-y-12",
} as const;

// 반응형 패딩
export const padding = {
    page: "p-8 max-w-7xl mx-auto w-full",
    section: "p-6",
    card: "p-4",
} as const;
