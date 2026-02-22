import React, { useState, useMemo } from 'react';
import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
    BarChart, Bar, Cell, Legend
} from 'recharts';
import {
    TrendingUp, TrendingDown, Euro, Globe, Database, HelpCircle, ShieldCheck, Sparkles,
    Zap, Rocket, Target, PieChart as PieChartIcon, Activity, DollarSign, BarChart3, Trash2, Plus, LayoutGrid, ChevronDown, ChevronUp, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { CustomTooltip } from '../../components/ui/CustomTooltip';
import { cn, formatBillions } from '../../components/ui/utils';
import type {
    MarketType, TimeRangeType, Tranche, TrendData,
    PriceScenarioType, AllocationChangeType, ReductionOption, SimResult
} from '../../types';
import { MARKET_DATA, ETS_PRICE_SCENARIOS, ALLOCATION_SCENARIOS, AUCTION_CONFIG } from '../../data/mockData';

interface SimulatorTabProps {
    // Existing Chart Props
    selectedMarket: MarketType;
    setSelectedMarket: (market: MarketType) => void;
    timeRange: TimeRangeType;
    setTimeRange: (range: TimeRangeType) => void;
    trendData: TrendData[];
    fullHistoryData: TrendData[];
    handleChartClick: (data: any) => void;

    // Simulator Logic Props
    priceScenario: PriceScenarioType;
    setPriceScenario: (v: PriceScenarioType) => void;
    customPrice: number;
    setCustomPrice: (v: number) => void;
    allocationChange: AllocationChangeType;
    setAllocationChange: (v: AllocationChangeType) => void;
    emissionChange: number;
    setEmissionChange: (v: number) => void;
    reductionOptions: ReductionOption[];
    toggleReduction: (id: string) => void;
    simResult: SimResult;
    auctionEnabled: boolean;
    setAuctionEnabled: (v: boolean) => void;
    auctionTargetPct: number;
    setAuctionTargetPct: (v: number) => void;
    currentETSPrice: number;
    baseAllocation: number;
    // Split Purchase Portfolio Props
    tranches: Tranche[];
    setTranches: (tranches: Tranche[]) => void;
    simBudget: number;
    liveKetsPrice: number;
    auctionSavingsRate: number;
}

// ── Helpers ──
const fmt = (n: number) => n.toLocaleString('ko-KR');
const fmtB = (n: number) => n.toLocaleString('ko-KR');
const fmtP = (n: number) => n.toLocaleString('ko-KR');

/**
 * Returns a dynamic font size class based on the length of the string
 * to prevent layout breakage in small KPI cards.
 */
const getFontSizeClass = (val: string | number) => {
    const s = String(val);
    if (s.length > 16) return "text-xs";
    if (s.length > 14) return "text-sm";
    if (s.length > 12) return "text-lg";
    if (s.length > 10) return "text-xl";
    if (s.length > 8) return "text-2xl";
    if (s.length > 6) return "text-3xl";
    return "text-4xl";
};

export const SimulatorTab: React.FC<SimulatorTabProps> = ({
    selectedMarket, setSelectedMarket, timeRange, setTimeRange, trendData, fullHistoryData, handleChartClick,
    priceScenario, setPriceScenario, customPrice, setCustomPrice,
    allocationChange, setAllocationChange, emissionChange, setEmissionChange,
    reductionOptions, toggleReduction, simResult: r,
    auctionEnabled, setAuctionEnabled, auctionTargetPct, setAuctionTargetPct,
    currentETSPrice, baseAllocation,
    tranches, setTranches, simBudget, liveKetsPrice, auctionSavingsRate
}: SimulatorTabProps) => {
    // Procurement calculations for the visual bar
    const freeAllocPct = r.adjustedEmissions > 0 ? Math.min(100, (r.adjustedAllocation / r.adjustedEmissions) * 100) : 0;
    const remainPct = 100 - freeAllocPct;
    const auctionPct = auctionEnabled ? Math.min(remainPct, auctionTargetPct) : 0;
    const marketPct = Math.max(0, remainPct - auctionPct);

    // 연평균 시장가 (툴팁 표시용)
    const avgMarketPrice = useMemo(() => {
        const actuals = fullHistoryData.filter((d: TrendData) => d.type === 'actual');
        if (actuals.length === 0) return 0;
        return Math.round(actuals.reduce((sum: number, d: TrendData) => sum + (d.krPrice || 0), 0) / actuals.length);
    }, [fullHistoryData]);

    // Step 2: Strategy allocation ratio (Compliance vs Reduction Facility)
    const [complianceRatio, setComplianceRatio] = useState(70);
    const reductionRatio = 100 - complianceRatio;
    // Purchase target based on compliance ratio
    const purchaseTarget = Math.round(r.netExposure * (complianceRatio / 100));

    // Step 1: Collapsible settings toggle
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Tooltip hover states
    const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

    // Calculate dynamic values from API data
    const getDynamicMarketData = (marketId: string) => {
        const base = MARKET_DATA[marketId as MarketType];

        // Use fullHistoryData instead of trendData for absolute latest metrics
        let dataToUse = fullHistoryData && fullHistoryData.length > 0 ? fullHistoryData : trendData;

        // Filter out future 'forecast' type dates to only show actual realized metrics in the cards
        const realizedData = dataToUse.filter(d => d.type !== 'forecast');

        if (!realizedData || realizedData.length < 2) return base;

        const latest = realizedData[realizedData.length - 1];
        const prev = realizedData[realizedData.length - 2];

        let currPrice = base.price;
        let prevPrice = base.price;

        if (marketId === 'EU-ETS') {
            currPrice = latest.euPrice || base.price;
            prevPrice = prev.euPrice || base.price;
        } else if (marketId === 'K-ETS') {
            currPrice = latest.krPrice || base.price;
            prevPrice = prev.krPrice || base.price;
        }

        const change = prevPrice > 0 ? ((currPrice - prevPrice) / prevPrice) * 100 : 0;

        return {
            ...base,
            price: currPrice,
            change: Number(change.toFixed(1))
        };
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. Market Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.values(MARKET_DATA).map((baseMarket: any) => {
                    const market = getDynamicMarketData(baseMarket.id);
                    const isActive = selectedMarket === market.id;
                    return (
                        <Card
                            key={market.id}
                            variant={isActive ? 'active' : 'hoverable'}
                            onClick={() => setSelectedMarket(market.id as MarketType)}
                            className="cursor-pointer bg-white p-5 border border-slate-100 shadow-sm"
                            padding="none"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    {market.id === 'EU-ETS' && <Euro size={20} className="text-slate-500" />}
                                    {market.id === 'K-ETS' && <Globe size={20} className="text-slate-500" />}
                                    <span className="text-sm font-medium text-slate-500">{market.ticker}</span>
                                </div>
                                <span className={cn(
                                    "text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1",
                                    market.change >= 0
                                        ? "bg-emerald-50 text-emerald-600"
                                        : "bg-red-50 text-red-600"
                                )}>
                                    {market.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                    {Math.abs(market.change)}%
                                </span>
                            </div>
                            <div className="text-3xl font-bold text-slate-900 tracking-tight">
                                {market.id === 'EU-ETS' ? '€' : '₩'}
                                {market.id === 'EU-ETS' ? market.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Math.round(market.price).toLocaleString()}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* 2. Global Price Trends Chart (Preserved) */}
            <Card padding="lg" className="relative overflow-hidden bg-white border border-slate-100">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">글로벌 가격 동향</h3>
                        <p className="text-sm text-slate-500">글로벌 ETS 가격 비교</p>
                        <div className="flex gap-2 mt-2">
                            <p className="text-[10px] text-[#10b77f] font-bold bg-[#10b77f]/10 w-fit px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Database size={10} /> Source: EEX & KRX Data
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex gap-3 text-xs font-medium">
                            <div className={cn("flex items-center gap-1.5 transition-opacity", selectedMarket === 'K-ETS' ? "opacity-100 font-bold text-slate-900" : "opacity-60 text-slate-400")}><span className="w-2 h-2 rounded-full bg-[#10b77f]"></span> 한국 (KRW)</div>
                            <div className={cn("flex items-center gap-1.5 transition-opacity", selectedMarket === 'EU-ETS' ? "opacity-100 font-bold text-slate-900" : "opacity-60 text-slate-400")}><span className="w-2 h-2 rounded-full bg-[#4dabf7]"></span> 유럽 (EUR)</div>
                        </div>
                        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                        <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-medium">
                            {(['1개월', '3개월', '1년', '전체'] as const).map((range: string) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range as TimeRangeType)}
                                    className={cn("px-3 py-1 rounded transition-colors", timeRange === range ? "bg-white text-slate-900 shadow-sm" : "hover:bg-white/50 text-slate-500")}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div key={timeRange} className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={trendData} onClick={handleChartClick} className="cursor-crosshair">
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                                tickFormatter={(value) => {
                                    if (!value) return '';
                                    const d = new Date(value);
                                    if (timeRange === '전체' || timeRange === '1년') return `${d.getFullYear()}.${d.getMonth() + 1}`;
                                    return `${d.getMonth() + 1}.${d.getDate()}`;
                                }}
                            />
                            <YAxis yAxisId="left" orientation="left" hide={false} domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#4dabf7' }} label={{ value: 'EUR', angle: -90, position: 'insideLeft', fill: '#4dabf7', fontSize: 10 }} />
                            <YAxis yAxisId="right" orientation="right" hide={false} domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#10b77f' }} label={{ value: 'KRW', angle: 90, position: 'insideRight', fill: '#10b77f', fontSize: 10 }} />
                            <Tooltip content={<CustomTooltip />} />
                            {(timeRange !== '1개월') && (
                                <ReferenceLine yAxisId="left" x="2026-01-01" stroke="#94a3b8" strokeDasharray="5 5" label={{ value: '현재', fill: '#94a3b8', fontSize: 10 }} />
                            )}
                            <Line yAxisId="left" type="monotone" dataKey="euPrice" name="EU-ETS" stroke={MARKET_DATA['EU-ETS'].color} strokeWidth={selectedMarket === 'EU-ETS' ? 3 : 1.5} strokeOpacity={selectedMarket === 'EU-ETS' ? 1 : 0.6} dot={false} />
                            <Line yAxisId="right" type="monotone" dataKey="krPrice" name="K-ETS" stroke={MARKET_DATA['K-ETS'].color} strokeWidth={selectedMarket === 'K-ETS' ? 3 : 1.5} strokeOpacity={selectedMarket === 'K-ETS' ? 1 : 0.6} dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* 3. New Advanced Simulator Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 px-1">
                    <Sparkles className="text-emerald-500" size={20} />
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">K-ETS 고급 시뮬레이션</h3>
                </div>

                {/* ═══════════════════════════════════════════ */}
                {/* STEP 1: 직접 탄소 배출량 (Direct Carbon Emissions) */}
                {/* ═══════════════════════════════════════════ */}
                <Card padding="lg" className="border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 text-sm font-black">1</div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">직접 탄소 배출량</h3>
                        <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold">
                                {priceScenario === 'custom' ? `₩${fmt(customPrice)}` : `실시간 ₩${fmt(liveKetsPrice)}`}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold">
                                배출 {emissionChange >= 0 ? '+' : ''}{emissionChange}%
                            </span>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 mb-8 ml-11 font-medium">핵심 지표 요약 및 시나리오 분석</p>

                    {/* ── KPI Summary Row + Bar Chart ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                        {/* Left: 3 KPI Cards (7 col) */}
                        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* KPI 1: 예상 배출량 */}
                            <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">예상 배출량</span>
                                    <div className="relative"
                                        onMouseEnter={(e) => { const tip = e.currentTarget.querySelector('[data-tip]') as HTMLElement; if (tip) { tip.style.opacity = '1'; tip.style.visibility = 'visible'; } }}
                                        onMouseLeave={(e) => { const tip = e.currentTarget.querySelector('[data-tip]') as HTMLElement; if (tip) { tip.style.opacity = '0'; tip.style.visibility = 'hidden'; } }}
                                    >
                                        <div className="w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center cursor-help transition-colors">
                                            <span className="text-[9px] font-bold text-slate-500">?</span>
                                        </div>
                                        <div data-tip className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-slate-800 text-white text-[11px] leading-relaxed rounded-lg shadow-xl z-50 pointer-events-none transition-all duration-200" style={{ opacity: 0, visibility: 'hidden' as any }}>
                                            <p className="font-bold mb-1">기업의 최신 공시 배출량</p>
                                            <p className="text-slate-300">가장 최근 보고서에 공시된 Scope1 + Scope2 실제 배출량 기반의 값입니다.</p>
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                                        </div>
                                    </div>
                                </div>
                                <p className={cn("font-black text-slate-900 tracking-tight transition-all", getFontSizeClass(fmt(r.adjustedEmissions)))}>
                                    {fmt(r.adjustedEmissions)}
                                </p>
                                <p className="text-xs text-slate-400 font-semibold mt-2">tCO₂e (S1+S2)</p>
                            </div>

                            {/* KPI 2: 순 노출량 */}
                            <div className={cn(
                                "p-8 rounded-2xl border shadow-sm",
                                r.netExposure > 0
                                    ? "bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-100"
                                    : "bg-gradient-to-br from-emerald-50 to-green-50/50 border-emerald-100"
                            )}>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className={cn("w-2 h-2 rounded-full", r.netExposure > 0 ? "bg-amber-500" : "bg-emerald-500")} />
                                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">순 노출량</span>
                                </div>
                                <p className={cn("font-black tracking-tight transition-all",
                                    r.netExposure > 0 ? "text-amber-600" : "text-emerald-600",
                                    getFontSizeClass(fmt(r.netExposure))
                                )}>
                                    {fmt(r.netExposure)}
                                </p>
                                <p className="text-xs text-slate-400 font-semibold mt-2">tCO₂e (Net Exposure)</p>
                            </div>

                            {/* KPI 3: 예상 비용 */}
                            <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">예상 비용</span>
                                </div>
                                <p className={cn("font-black text-blue-700 tracking-tight transition-all", getFontSizeClass(fmtB(Math.round(r.totalCarbonCost))))}>
                                    {fmtB(Math.round(r.totalCarbonCost))}
                                </p>
                                <p className="text-xs text-slate-400 font-semibold mt-2">(총 탄소비용)</p>
                            </div>
                        </div>

                        {/* Right: Simple Bar Visualization (5 col) */}
                        <div className="lg:col-span-5 flex flex-col justify-center p-8 rounded-2xl bg-slate-50/50 border border-slate-100 shadow-sm">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">배출 · 할당 · 노출량 비교</p>
                            {/* Bar: 예상 배출량 */}
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-[11px] text-slate-500 font-medium">예상 배출</span>
                                        <span className="text-[11px] text-slate-700 font-bold font-mono">{fmt(r.adjustedEmissions)}</span>
                                    </div>
                                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-slate-500 rounded-full transition-all duration-500" style={{ width: '100%' }} />
                                    </div>
                                </div>
                                {/* Bar: 무상 할당 */}
                                <div>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-[11px] text-slate-500 font-medium">무상 할당</span>
                                        <span className="text-[11px] text-blue-600 font-bold font-mono">{fmt(r.adjustedAllocation)}</span>
                                    </div>
                                    <div className="h-3 bg-blue-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-400 rounded-full transition-all duration-500"
                                            style={{ width: `${r.adjustedEmissions > 0 ? Math.min(100, (r.adjustedAllocation / r.adjustedEmissions) * 100) : 0}%` }} />
                                    </div>
                                </div>
                                {/* Bar: 감축량 */}
                                <div>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-[11px] text-slate-500 font-medium">올해 감축</span>
                                        <span className="text-[11px] text-emerald-600 font-bold font-mono">{fmt(r.thisYearReduction)}</span>
                                    </div>
                                    <div className="h-3 bg-emerald-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                                            style={{ width: `${r.adjustedEmissions > 0 ? Math.min(100, (r.thisYearReduction / r.adjustedEmissions) * 100) : 0}%` }} />
                                    </div>
                                </div>
                                {/* Bar: 순 노출량 */}
                                <div>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-[11px] text-slate-500 font-medium">순 노출량</span>
                                        <span className={cn("text-[11px] font-bold font-mono", r.netExposure > 0 ? "text-amber-600" : "text-emerald-600")}>{fmt(r.netExposure)}</span>
                                    </div>
                                    <div className="h-3 bg-amber-100 rounded-full overflow-hidden">
                                        <div className={cn("h-full rounded-full transition-all duration-500", r.netExposure > 0 ? "bg-amber-400" : "bg-emerald-400")}
                                            style={{ width: `${r.adjustedEmissions > 0 ? Math.min(100, (Math.abs(r.netExposure) / r.adjustedEmissions) * 100) : 0}%` }} />
                                    </div>
                                </div>
                            </div>

                            {/* Procurement Mix Mini Bar */}
                            <div className="mt-5 pt-4 border-t border-slate-200/60">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">조달 구성</p>
                                <div className="flex rounded-full overflow-hidden h-2.5">
                                    <div style={{ width: `${freeAllocPct}%` }} className="bg-emerald-200 transition-all duration-500" />
                                    <div style={{ width: `${auctionPct}%` }} className="bg-emerald-500 transition-all duration-500" />
                                    <div style={{ width: `${marketPct}%` }} className="bg-slate-400 transition-all duration-500" />
                                </div>
                                <div className="grid grid-cols-3 gap-1 text-[10px] font-bold mt-1.5 text-center">
                                    <div className="text-emerald-400">무상 {freeAllocPct.toFixed(0)}%</div>
                                    <div className="text-emerald-600">경매 {auctionPct.toFixed(0)}%</div>
                                    <div className="text-slate-400">시장 {marketPct.toFixed(0)}%</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Secondary Metrics Row ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">컴플라이언스 비용</span>
                            <span className="text-lg font-black text-slate-800">{fmt(Math.round(r.complianceCostBase))}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">실효 탄소가격</span>
                            <span className="text-lg font-black text-slate-800">₩{fmtP(Math.round(r.effectiveCarbonPrice))}<span className="text-[10px] text-slate-400 ml-0.5">/t</span></span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">영업이익 대비</span>
                            <span className={cn("text-lg font-black", r.profitImpact > 3 ? "text-amber-500" : "text-emerald-600")}>{r.profitImpact.toFixed(2)}<span className="text-[10px] text-slate-400 ml-0.5">%</span></span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">경제적 감축 여력</span>
                            <span className="text-lg font-black text-blue-600">{fmt(r.economicAbatementPotential)}<span className="text-[10px] text-slate-400 ml-0.5">t</span></span>
                        </div>
                    </div>

                    {/* ── Auction Toggle Row (Simplified) ── */}
                    <div className="flex justify-between items-center mb-6 px-4 py-3 rounded-xl bg-emerald-50/50 border border-emerald-100 shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700">경매 조달 시 예상 절감률</span>
                            <div className="px-2 py-0.5 rounded bg-emerald-100/80 text-emerald-700 font-mono font-bold text-xs">
                                {auctionSavingsRate}%
                            </div>
                            <div className="group relative">
                                <HelpCircle
                                    size={14}
                                    className="text-slate-400 cursor-help"
                                    onMouseEnter={() => setHoveredTooltip('auction')}
                                    onMouseLeave={() => setHoveredTooltip(null)}
                                />
                                <AnimatePresence>
                                    {hoveredTooltip === 'auction' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, x: '-50%' }}
                                            animate={{ opacity: 1, y: 0, x: '-50%' }}
                                            exit={{ opacity: 0, y: 10, x: '-50%' }}
                                            className="absolute bottom-full left-1/2 mb-2 px-4 py-3 bg-slate-900 shadow-xl text-white text-[10px] rounded-lg z-10 pointer-events-none border border-slate-700 font-medium leading-relaxed"
                                        >
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                                            <div className="whitespace-nowrap">(연평균 시장가 − 연평균 경매낙찰가) ÷ 연평균 시장가 × 100</div>
                                            <div className="whitespace-nowrap mt-1.5 text-emerald-300 font-mono">(₩{fmt(avgMarketPrice)} − ₩{fmt(AUCTION_CONFIG.avgAuctionPrice)}) ÷ ₩{fmt(avgMarketPrice)} × 100 = {auctionSavingsRate}%</div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                        <button
                            onClick={() => setAuctionEnabled(!auctionEnabled)}
                            className={cn(
                                "relative w-11 h-6 rounded-full transition-all duration-300",
                                auctionEnabled ? "bg-emerald-500 shadow-inner" : "bg-slate-300"
                            )}
                        >
                            <span className={cn(
                                "absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 transform",
                                auctionEnabled ? "translate-x-5" : "translate-x-0"
                            )} />
                        </button>
                    </div>

                    {/* ── Collapsible Settings ── */}
                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors group"
                    >
                        <div className="flex items-center gap-2">
                            <Settings size={14} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-600">상세 시나리오 설정</span>
                            <span className="text-[10px] text-slate-400">ETS 가격 · 배출량 변동 · 할당 정책 · 경매 설정</span>
                        </div>
                        {isSettingsOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </button>

                    {isSettingsOpen && (
                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                            {/* Settings Left: Price Scenario + Emission Change */}
                            <div className="space-y-5 p-5 rounded-xl bg-slate-50/50 border border-slate-100">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-3 block tracking-wide">ETS 가격 시나리오</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setPriceScenario('base')}
                                            className={cn(
                                                "px-4 py-2.5 rounded-xl text-sm transition-all border",
                                                priceScenario === 'base' ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                            )}>
                                            <span className="block font-bold">기준 (실시간)</span>
                                            <span className="block mt-1 text-xs opacity-70 font-mono">₩{fmt(liveKetsPrice)}</span>
                                        </button>
                                        <button onClick={() => setPriceScenario('custom')}
                                            className={cn(
                                                "px-4 py-2.5 rounded-xl text-sm transition-all border font-bold",
                                                priceScenario === 'custom' ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                            )}>
                                            직접 입력
                                        </button>
                                    </div>
                                    {priceScenario === 'custom' && (
                                        <div className="mt-3 flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 animate-in slide-in-from-top-1">
                                            <span className="text-xs font-mono text-slate-400">₩</span>
                                            <input type="number" value={customPrice} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomPrice(Number(e.target.value))}
                                                className="bg-transparent w-full text-sm font-bold text-slate-900 focus:outline-none" />
                                        </div>
                                    )}
                                </div>

                                <div className="pt-3 border-t border-slate-200/60">
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-3 block tracking-wide">배출량 변동 ({emissionChange >= 0 ? '+' : ''}{emissionChange}%)</label>
                                    <input type="range" min={-50} max={50} step={1} value={emissionChange}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmissionChange(Number(e.target.value))}
                                        className="w-full h-1.5 bg-slate-200 rounded-full cursor-pointer accent-emerald-500 appearance-none" />
                                    <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono">
                                        <span>−50%</span><span>0%</span><span>+50%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Settings Right: Allocation + Auction */}
                            <div className="space-y-5 p-5 rounded-xl bg-slate-50/50 border border-slate-100">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-3 block tracking-wide">무상할당 정책 변동</label>
                                    <div className="space-y-2">
                                        {(Object.entries(ALLOCATION_SCENARIOS) as [AllocationChangeType, typeof ALLOCATION_SCENARIOS.maintain][]).map(([key, sc]) => {
                                            const maintainSc = ALLOCATION_SCENARIOS.maintain;
                                            const maintainAllocation = Math.round(baseAllocation * maintainSc.factor);
                                            const maintainNetExposure = Math.max(0, r.adjustedEmissions - maintainAllocation - r.thisYearReduction);

                                            const scenarioAllocation = Math.round(baseAllocation * sc.factor);
                                            const scenarioNetExposure = Math.max(0, r.adjustedEmissions - scenarioAllocation - r.thisYearReduction);
                                            const deltaExposure = scenarioNetExposure - maintainNetExposure;
                                            const deltaCost = (deltaExposure * currentETSPrice);
                                            const isActive = allocationChange === key;

                                            return (
                                                <button key={key} onClick={() => setAllocationChange(key)}
                                                    className={cn(
                                                        "w-full text-left px-4 py-3 rounded-xl text-sm transition-all border flex flex-col gap-1",
                                                        isActive ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                                    )}>
                                                    <div className="flex justify-between items-center w-full">
                                                        <span className="font-bold">{sc.label}</span>
                                                        {deltaExposure !== 0 && (
                                                            <span className={cn(
                                                                "text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1",
                                                                deltaExposure > 0
                                                                    ? (isActive ? "bg-red-500/20 text-red-200" : "bg-red-50 text-red-600")
                                                                    : (isActive ? "bg-emerald-500/20 text-emerald-200" : "bg-emerald-50 text-emerald-600")
                                                            )}>
                                                                {deltaCost > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                                {Math.abs(deltaCost) > 0 ? `${deltaCost > 0 ? '+' : ''}₩${fmt(Math.round(deltaCost))}` : '부담 미미'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between items-center w-full">
                                                        <span className={cn("text-[11px] leading-tight", isActive ? "text-slate-400" : "text-slate-500")}>
                                                            {sc.description}
                                                        </span>
                                                        {deltaExposure !== 0 && (
                                                            <span className={cn("font-mono text-[10px] font-medium", isActive ? "text-slate-500" : "text-slate-400")}>
                                                                {deltaExposure > 0 ? `+${fmt(deltaExposure)}t` : `${fmt(deltaExposure)}t`}
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-200/60">
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-3 block tracking-wide">경매 상세 설정</label>
                                    <div className="flex justify-between items-baseline mb-2">
                                        <span className="text-[11px] text-slate-500">최대 비분배분 조달 비중</span>
                                        <span className="text-[11px] font-bold text-emerald-600">{auctionTargetPct}%</span>
                                    </div>
                                    <input type="range" min={0} max={AUCTION_CONFIG.maxPct} step={5} value={auctionTargetPct}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuctionTargetPct(Number(e.target.value))}
                                        className="w-full h-1.5 bg-slate-200 rounded-full cursor-pointer accent-emerald-500 appearance-none" />
                                    <p className="text-[10px] text-slate-400 mt-2 font-medium leading-relaxed">
                                        K-ETS 경매는 연 6~8회, 총 할당량의 3~10%만 공급되어 전량 경매 조달은 불가합니다.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>

                {/* ═══════════════════════════════════════════ */}
                {/* STEP 2: 전략 배분 (Strategy Allocation) */}
                {/* ═══════════════════════════════════════════ */}
                <Card padding="lg" className="border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-black">2</div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">전략 배분</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-8 ml-11 font-medium">컴플라이언스 vs 감축시설 투자 비율 설정</p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-4 block tracking-wide">
                                컴플라이언스 비율 ({complianceRatio}%)
                            </label>
                            <input type="range" min={0} max={100} step={5} value={complianceRatio}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComplianceRatio(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-100 rounded-full cursor-pointer accent-blue-500 appearance-none" />
                            <div className="flex justify-between items-center text-[11px] font-bold mt-3">
                                <span className="text-emerald-600">자산 투자형 (직접 감축)</span>
                                <span className="text-blue-600">비용 지출형 (배출권 구매)</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                                <span>감축시설 100%</span><span>균형</span><span>컴플라이언스 100%</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Card 1: Compliance */}
                            <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100 text-center shadow-sm relative">
                                <div className="flex items-center justify-center gap-1.5 mb-2">
                                    <span className="text-[11px] text-blue-500 font-bold uppercase tracking-wide">배출권 구매</span>
                                    <div className="relative">
                                        <HelpCircle
                                            size={12}
                                            className="text-blue-300 cursor-help"
                                            onMouseEnter={() => setHoveredTooltip('compliance')}
                                            onMouseLeave={() => setHoveredTooltip(null)}
                                        />
                                        <AnimatePresence>
                                            {hoveredTooltip === 'compliance' && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: 10, x: '-50%' }}
                                                    animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
                                                    exit={{ opacity: 0, scale: 0.95, y: 10, x: '-50%' }}
                                                    className="absolute bottom-full left-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-[10px] rounded-lg w-60 z-20 pointer-events-none leading-relaxed shadow-2xl border border-slate-700 text-left font-medium"
                                                >
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                                                    정부 규제를 준수하기 위해 시장에서 부족한 탄소 배출권을 직접 매수하는 방식입니다. 즉각적인 대응이 가능하지만 비용이 발생합니다.
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                                <span className="text-2xl font-black text-blue-700">{complianceRatio}%</span>
                                <div className="p-3 bg-blue-50/50 rounded-xl">
                                    <div className="text-[9px] text-slate-400 font-bold uppercase mb-1">예상 구매 비용</div>
                                    <span className="text-sm font-black text-blue-600">₩{fmt(Math.round(purchaseTarget * currentETSPrice))}</span>
                                    <div className="text-[9px] text-slate-400 mt-0.5 font-medium">{fmt(purchaseTarget)} tCO₂e</div>
                                </div>
                            </div>

                            {/* Card 2: Abatement */}
                            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 text-center shadow-sm relative">
                                <div className="flex items-center justify-center gap-1.5 mb-2">
                                    <span className="text-[11px] text-emerald-500 font-bold uppercase tracking-wide">감축시설 투자</span>
                                    {/* ... rest of the card header ... */}
                                    <div className="relative">
                                        <HelpCircle
                                            size={12}
                                            className="text-emerald-300 cursor-help"
                                            onMouseEnter={() => setHoveredTooltip('abatement')}
                                            onMouseLeave={() => setHoveredTooltip(null)}
                                        />
                                        <AnimatePresence>
                                            {hoveredTooltip === 'abatement' && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: 10, x: '-50%' }}
                                                    animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
                                                    exit={{ opacity: 0, scale: 0.95, y: 10, x: '-50%' }}
                                                    className="absolute bottom-full left-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-[10px] rounded-lg w-60 z-20 pointer-events-none leading-relaxed shadow-2xl border border-slate-700 text-left font-medium"
                                                >
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                                                    공정 개선이나 친환경 설비를 도입하여 탄소 배출량 자체를 물리적으로 줄이는 방식입니다. 초기 투자비는 크지만 장기적인 비용을 절감합니다.
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                                <span className="text-2xl font-black text-emerald-700">{reductionRatio}%</span>
                                <div className="p-3 bg-emerald-50/50 rounded-xl">
                                    <div className="text-[9px] text-slate-400 font-bold uppercase mb-1">예상 감축 비용</div>
                                    <span className="text-sm font-black text-emerald-600">₩{fmt(Math.round(r.totalAbatementCost))}</span>
                                    <div className="text-[9px] text-slate-400 mt-0.5 font-medium">{fmt(Math.round(r.netExposure * (reductionRatio / 100)))} tCO₂e</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* ═══════════════════════════════════════════ */}
                {/* STEP 3: 분할 매수 포트폴리오 (Split Purchase Portfolio) */}
                {/* ═══════════════════════════════════════════ */}
                <Card padding="lg" className="border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-600 text-sm font-black">3</div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">분할 매수 포트폴리오</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-8 ml-11 font-medium">매수 전략 및 리스크 평가</p>

                    <div>
                        {/* Split Purchase Portfolio + Results */}
                        {(() => {
                            // VWAP Calculations
                            const kTranches = tranches.filter(t => t.market === 'K-ETS');
                            const euTranches = tranches.filter(t => t.market === 'EU-ETS');
                            const kTotalPct = kTranches.reduce((s, t) => s + t.percentage, 0);
                            const euTotalPct = euTranches.reduce((s, t) => s + t.percentage, 0);
                            const kVwap = kTotalPct > 0 ? kTranches.reduce((s, t) => s + t.price * t.percentage, 0) / kTotalPct : 0;
                            const euVwap = euTotalPct > 0 ? euTranches.reduce((s, t) => s + t.price * t.percentage, 0) / euTotalPct : 0;
                            const totalPct = tranches.reduce((s, t) => s + t.percentage, 0);
                            // Total expenditure = purchase target * weighted avg price
                            const totalExpenditure = purchaseTarget > 0 ? (purchaseTarget * kVwap) : 0;
                            const budgetBillion = simBudget * 1e8; // Convert input budget (assumed in billions) to full Won
                            const riskRatio = budgetBillion > 0 ? (totalExpenditure / budgetBillion) * 100 : 0;

                            const handlePctChange = (id: number, newPct: number) => {
                                setTranches(tranches.map(t => t.id === id ? { ...t, percentage: Math.max(0, Math.min(100, newPct)) } : t));
                            };
                            const handleDelete = (id: number) => {
                                setTranches(tranches.filter(t => t.id !== id));
                            };
                            const handleAdd = () => {
                                const remaining = Math.max(0, 100 - totalPct);
                                if (remaining <= 0) return;
                                setTranches([...tranches, {
                                    id: Date.now(),
                                    market: 'K-ETS',
                                    price: currentETSPrice,
                                    month: '26.03',
                                    isFuture: false,
                                    percentage: Math.min(10, remaining)
                                }]);
                            };

                            return (
                                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                                    {/* Left: Portfolio Card */}
                                    <Card padding="lg" className="xl:col-span-3">
                                        <div className="flex items-center justify-between mb-5">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <LayoutGrid className="text-slate-700" size={20} />
                                                    <h4 className="text-base font-bold text-slate-900">매수 시뮬레이션</h4>
                                                </div>
                                                <div className="h-4 w-px bg-slate-200" />
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5 leading-none">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">목표 매수량</span>
                                                        <span className="text-sm font-black text-blue-600">
                                                            {fmt(purchaseTarget)} <span className="text-[10px] font-medium opacity-60">tCO₂e</span>
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] text-slate-500 font-bold">목표 대비</span>
                                                            <span className={cn(
                                                                "text-[11px] font-black",
                                                                totalPct < 90 ? "text-amber-600" : totalPct > 110 ? "text-red-600" : "text-emerald-600"
                                                            )}>
                                                                {totalPct.toFixed(0)}%
                                                            </span>
                                                            <span className="text-[9px] text-slate-400 font-bold ml-0.5 whitespace-nowrap">구성 중</span>
                                                        </div>
                                                        <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${Math.min(100, totalPct)}%` }}
                                                                className={cn(
                                                                    "h-full rounded-full transition-all duration-500",
                                                                    totalPct < 90 ? "bg-amber-500" : totalPct > 110 ? "bg-red-500" : "bg-emerald-500"
                                                                )}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                    K-ETS: {kTotalPct}%
                                                </span>
                                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                                    EU-ETS: {euTotalPct}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {tranches.map((t: Tranche) => (
                                                <div key={t.id} className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 hover:border-slate-200 transition-all">
                                                    {/* Market Tag */}
                                                    <span className={cn(
                                                        "shrink-0 text-[10px] font-black px-2 py-1 rounded-md",
                                                        t.market === 'K-ETS' ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"
                                                    )}>
                                                        {t.market === 'K-ETS' ? 'K' : 'EU'}
                                                    </span>

                                                    {/* Percentage Label */}
                                                    <span className="text-[10px] text-slate-400 shrink-0 w-10">매수 비중</span>

                                                    {/* Slider */}
                                                    <div className="flex-1 flex items-center gap-2">
                                                        <input
                                                            type="range"
                                                            min={0}
                                                            max={100}
                                                            value={t.percentage}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePctChange(t.id, Number(e.target.value))}
                                                            className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-500"
                                                        />
                                                        <span className="text-xs font-bold text-slate-700 w-10 text-right">{t.percentage}%</span>
                                                    </div>

                                                    {/* Price */}
                                                    <div className="shrink-0 text-right w-24">
                                                        <span className="text-[10px] text-slate-400">단가</span>
                                                        <p className="text-sm font-black text-slate-900 leading-none">₩{fmt(t.price)}</p>
                                                    </div>

                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => handleDelete(t.id)}
                                                        className="shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}

                                            {/* Add Button */}
                                            {totalPct < 100 && (
                                                <button
                                                    onClick={handleAdd}
                                                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-500 transition-colors text-xs font-medium"
                                                >
                                                    <Plus size={14} />
                                                    매수 추가
                                                </button>
                                            )}
                                        </div>
                                    </Card>

                                    {/* Right: Results Card (Dark) */}
                                    <div className="xl:col-span-2 rounded-2xl bg-slate-900 p-8 flex flex-col justify-between shadow-xl">
                                        <div>
                                            <div className="flex items-center gap-2 mb-5">
                                                <Database className="text-emerald-400" size={16} />
                                                <h4 className="text-sm font-bold text-white">분할 매수 결과</h4>
                                            </div>

                                            {/* Terminology Refactor: VWAP -> 내 평균 구매가 (My Avg Purchase Price) */}
                                            <div className="grid grid-cols-2 gap-3 mb-5">
                                                {/* K-ETS Result Item */}
                                                <div className="rounded-xl bg-slate-800 border border-slate-700 p-4 text-center group relative">
                                                    <div className="flex items-center justify-center gap-1 mb-1.5">
                                                        <span className="text-[10px] text-slate-400 font-bold">K-ETS 내 평균 구매가</span>
                                                        <div className="relative">
                                                            <HelpCircle
                                                                size={11}
                                                                className="text-slate-600 cursor-help"
                                                                onMouseEnter={() => setHoveredTooltip('k-vwap')}
                                                                onMouseLeave={() => setHoveredTooltip(null)}
                                                            />
                                                            <AnimatePresence>
                                                                {hoveredTooltip === 'k-vwap' && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                                                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] rounded-lg w-40 z-20 pointer-events-none leading-relaxed shadow-xl border border-slate-700"
                                                                    >
                                                                        여러 번 나누어 샀을 때의 평균 가격입니다.
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </div>
                                                    <p className="text-lg font-black text-emerald-400 leading-tight">₩ {fmt(Math.round(kVwap))}</p>

                                                    {kVwap > 0 && (
                                                        <div className={cn(
                                                            "mt-2 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tight",
                                                            kVwap < currentETSPrice ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"
                                                        )}>
                                                            {kVwap < currentETSPrice ? "시장가 대비 유리" : "주의 필요"}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* EU-ETS Result Item */}
                                                <div className="rounded-xl bg-slate-800 border border-slate-700 p-4 text-center group relative">
                                                    <div className="flex items-center justify-center gap-1 mb-1.5">
                                                        <span className="text-[10px] text-slate-400 font-bold">EU-ETS 내 평균 구매가</span>
                                                        <div className="relative">
                                                            <HelpCircle
                                                                size={11}
                                                                className="text-slate-600 cursor-help"
                                                                onMouseEnter={() => setHoveredTooltip('eu-vwap')}
                                                                onMouseLeave={() => setHoveredTooltip(null)}
                                                            />
                                                            <AnimatePresence>
                                                                {hoveredTooltip === 'eu-vwap' && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                                                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] rounded-lg w-40 z-20 pointer-events-none leading-relaxed shadow-xl border border-slate-700"
                                                                    >
                                                                        여러 번 나누어 샀을 때의 평균 가격입니다.
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </div>
                                                    <p className="text-lg font-black text-emerald-400 leading-tight">₩ {fmt(Math.round(euVwap))}</p>

                                                    {euVwap > 0 && (
                                                        <div className={cn(
                                                            "mt-2 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tight",
                                                            euVwap < MARKET_DATA['EU-ETS'].price ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"
                                                        )}>
                                                            {euVwap < MARKET_DATA['EU-ETS'].price ? "시장가 대비 유리" : "주의 필요"}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mb-5">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">총 예상 구매비용</span>
                                                <p className={cn("font-black text-white mt-1", getFontSizeClass(fmt(totalExpenditure)))}>
                                                    ₩ {fmt(totalExpenditure)}
                                                </p>
                                            </div>

                                            {/* Carbon Risk */}
                                            <div className="border-t border-slate-700 pt-4">
                                                <div className="flex items-center gap-1.5 mb-3">
                                                    <ShieldCheck size={13} className="text-slate-400" />
                                                    <span className="text-[10px] font-medium text-slate-400">카본 리스크 평정</span>
                                                </div>

                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] text-slate-500">연간 탄소 예산 (BUDGET)</span>
                                                    <span className="text-xs font-bold text-white">₩ {fmt(budgetBillion)}</span>
                                                </div>

                                                {/* Risk Indicator */}
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-3 h-3 rounded-full",
                                                        riskRatio < 50 ? "bg-emerald-400" : riskRatio < 80 ? "bg-amber-400" : "bg-red-400"
                                                    )} />
                                                    <span className={cn(
                                                        "text-[10px] font-bold",
                                                        riskRatio < 50 ? "text-emerald-400" : riskRatio < 80 ? "text-amber-400" : "text-red-400"
                                                    )}>
                                                        {riskRatio < 50 ? '안전' : riskRatio < 80 ? '주의' : '위험'} ({riskRatio.toFixed(0)}%)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </Card>

                {/* ═══════════════════════════════════════════ */}
                {/* STEP 4: 시뮬레이션 결과 요약 (Simulation Summary) */}
                {/* ═══════════════════════════════════════════ */}
                <div id="step-4-summary">
                    <Card padding="lg" className="border-2 border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-md">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-black">4</div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">시뮬레이션 결과 요약</h3>
                            <div className="ml-auto">
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest",
                                    r.totalCarbonCost <= simBudget * 1e8 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                )}>
                                    {r.totalCarbonCost <= simBudget * 1e8 ? "Budget Safe" : "Budget Over"}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-8 ml-11 font-medium">최종 전략 수립 및 의사결정 참고 자료</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ml-11">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">최종 예상 탄소비용</span>
                                    <p className={cn("font-black text-slate-900 italic", getFontSizeClass(fmt(Math.round(r.totalCarbonCost))))}>₩ {fmt(Math.round(r.totalCarbonCost))}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">탄소 예산 대비</span>
                                    <span className={cn(
                                        "text-xl font-black italic",
                                        r.totalCarbonCost <= simBudget * 1e8 ? "text-emerald-600" : "text-red-600"
                                    )}>
                                        {r.totalCarbonCost <= simBudget * 1e8 ? '-' : '+'}{fmt(Math.round(Math.abs(r.totalCarbonCost - simBudget * 1e8)))}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">전략 권고</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Sparkles className="text-amber-500" size={18} />
                                        <span className="text-sm font-black text-slate-700">
                                            {r.totalCarbonCost <= simBudget * 1e8 ? "현 전략 유지 및 분할 매수" : "추가 감축시설 투자 검토"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
