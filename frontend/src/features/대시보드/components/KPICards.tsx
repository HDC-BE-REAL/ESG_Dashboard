import React from 'react';
import { Cloud, Coins, Activity, Target, TrendingDown, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { dashboardStyles, badgeColors } from '../styles';
import type { Competitor } from '../../../types';

interface KPICardsProps {
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
    sbtiProbability: number;
    onNavigateToTab?: (tab: string) => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
    selectedComp,
    costEU_KRW,
    ytdAnalysis,
    intensityType,
    sbtiProbability,
    onNavigateToTab,
}) => {
    const totalEmissionsVal = selectedComp.s1 + selectedComp.s2;
    const totalEmissions = totalEmissionsVal.toLocaleString();
    const riskExposure = (costEU_KRW / 1e8).toFixed(1);
    const percentChange = Number(ytdAnalysis.percentChange);
    const isIntensityIncreasing = percentChange > 0;

    const sbtiColor = sbtiProbability >= 70 ? 'success' : sbtiProbability >= 40 ? 'warning' : 'danger';
    const sbtiLabel = sbtiProbability >= 70 ? '달성 가능' : sbtiProbability >= 40 ? '불확실' : '위험';

    return (
        <div className={dashboardStyles.kpiGrid}>
            {/* Card 1: Total Emissions */}
            <div className={dashboardStyles.kpiCard.base}>
                <div className={dashboardStyles.kpiCard.background}>
                    <Cloud size={80} className="text-emerald-900" />
                </div>
                <div className={dashboardStyles.kpiCard.header}>
                    <div className={`${dashboardStyles.kpiCard.icon.container} ${dashboardStyles.kpiCard.icon.emerald}`}>
                        <Cloud size={24} />
                    </div>
                    <Badge variant="success" className={badgeColors.success}>
                        <TrendingDown size={14} className="mr-1" />
                        4.2%
                    </Badge>
                </div>
                <p className={dashboardStyles.kpiCard.label}>총 탄소 배출량</p>
                <p className={dashboardStyles.kpiCard.value}>
                    {totalEmissions} <span className={dashboardStyles.kpiCard.unit}>tCO2e</span>
                </p>
                <p className={dashboardStyles.kpiCard.subtext}>전년 대비 (vs Last Year)</p>
            </div>

            {/* Card 2: Carbon Intensity - Navigate to Compare Tab */}
            <div
                className={`${dashboardStyles.kpiCard.base} cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg`}
                onClick={() => onNavigateToTab?.('compare')}
            >
                <div className={dashboardStyles.kpiCard.background}>
                    <Activity size={80} className="text-orange-900" />
                </div>
                <div className={dashboardStyles.kpiCard.header}>
                    <div className={`${dashboardStyles.kpiCard.icon.container} ${dashboardStyles.kpiCard.icon.orange}`}>
                        <Activity size={24} />
                    </div>
                    <Badge
                        variant={isIntensityIncreasing ? "warning" : "success"}
                        className={isIntensityIncreasing ? badgeColors.warning : badgeColors.success}
                    >
                        {isIntensityIncreasing ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                        {Math.abs(percentChange)}%
                    </Badge>
                </div>
                <p className={dashboardStyles.kpiCard.label}>탄소 집약도 (Intensity)</p>
                <p className={dashboardStyles.kpiCard.value}>{ytdAnalysis.currentIntensity}</p>
                <p className={dashboardStyles.kpiCard.subtext}>
                    {intensityType === 'revenue' ? 'tCO2e / 1억 매출' : 'kg / 제품 단위'}
                </p>
            </div>

            {/* Card 3: Risk Exposure - Navigate to Simulator Tab */}
            <div
                className={`${dashboardStyles.kpiCard.base} cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg`}
                onClick={() => onNavigateToTab?.('simulator')}
            >
                <div className={dashboardStyles.kpiCard.background}>
                    <Coins size={80} className="text-blue-900" />
                </div>
                <div className={dashboardStyles.kpiCard.header}>
                    <div className={`${dashboardStyles.kpiCard.icon.container} ${dashboardStyles.kpiCard.icon.blue}`}>
                        <Coins size={24} />
                    </div>
                    <Badge variant="default" className={badgeColors.default}>
                        <AlertCircle size={14} className="mr-1" />
                        안정적 (STABLE)
                    </Badge>
                </div>
                <p className={dashboardStyles.kpiCard.label}>K-ETS 리스크 노출액</p>
                <p className={dashboardStyles.kpiCard.value}>₩ {riskExposure}억</p>
                <p className={dashboardStyles.kpiCard.subtext}>K-ETS 배출권 가격 연동 (Pricing Impact)</p>
            </div>

            {/* Card 4: SBTi 2030 Achievement Probability - Navigate to Target Tab */}
            <div
                className={`${dashboardStyles.kpiCard.base} cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg`}
                onClick={() => onNavigateToTab?.('target')}
            >
                <div className={dashboardStyles.kpiCard.background}>
                    <Target size={80} className="text-violet-900" />
                </div>
                <div className={dashboardStyles.kpiCard.header}>
                    <div className={`${dashboardStyles.kpiCard.icon.container} bg-violet-100 text-violet-600`}>
                        <Target size={24} />
                    </div>
                    <Badge
                        variant={sbtiColor === 'success' ? 'success' : 'warning'}
                        className={sbtiColor === 'success' ? badgeColors.success : sbtiColor === 'warning' ? badgeColors.warning : 'bg-red-100 text-red-700'}
                    >
                        {sbtiColor === 'success' ? <CheckCircle2 size={14} className="mr-1" /> : <AlertCircle size={14} className="mr-1" />}
                        {sbtiLabel}
                    </Badge>
                </div>
                <p className={dashboardStyles.kpiCard.label}>2030 SBTi 목표 달성 확률</p>
                <p className={dashboardStyles.kpiCard.value}>
                    {sbtiProbability}<span className={dashboardStyles.kpiCard.unit}>%</span>
                </p>
                <p className={dashboardStyles.kpiCard.subtext}>Monte Carlo 시뮬레이션 (10,000회)</p>
            </div>
        </div>
    );
};
