import React from 'react';
import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
    BarChart, Bar, Cell, Legend
} from 'recharts';
import {
    TrendingUp, TrendingDown, Euro, Globe, Database, MoreHorizontal, CheckCircle, ShieldCheck, Sparkles,
    Zap, Rocket, Target, PieChart as PieChartIcon, Activity, DollarSign, BarChart3
} from 'lucide-react';
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
}

// ── Helpers ──
const fmt = (n: number) => n.toLocaleString();
const fmtB = (n: number) => n >= 10 ? `${Math.round(n)}` : n.toFixed(2);
const fmtP = (n: number) => n >= 10000 ? `${(n / 10000).toFixed(1)}만` : fmt(n);

export const SimulatorTab: React.FC<SimulatorTabProps> = ({
    selectedMarket, setSelectedMarket, timeRange, setTimeRange, trendData, handleChartClick,
    priceScenario, setPriceScenario, customPrice, setCustomPrice,
    allocationChange, setAllocationChange, emissionChange, setEmissionChange,
    reductionOptions, toggleReduction, simResult: r,
    auctionEnabled, setAuctionEnabled, auctionTargetPct, setAuctionTargetPct,
    currentETSPrice
}) => {
    // Procurement calculations for the visual bar
    const freeAllocPct = r.adjustedEmissions > 0 ? Math.min(100, (r.adjustedAllocation / r.adjustedEmissions) * 100) : 0;
    const remainPct = 100 - freeAllocPct;
    const auctionPct = auctionEnabled ? Math.min(remainPct, auctionTargetPct) : 0;
    const marketPct = Math.max(0, remainPct - auctionPct);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. Market Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.values(MARKET_DATA).map((market) => {
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
                                    market.change > 0
                                        ? "bg-emerald-50 text-emerald-600"
                                        : "bg-red-50 text-red-600"
                                )}>
                                    {market.change > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                    {Math.abs(market.change)}%
                                </span>
                            </div>
                            <div className="text-3xl font-bold text-slate-900 tracking-tight">
                                {market.id === 'EU-ETS' ? '€' : '₩'}
                                {market.price.toLocaleString()}
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
                        <p className="text-sm text-slate-500">다중 시장 수렴 분석 (Convergence Analysis)</p>
                        <div className="flex gap-2 mt-2">
                            <p className="text-[10px] text-[#10b77f] font-bold bg-[#10b77f]/10 w-fit px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Database size={10} /> Source: EEX & KRX Data
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex gap-3 text-xs font-medium">
                            <div className={cn("flex items-center gap-1.5 transition-opacity", selectedMarket === 'K-ETS' ? "opacity-100 font-bold text-slate-900" : "opacity-60 text-slate-400")}><span className="w-2 h-2 rounded-full bg-[#10b77f]"></span> 한국 (KRW)</div>
                            <div className={cn("flex items-center gap-1.5 transition-opacity", selectedMarket === 'EU-ETS' ? "opacity-100 font-bold text-slate-900" : "opacity-60 text-slate-400")}><span className="w-2 h-2 rounded-full bg-[#a5d8ff]"></span> 유럽 (EUR)</div>
                        </div>
                        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                        <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-medium">
                            {(['1개월', '3개월', '1년', '전체'] as const).map(range => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
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
                            <YAxis yAxisId="left" orientation="left" hide={false} domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#a5d8ff' }} label={{ value: 'EUR', angle: -90, position: 'insideLeft', fill: '#a5d8ff', fontSize: 10 }} />
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

                {/* Main Grid: Settings (Left) + KPI Cards (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Settings (4 col) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* 1. 가격 & 시나리오 */}
                        <Card padding="lg" variant="hoverable">
                            <div className="flex items-center gap-2 mb-5">
                                <Target className="text-slate-400" size={20} />
                                <h4 className="text-base font-bold text-slate-900">시나리오 설정</h4>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-3 block tracking-wide">ETS 가격 시나리오</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {(Object.entries(ETS_PRICE_SCENARIOS) as [PriceScenarioType, typeof ETS_PRICE_SCENARIOS.low][]).map(([key, sc]) => (
                                            <button key={key} onClick={() => setPriceScenario(key)}
                                                className={cn(
                                                    "px-4 py-2.5 rounded-xl text-sm transition-all border",
                                                    priceScenario === key ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                                )}>
                                                <span className="block font-bold">{sc.label.split(' ')[0]}</span>
                                                <span className="block mt-1 text-xs opacity-70 font-mono">₩{fmt(sc.price)}</span>
                                            </button>
                                        ))}
                                        <button onClick={() => setPriceScenario('custom')}
                                            className={cn(
                                                "px-4 py-2.5 rounded-xl text-sm transition-all border font-bold",
                                                priceScenario === 'custom' ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                            )}>
                                            직접 입력
                                        </button>
                                    </div>
                                    {priceScenario === 'custom' && (
                                        <div className="mt-3 flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100 animate-in slide-in-from-top-1">
                                            <span className="text-xs font-mono text-slate-400">₩</span>
                                            <input type="number" value={customPrice} onChange={e => setCustomPrice(Number(e.target.value))}
                                                className="bg-transparent w-full text-sm font-bold text-slate-900 focus:outline-none" />
                                        </div>
                                    )}
                                </div>

                                <div className="pt-3 border-t border-slate-50">
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-3 block tracking-wide">배출량 변동 ({emissionChange >= 0 ? '+' : ''}{emissionChange}%)</label>
                                    <input type="range" min={-30} max={30} step={5} value={emissionChange}
                                        onChange={e => setEmissionChange(Number(e.target.value))}
                                        className="w-full h-1.5 bg-slate-100 rounded-full cursor-pointer accent-emerald-500 appearance-none" />
                                    <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono">
                                        <span>−30%</span><span>0%</span><span>+30%</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* 2. 할당 & 경매 */}
                        <Card padding="lg">
                            <div className="flex items-center gap-2 mb-5">
                                <Zap className="text-slate-400" size={20} />
                                <h4 className="text-base font-bold text-slate-900">할당 및 조달 방식</h4>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-3 block tracking-wide">무상할당 정책 변동</label>
                                    <div className="space-y-3">
                                        {(Object.entries(ALLOCATION_SCENARIOS) as [AllocationChangeType, typeof ALLOCATION_SCENARIOS.maintain][]).map(([key, sc]) => (
                                            <button key={key} onClick={() => setAllocationChange(key)}
                                                className={cn(
                                                    "w-full text-left px-4 py-3 rounded-xl text-sm transition-all border flex justify-between items-center",
                                                    allocationChange === key ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                                )}>
                                                <span className="font-bold">{sc.label}</span>
                                                <span className="opacity-60 font-mono text-xs">
                                                    {key === 'zero' ? '배출권 전액 구매' : `${sc.factor * 90}% 반영`}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-50">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-xs text-slate-500 uppercase font-bold tracking-wide">경매 참여 (할인율 2%)</label>
                                        <button onClick={() => setAuctionEnabled(!auctionEnabled)}
                                            className={cn("relative w-9 h-5 rounded-full transition-colors", auctionEnabled ? "bg-emerald-500" : "bg-slate-200")}>
                                            <span className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform", auctionEnabled ? "translate-x-4.5" : "translate-x-0.5")} />
                                        </button>
                                    </div>
                                    {auctionEnabled && (
                                        <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                                            <div className="flex justify-between items-baseline mb-2">
                                                <span className="text-[10px] text-slate-400">최대 비중 {auctionTargetPct}%</span>
                                            </div>
                                            <input type="range" min={0} max={AUCTION_CONFIG.maxPct} step={5} value={auctionTargetPct}
                                                onChange={e => setAuctionTargetPct(Number(e.target.value))}
                                                className="w-full h-1 bg-slate-100 rounded-full cursor-pointer accent-emerald-500 appearance-none" />
                                        </div>
                                    )}

                                    <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-dotted border-slate-200">
                                        <div className="flex rounded-full overflow-hidden h-2.5">
                                            <div style={{ width: `${freeAllocPct}%` }} className="bg-emerald-200" />
                                            <div style={{ width: `${auctionPct}%` }} className="bg-emerald-500" />
                                            <div style={{ width: `${marketPct}%` }} className="bg-slate-400" />
                                        </div>
                                        <div className="grid grid-cols-3 gap-1 text-[10px] font-bold mt-2 text-center">
                                            <div className="text-emerald-300">무상 {freeAllocPct.toFixed(0)}%</div>
                                            <div className="text-emerald-600">경매 {auctionPct.toFixed(0)}%</div>
                                            <div className="text-slate-400">시장 {marketPct.toFixed(0)}%</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right: KPI Cards (8 col) */}
                    <div className="lg:col-span-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* ① 순노출량 */}
                            <Card className="md:col-span-2 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Activity size={80} />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">순노출량 (Net Exposure)</p>
                                    <p className="text-3xl font-black text-slate-900 tracking-tight">
                                        {fmt(r.netExposure)} <span className="text-sm font-bold text-slate-400 ml-1">tCO₂e</span>
                                    </p>
                                    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-400 font-medium">
                                        <span>예상 배출</span><span className="text-right text-slate-600 font-bold">{fmt(r.adjustedEmissions)}</span>
                                        <span>− 올해 감축</span><span className="text-right text-emerald-600 font-bold">{fmt(r.thisYearReduction)}</span>
                                    </div>
                                </div>
                            </Card>

                            {/* ② 컴플라이언스 비용 */}
                            <Card className="relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <DollarSign size={60} />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">컴플라이언스 비용</p>
                                    <p className="text-3xl font-black text-slate-900 tracking-tight">{fmtB(r.complianceCostBase)}<span className="text-sm font-bold text-slate-400 ml-1">억원</span></p>
                                    <div className="mt-4 space-y-1 text-xs text-slate-400 font-medium">
                                        <div className="flex justify-between"><span>Low (₩1.0만)</span><span className="text-slate-600 font-bold">{fmtB(r.complianceCostLow)}억</span></div>
                                        <div className="flex justify-between"><span>High (₩2.5만)</span><span className="text-slate-600 font-bold">{fmtB(r.complianceCostHigh)}억</span></div>
                                    </div>
                                </div>
                            </Card>

                            {/* ③ 총 탄소비용 */}
                            <Card className="relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <TrendingUp size={60} />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">총 탄소비용</p>
                                    <p className="text-3xl font-black text-emerald-600 tracking-tight">{fmtB(r.totalCarbonCost)}<span className="text-sm font-bold text-slate-400 ml-1">억원</span></p>
                                    <div className="mt-4 flex gap-4 text-xs text-slate-400 font-medium">
                                        <div className="flex flex-col"><span>구매</span><span className="text-slate-600 font-bold text-base">{fmtB(r.totalCarbonCost - r.totalAbatementCost)}억</span></div>
                                        <div className="flex flex-col pl-4 border-l border-slate-100"><span>직접감축</span><span className="text-emerald-600 font-bold text-base">{fmtB(r.totalAbatementCost)}억</span></div>
                                    </div>
                                </div>
                            </Card>

                            {/* ④ 파생 지표들 */}
                            <Card className="md:col-span-2 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <BarChart3 size={60} />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">파생 지표</p>
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-500 font-medium mb-1">실효 탄소가격</span>
                                            <span className="text-2xl font-black text-slate-900">₩{fmtP(Math.round(r.effectiveCarbonPrice))}<span className="text-sm font-bold text-slate-400">/t</span></span>
                                        </div>
                                        <div className="flex flex-col border-l border-slate-100 pl-6">
                                            <span className="text-xs text-slate-500 font-medium mb-1">영업이익 대비</span>
                                            <span className={cn("text-2xl font-black", r.profitImpact > 3 ? "text-amber-500" : "text-emerald-500")}>
                                                {r.profitImpact.toFixed(2)}<span className="text-sm font-bold">%</span>
                                            </span>
                                        </div>
                                        <div className="flex flex-col border-l border-slate-100 pl-6">
                                            <span className="text-xs text-slate-500 font-medium mb-1">경제적 감축 여력</span>
                                            <span className="text-2xl font-black text-blue-500">{fmt(r.economicAbatementPotential)}<span className="text-sm font-bold text-slate-400">t</span></span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Bottom: Tables & Strategies - Full Width */}
                <div className="space-y-6">
                    {/* 1. Reduction Options Table */}
                    <Card className="overflow-hidden bg-white">
                        <div className="p-5 border-b border-slate-50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Rocket className="text-emerald-500" size={18} />
                                <h4 className="text-sm font-bold text-slate-900">감축 기술별 경제성 분석 (MAC)</h4>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold border-b border-slate-50">
                                        <th className="py-4 pl-6 text-left w-12 text-slate-200">선택</th>
                                        <th className="py-4 text-left">감축 옵션 기술명</th>
                                        <th className="py-4 text-right">감축량(t)</th>
                                        <th className="py-4 text-right">MAC(원/t)</th>
                                        <th className="py-4 text-right">투자비(억)</th>
                                        <th className="py-4 text-center">적용시기</th>
                                        <th className="py-4 pr-6 text-right">판정</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {reductionOptions.map(opt => {
                                        const isEcon = opt.mac < currentETSPrice;
                                        return (
                                            <tr key={opt.id} className={cn("group transition-colors", opt.enabled ? "bg-emerald-50/30" : "hover:bg-slate-50")}>
                                                <td className="py-4 pl-6">
                                                    <button onClick={() => toggleReduction(opt.id)}
                                                        className={cn(
                                                            "w-5 h-5 rounded border-2 flex items-center justify-center text-[10px] transition-all",
                                                            opt.enabled ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-200 text-transparent group-hover:border-slate-300"
                                                        )}>
                                                        ✓
                                                    </button>
                                                </td>
                                                <td className="py-4">
                                                    <span className={cn("font-medium", opt.enabled ? "text-slate-900" : "text-slate-600")}>{opt.name}</span>
                                                </td>
                                                <td className="py-4 text-right font-mono text-xs text-slate-500">{fmt(opt.annualReduction)}</td>
                                                <td className="py-4 text-right font-mono text-xs">
                                                    <span className={isEcon ? "text-emerald-600 font-bold" : "text-slate-400"}>₩{fmtP(opt.mac)}</span>
                                                </td>
                                                <td className="py-4 text-right font-mono text-xs text-slate-400">{fmtB(opt.cost)}억</td>
                                                <td className="py-4 text-center">
                                                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", opt.thisYearApplicable ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400")}>
                                                        {opt.thisYearApplicable ? "올해 즉시" : "내년부터"}
                                                    </span>
                                                </td>
                                                <td className="py-4 pr-6 text-right">
                                                    <div className={cn(
                                                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                                                        isEcon ? "text-emerald-600 bg-emerald-50" : "text-slate-400 bg-slate-50"
                                                    )}>
                                                        <div className={cn("w-1 h-1 rounded-full", isEcon ? "bg-emerald-600 animate-pulse" : "bg-slate-300")} />
                                                        {isEcon ? "경제적" : "고비용"}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* 2. Strategy Comparison */}
                    <Card padding="lg">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <PieChartIcon className="text-emerald-500" size={18} />
                                <h4 className="text-sm font-bold text-slate-900">시뮬레이션 전략 패키지 비교</h4>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">단위: 억원</span>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-center">
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={r.strategies.map(s => ({
                                        name: s.label,
                                        구매비용: Number(s.complianceCost.toFixed(2)),
                                        직접감축: Number(s.abatementCost.toFixed(2)),
                                    }))} layout="vertical" margin={{ left: -10, right: 30, top: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                        <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis type="category" dataKey="name" tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }} width={100} axisLine={false} tickLine={false} />
                                        <Tooltip formatter={(value: number) => `${value.toFixed(2)}억원`} cursor={{ fill: '#f8fafc' }} />
                                        <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 10, paddingBottom: 10 }} />
                                        <Bar dataKey="구매비용" stackId="total" fill="#e2e8f0" radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="직접감축" stackId="total" fill="#10b77f" radius={[0, 6, 6, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="space-y-4">
                                {r.strategies.map((s, i) => {
                                    const isOptimal = i === r.optimalStrategyIndex;
                                    return (
                                        <div key={s.name}
                                            className={cn(
                                                "group relative rounded-2xl p-4 border transition-all duration-300",
                                                isOptimal ? "border-emerald-500 bg-emerald-50/50 shadow-sm shadow-emerald-100" : "border-slate-100 bg-white hover:border-slate-200"
                                            )}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                                        isOptimal ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
                                                    )}>{s.name}</span>
                                                    <span className="text-sm font-bold text-slate-700">{s.label}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-slate-900 leading-none">{fmtB(s.totalCost)}<span className="text-[10px] font-normal text-slate-400 ml-0.5">억</span></p>
                                                </div>
                                            </div>

                                            {isOptimal && (
                                                <div className="mt-3 pt-3 border-t border-emerald-100 animate-in fade-in duration-500">
                                                    <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                                                        <Sparkles size={12} className="inline mr-1 mb-0.5" />
                                                        {s.explanation}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="mt-2 flex gap-3 overflow-hidden">
                                                <span className="text-[9px] text-slate-400 uppercase tracking-tighter shrink-0">적용됨:</span>
                                                <div className="flex gap-1 flex-wrap">
                                                    {s.appliedReductions.length > 0 ? (
                                                        s.appliedReductions.map(red => (
                                                            <span key={red} className="text-[9px] bg-white border border-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-500">{red}</span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[9px] text-slate-300 italic">감축 옵션 없음</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
