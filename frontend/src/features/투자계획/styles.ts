/**
 * 투자계획 탭 전용 스타일 정의
 */

import { cardVariants, sliderStyles } from '../../styles';

export const investmentStyles = {
    // 메인 컨테이너
    container: "space-y-8",

    // 그리드 레이아웃
    grid: "grid grid-cols-12 gap-8",

    // 사이드바 (변수 설정)
    sidebar: {
        container: "col-span-12 lg:col-span-3 space-y-6",
        header: "flex items-center gap-2 mb-2 px-1",
        title: "font-bold text-sm uppercase tracking-wider text-slate-800",
        card: "p-6 rounded-2xl bg-white border border-slate-100 shadow-sm",
    },

    // 메인 콘텐츠 영역
    mainContent: {
        container: "col-span-12 lg:col-span-9 space-y-8",
    },

    // 슬라이더 컨트롤
    slider: {
        ...sliderStyles,
        input: "w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-600",
    },

    // 비교 차트 (Bar Chart)
    comparisonChart: {
        container: "p-8 rounded-[40px] bg-white border border-slate-100 shadow-sm",
        title: "text-xl font-black mb-6 flex items-center gap-2",
        grid: "grid grid-cols-2 gap-8 mb-8",
        barContainer: "flex flex-col items-center gap-4",
        barWrapper: "w-full bg-slate-800/50 rounded-t-xl relative flex items-end justify-center hover:bg-slate-700 transition-colors",
        bar: {
            liability: "w-full bg-slate-800/50 rounded-t-xl relative flex items-end justify-center hover:bg-slate-700 transition-colors",
            investment: "w-full bg-[#10b77f] rounded-t-xl relative flex items-end justify-center shadow-[0_0_30px_-5px_rgba(16,183,127,0.3)] hover:brightness-110 transition-all",
        },
        label: "text-sm font-bold text-slate-600",
        value: "text-2xl font-black",
    },

    // Verdict 카드 (결론 카드)
    verdictCard: {
        container: "p-8 rounded-[40px] border shadow-sm",
        positive: "bg-gradient-to-br from-emerald-50 to-white border-emerald-100",
        negative: "bg-gradient-to-br from-rose-50 to-white border-rose-100",
        header: "flex items-start justify-between mb-6",
        icon: {
            container: "p-4 rounded-2xl shadow-lg",
            positive: "bg-emerald-600 text-white",
            negative: "bg-rose-600 text-white",
        },
        badge: {
            positive: "px-4 py-2 bg-emerald-600 text-white text-xs font-black rounded-xl shadow-md",
            negative: "px-4 py-2 bg-rose-600 text-white text-xs font-black rounded-xl shadow-md",
        },
        title: "text-2xl font-black text-slate-900 mb-2",
        subtitle: "text-sm text-slate-500",
        metrics: "grid grid-cols-3 gap-6 mt-6",
        metric: {
            label: "text-xs font-bold text-slate-500 uppercase tracking-wide mb-1",
            value: "text-xl font-black text-slate-900",
            unit: "text-sm text-slate-500",
        },
    },

    // 시계열 차트
    timelineChart: {
        container: "p-8 rounded-[40px] bg-white border border-slate-100 shadow-sm",
        title: "text-xl font-black mb-6 flex items-center gap-2",
        chartContainer: "h-[400px]",
    },
} as const;

// 차트 색상
export const investmentChartColors = {
    liability: '#1e293b',
    investment: '#10b77f',
    cashflow: '#3b82f6',
    cumulative: '#8b5cf6',
} as const;
