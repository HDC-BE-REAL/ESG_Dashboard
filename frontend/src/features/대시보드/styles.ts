/**
 * 대시보드 탭 전용 스타일 정의
 */

import { cardVariants, kpiCardStyles, transitions, hoverEffects } from '../../styles';

// KPI 카드 스타일
export const dashboardStyles = {
    // 메인 컨테이너
    container: "space-y-10",

    // KPI 카드 그리드
    kpiGrid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",

    // 개별 KPI 카드
    kpiCard: {
        base: "flex flex-col p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group",
        icon: {
            container: "p-3 rounded-xl",
            emerald: "bg-emerald-50 text-emerald-600",
            blue: "bg-blue-50 text-blue-600",
            orange: "bg-orange-50 text-orange-600",
            slate: "bg-slate-50 text-slate-600",
        },
        background: "absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity",
        header: "flex justify-between items-start mb-4 relative z-10",
        label: "text-sm font-bold text-slate-500 uppercase tracking-wide",
        value: "text-3xl font-black text-slate-900 mt-1 tracking-tight",
        unit: "text-sm font-bold text-slate-400",
        subtext: "text-xs font-medium text-slate-400 mt-2",
    },

    // 차트 섹션
    chartSection: {
        grid: "grid grid-cols-1 lg:grid-cols-2 gap-8",
        card: "p-8 rounded-[40px] bg-white border border-slate-100 shadow-sm",
        title: "text-lg font-black mb-6 flex items-center gap-2",
        container: "h-[420px]",
    },

    // SBTi 섹션
    sbtiSection: {
        container: "mt-12",
        card: "p-8 rounded-[40px] bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 shadow-sm",
        header: "flex items-center justify-between mb-8",
        title: "text-2xl font-black text-slate-900 flex items-center gap-3",
        badge: "px-4 py-2 bg-emerald-600 text-white text-xs font-black rounded-xl shadow-md",
        grid: "grid grid-cols-1 lg:grid-cols-3 gap-6",
        milestone: {
            card: "p-6 rounded-2xl bg-white border border-emerald-100 shadow-sm",
            year: "text-sm font-bold text-emerald-600 mb-2",
            target: "text-2xl font-black text-slate-900",
            description: "text-xs text-slate-500 mt-2",
        },
    },
} as const;

// 배지 색상 매핑
export const badgeColors = {
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-orange-100 text-orange-700",
    info: "bg-blue-100 text-blue-700",
    default: "bg-slate-100 text-slate-600 font-bold border border-slate-200",
} as const;

// 차트 색상 팔레트
export const chartColors = {
    scope1: '#0da559',
    scope2: '#86efac',
    scope3: '#dcfce7',
    primary: '#10b77f',
    secondary: '#64748b',
    accent: '#f59e0b',
} as const;
