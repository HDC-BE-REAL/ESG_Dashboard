import React from 'react';
import type { Competitor } from '../../types';
import { dashboardStyles } from './styles';
import { KPICards } from './components/KPICards';
import { EmissionPieChart } from './components/EmissionPieChart';
import { TrendChart } from './components/TrendChart';

type TrajectoryPoint = {
    year: string;
    actual: number | null;
    target: number;
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
                <TrendChart trajectory={sbtiAnalysis?.trajectory ?? []} />
            </div>
        </div>
    );
};
