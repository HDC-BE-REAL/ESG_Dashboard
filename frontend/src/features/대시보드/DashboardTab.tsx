import React, { useState } from 'react';
import {
    PieChart, Pie, Cell, Label, Tooltip, Legend, ResponsiveContainer,
    ComposedChart, CartesianGrid, XAxis, YAxis, Line, Area, ReferenceLine, Sector
} from 'recharts';
import {
    Cloud, TrendingDown, Euro, AlertCircle, Activity,
    TrendingUp, CheckCircle, CheckCircle2, MoreHorizontal, Zap
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { CustomTooltip } from '../../components/ui/CustomTooltip';
import { cn } from '../../components/ui/utils';
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
