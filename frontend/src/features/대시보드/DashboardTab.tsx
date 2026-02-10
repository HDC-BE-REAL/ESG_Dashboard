/**
 * 리팩토링된 대시보드 탭 메인 컴포넌트
 * 하위 컴포넌트로 분리하여 가독성과 유지보수성 향상
 */

import React from 'react';
import { KPICards } from './components/KPICards';
import { EmissionPieChart } from './components/EmissionPieChart';
import { TrendChart } from './components/TrendChart';
import { dashboardStyles } from './styles';
import type { Competitor } from '../../types';

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
    sbtiAnalysis: any;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
    selectedComp,
    costEU_KRW,
    ytdAnalysis,
    intensityType,
    sbtiAnalysis
}) => {
    return (
        <div className={dashboardStyles.container}>
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
                <TrendChart trajectory={sbtiAnalysis.trajectory} />
            </div>
        </div>
    );
};
