import React from 'react';
import type { Competitor } from '../../types';
import { dashboardStyles } from './styles';
import { KPICards } from './components/KPICards';
import { EmissionPieChart } from './components/EmissionPieChart';
import { TrendChart } from './components/TrendChart';

type TrajectoryPoint = {
    year: string;
    actual: number | null;
};

interface DashboardTabProps {
    selectedComp: Competitor;
    costEU_KRW: number;
    ytdAnalysis: {
        currentIntensity: string;
        percentChange: string;
        delta: string;
        period: string;
        scopeLabel: string;
    };
    intensityType: string;
    sbtiAnalysis: {
        trajectory: TrajectoryPoint[];
    };
    activeScopes: { s1: boolean; s2: boolean; s3: boolean };
    setActiveScopes: React.Dispatch<React.SetStateAction<{ s1: boolean; s2: boolean; s3: boolean }>>;
    compareData?: any;
    simulatorData?: any;
    investmentData?: any;
    onNavigateToTab?: (tab: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
    selectedComp,
    costEU_KRW,
    ytdAnalysis,
    intensityType,
    sbtiAnalysis,
    activeScopes,
    setActiveScopes,
    onNavigateToTab
}) => {
    return (
        <div className={dashboardStyles.container}>
            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* 1. 경쟁사 비교 탭으로 이동하는 카드 */}
                <div
                    onClick={() => onNavigateToTab?.('compare')}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md"
                >
                    <h3 className="text-slate-500 text-sm font-medium mb-1">경쟁사 대비 탄소 집약도</h3>
                    <p className="text-2xl font-bold text-slate-800">Top 5%</p>
                    <p className="text-xs text-emerald-600 mt-1">업계 상위권 유지 중</p>
                </div>

                {/* 2. 시뮬레이터 탭으로 이동하는 카드 */}
                <div
                    onClick={() => onNavigateToTab?.('simulator')}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md"
                >
                    <h3 className="text-slate-500 text-sm font-medium mb-1">예상 배출권 구매 비용</h3>
                    <p className="text-2xl font-bold text-slate-800">₩ 12.5억</p>
                    <p className="text-xs text-red-500 mt-1">전년 대비 +4.2% 증가 예상</p>
                </div>

                {/* 3. 목표 관리 탭으로 이동하는 카드 */}
                <div
                    onClick={() => onNavigateToTab?.('target')}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md"
                >
                    <h3 className="text-slate-500 text-sm font-medium mb-1">SBTi 감축 목표 달성률</h3>
                    <p className="text-2xl font-bold text-slate-800">92.4%</p>
                    <p className="text-xs text-emerald-600 mt-1">목표 달성 순항 중</p>
                </div>

                {/* 4. 투자 계획 탭으로 이동하는 카드 */}
                <div
                    onClick={() => onNavigateToTab?.('investment')}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md"
                >
                    <h3 className="text-slate-500 text-sm font-medium mb-1">녹색 투자 ROI 예측</h3>
                    <p className="text-2xl font-bold text-slate-800">14.2%</p>
                    <p className="text-xs text-slate-500 mt-1">회수 기간 3.4년 예상</p>
                </div>
            </div>

            {/* KPI Cards Section */}
            <KPICards
                selectedComp={selectedComp}
                costEU_KRW={costEU_KRW}
                ytdAnalysis={ytdAnalysis}
                intensityType={intensityType}
            />

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                <EmissionPieChart selectedComp={selectedComp} />
                <TrendChart
                    trajectory={sbtiAnalysis?.trajectory ?? []}
                    activeScopes={activeScopes}
                    setActiveScopes={setActiveScopes}
                />
            </div>
        </div>
    );
};
