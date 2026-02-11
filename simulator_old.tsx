import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import type {
    PriceScenarioType, AllocationChangeType, ReductionOption, SimResult
} from '../../types';
import { ETS_PRICE_SCENARIOS, ALLOCATION_SCENARIOS, AUCTION_CONFIG } from '../../data/mockData';

// ── Props ──
interface SimulatorTabProps {
    s1: number;
    s2: number;
    freeAllocation: number;
    currentETSPrice: number;
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
}

// ── Helpers ──
const fmt = (n: number) => n.toLocaleString();
const fmtB = (n: number) => n >= 10 ? `${Math.round(n)}` : n.toFixed(2);
const fmtP = (n: number) => n >= 10000 ? `${(n / 10000).toFixed(1)}만` : fmt(n);

// ── Component ──
export const SimulatorTab: React.FC<SimulatorTabProps> = ({
    s1, s2, freeAllocation, currentETSPrice,
    priceScenario, setPriceScenario, customPrice, setCustomPrice,
    allocationChange, setAllocationChange, emissionChange, setEmissionChange,
    reductionOptions, toggleReduction, simResult: r,
    auctionEnabled, setAuctionEnabled, auctionTargetPct, setAuctionTargetPct,
}) => {
    const totalEmissions = s1 + s2;

    // Procurement
    const freeAllocPct = r.adjustedEmissions > 0 ? Math.min(100, (r.adjustedAllocation / r.adjustedEmissions) * 100) : 0;
    const remainPct = 100 - freeAllocPct;
    const auctionPct = auctionEnabled ? Math.min(remainPct, auctionTargetPct) : 0;
    const marketPct = Math.max(0, remainPct - auctionPct);
    const auctionPrice = currentETSPrice * AUCTION_CONFIG.discountRate;
    const effectivePrice = (freeAllocPct / 100) * 0 + (auctionPct / 100) * auctionPrice + (marketPct / 100) * currentETSPrice;

    return (
        <div className="space-y-8">
<<<<<<< Updated upstream
            {/* Grid */}
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
=======

            {/* ── KPI Cards (3×2 + 1) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* ① 순노출량 — span 2 */}
                <div className="lg:col-span-2 flex flex-col p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 mb-1">순노출량</p>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">
                        {fmt(r.netExposure)} <span className="text-sm font-normal text-slate-400 ml-1">tCO₂e</span>
                    </p>

                    {/* breakdown — quiet mono grid */}
                    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-400 font-mono">
                        <span>예상 배출</span><span className="text-right text-slate-600">{fmt(r.adjustedEmissions)}</span>
                        <span>− 무상할당</span><span className="text-right text-slate-600">{fmt(r.adjustedAllocation)}</span>
                        <span>− 올해 감축</span><span className="text-right text-slate-600">{fmt(r.thisYearReduction)}</span>
                        {r.nextYearReduction > 0 && (
                            <>
                                <span className="text-amber-500">− 차년도 (미반영)</span>
                                <span className="text-right text-amber-500">{fmt(r.nextYearReduction)}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* ② 컴플라이언스 비용 */}
                <div className="flex flex-col p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 mb-1">컴플라이언스 비용</p>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{fmtB(r.complianceCostBase)}<span className="text-sm font-normal text-slate-400 ml-1">억원</span></p>
                    <div className="mt-auto pt-4 space-y-1 text-xs text-slate-400">
                        <div className="flex justify-between"><span>Low ₩{fmt(ETS_PRICE_SCENARIOS.low.price)}</span><span className="text-slate-500">{fmtB(r.complianceCostLow)}억</span></div>
                        <div className="flex justify-between"><span>High ₩{fmt(ETS_PRICE_SCENARIOS.high.price)}</span><span className="text-slate-500">{fmtB(r.complianceCostHigh)}억</span></div>
                    </div>
                </div>

                {/* ③ 감축 비용 */}
                <div className="flex flex-col p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 mb-1">감축 비용</p>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{fmtB(r.totalAbatementCost)}<span className="text-sm font-normal text-slate-400 ml-1">억원</span></p>
                    <p className="text-xs text-slate-400 mt-auto pt-4">올해 감축 {fmt(r.thisYearReduction)}t</p>
                </div>

                {/* ④ 총 탄소비용 */}
                <div className="flex flex-col p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 mb-1">총 탄소비용</p>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{fmtB(r.totalCarbonCost)}<span className="text-sm font-normal text-slate-400 ml-1">억원</span></p>
                    <div className="mt-auto pt-4 flex gap-3 text-xs text-slate-400">
                        <span>구매 {fmtB(r.totalCarbonCost - r.totalAbatementCost)}</span>
                        <span>감축 {fmtB(r.totalAbatementCost)}</span>
                    </div>
                </div>

                {/* ⑤ 실효 탄소가격 */}
                <div className="flex flex-col p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 mb-1">실효 탄소가격</p>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">₩{fmtP(Math.round(effectivePrice))}<span className="text-sm font-normal text-slate-400 ml-1">/t</span></p>
                    <p className="text-xs text-slate-400 mt-auto pt-4">시장가 ₩{fmtP(currentETSPrice)}</p>
                </div>

                {/* ⑥ 영업이익 대비 */}
                <div className="flex flex-col p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 mb-1">영업이익 대비</p>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{r.profitImpact.toFixed(2)}<span className="text-sm font-normal text-slate-400 ml-1">%</span></p>
                    <p className="text-xs text-slate-400 mt-auto pt-4">영업이익 {fmtB(r.operatingProfit)}억 (추정)</p>
                </div>

                {/* ⑦ 경제적 감축 여력 */}
                <div className="flex flex-col p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 mb-1">경제적 감축 여력</p>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{fmt(r.economicAbatementPotential)}<span className="text-sm font-normal text-slate-400 ml-1">tCO₂e</span></p>
                    <p className="text-xs text-slate-400 mt-auto pt-4">MAC &lt; ₩{fmtP(currentETSPrice)}</p>
                </div>
>>>>>>> Stashed changes
            </div>

            {/* ── Settings Panel ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left: Inputs (4 col) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* ETS 가격 */}
                    <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <p className="text-sm font-medium text-slate-500 mb-4">ETS 가격</p>
                        <div className="grid grid-cols-2 gap-2">
                            {(Object.entries(ETS_PRICE_SCENARIOS) as [PriceScenarioType, typeof ETS_PRICE_SCENARIOS.low][]).map(([key, sc]) => (
                                <button key={key} onClick={() => setPriceScenario(key)}
                                    className={`px-3 py-2.5 rounded-xl text-xs transition-all border ${priceScenario === key
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                                    <span className="block font-medium">{sc.label.split(' ')[0]}</span>
                                    <span className="block mt-0.5 text-[11px] opacity-70">₩{fmt(sc.price)}</span>
                                </button>
                            ))}
                            <button onClick={() => setPriceScenario('custom')}
                                className={`px-3 py-2.5 rounded-xl text-xs transition-all border ${priceScenario === 'custom'
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                                <span className="block font-medium">직접</span>
                                <span className="block mt-0.5 text-[11px] opacity-70">입력</span>
                            </button>
                        </div>
                        {priceScenario === 'custom' && (
                            <div className="flex items-center gap-2 mt-3">
                                <span className="text-xs text-slate-400">₩</span>
                                <input type="number" value={customPrice} onChange={e => setCustomPrice(Number(e.target.value))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none" />
                            </div>
                        )}
                    </div>

                    {/* 할당량 변화 */}
                    <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <p className="text-sm font-medium text-slate-500 mb-4">무상할당 변화</p>
                        <div className="space-y-2">
                            {(Object.entries(ALLOCATION_SCENARIOS) as [AllocationChangeType, typeof ALLOCATION_SCENARIOS.maintain][]).map(([key, sc]) => (
                                <button key={key} onClick={() => setAllocationChange(key)}
                                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all border ${allocationChange === key
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                                    {sc.label}
                                    {key !== 'maintain' && <span className="text-xs opacity-60 ml-2">{fmt(Math.round(freeAllocation * sc.factor))}t</span>}
                                </button>
                            ))}
                        </div>
                    </div>
<<<<<<< Updated upstream
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
=======
>>>>>>> Stashed changes

                    {/* 배출량 변화 */}
                    <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-baseline mb-4">
                            <p className="text-sm font-medium text-slate-500">배출량 변화</p>
                            <p className="text-lg font-bold text-slate-900">{emissionChange >= 0 ? '+' : ''}{emissionChange}%</p>
                        </div>
                        <input type="range" min={-30} max={30} step={5} value={emissionChange}
                            onChange={e => setEmissionChange(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-full cursor-pointer accent-slate-700 appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-slate-900 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer" />
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                            <span>−30%</span><span>0%</span><span>+30%</span>
                        </div>
                    </div>

                    {/* 경매 설정 */}
                    <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-sm font-medium text-slate-500">경매 참여</p>
                            <button onClick={() => setAuctionEnabled(!auctionEnabled)}
                                className={`relative w-10 h-5 rounded-full transition-colors ${auctionEnabled ? 'bg-slate-900' : 'bg-slate-200'}`}>
                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${auctionEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                        {auctionEnabled && (
                            <>
                                <div className="flex justify-between items-baseline mb-2">
                                    <span className="text-xs text-slate-400">경매 비중</span>
                                    <span className="text-sm font-bold text-slate-900">{auctionTargetPct}%</span>
                                </div>
                                <input type="range" min={0} max={AUCTION_CONFIG.maxPct} step={5} value={auctionTargetPct}
                                    onChange={e => setAuctionTargetPct(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 rounded-full cursor-pointer accent-slate-700 appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-slate-900 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer" />
                            </>
                        )}
                        {/* Procurement bar */}
                        <div className="mt-4">
                            <div className="flex rounded-lg overflow-hidden h-2">
                                {freeAllocPct > 0 && <div style={{ width: `${freeAllocPct}%` }} className="bg-slate-300" />}
                                {auctionPct > 0 && <div style={{ width: `${auctionPct}%` }} className="bg-slate-500" />}
                                {marketPct > 0 && <div style={{ width: `${marketPct}%` }} className="bg-slate-700" />}
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                                <span>무상 {freeAllocPct.toFixed(0)}%</span>
                                <span>경매 {auctionPct.toFixed(0)}%</span>
                                <span>시장 {marketPct.toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Reduction Table + Strategy (8 col) */}
                <div className="lg:col-span-8 flex flex-col gap-6">

                    {/* 감축 옵션 */}
                    <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-baseline mb-5">
                            <p className="text-sm font-medium text-slate-500">감축 옵션</p>
                            <p className="text-xs text-slate-400">ETS ₩{fmtP(currentETSPrice)}/t 기준</p>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-slate-400 border-b border-slate-100">
                                    <th className="text-left py-2 pl-1 w-8"></th>
                                    <th className="text-left py-2">옵션</th>
                                    <th className="text-right py-2">감축량</th>
                                    <th className="text-right py-2">MAC</th>
                                    <th className="text-right py-2">비용</th>
                                    <th className="text-center py-2">반영</th>
                                    <th className="text-right py-2 pr-1">판정</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reductionOptions.map(opt => {
                                    const isEcon = opt.mac < currentETSPrice;
                                    return (
                                        <tr key={opt.id} className="border-b border-slate-50 group">
                                            <td className="py-3 pl-1">
                                                <button onClick={() => toggleReduction(opt.id)}
                                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center text-[10px] transition-all ${opt.enabled
                                                        ? 'bg-slate-900 border-slate-900 text-white'
                                                        : 'border-slate-300 text-transparent group-hover:border-slate-400'}`}>
                                                    ✓
                                                </button>
                                            </td>
                                            <td className="py-3 text-slate-700">{opt.name}</td>
                                            <td className="py-3 text-right text-slate-600 font-mono text-xs">{fmt(opt.annualReduction)}</td>
                                            <td className="py-3 text-right font-mono text-xs">
                                                <span className={isEcon ? 'text-slate-600' : 'text-slate-400'}>₩{fmtP(opt.mac)}</span>
                                            </td>
                                            <td className="py-3 text-right text-slate-500 font-mono text-xs">{fmtB(opt.cost)}억</td>
                                            <td className="py-3 text-center">
                                                <span className={`text-[10px] font-medium ${opt.thisYearApplicable ? 'text-slate-600' : 'text-slate-400'}`}>
                                                    {opt.thisYearApplicable ? '올해' : '차년'}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right pr-1">
                                                <span className={`text-[10px] font-medium ${isEcon ? 'text-[#10b77f]' : 'text-slate-400'}`}>
                                                    {isEcon ? '경제적' : '초과'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* 전략 비교 */}
                    <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <p className="text-sm font-medium text-slate-500 mb-5">전략 비교</p>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Chart */}
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={r.strategies.map(s => ({
                                        name: `${s.name}. ${s.label}`,
                                        구매: Number(s.complianceCost.toFixed(2)),
                                        감축: Number(s.abatementCost.toFixed(2)),
                                    }))} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                        <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="억" axisLine={false} tickLine={false} />
                                        <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} width={100} axisLine={false} tickLine={false} />
                                        <Tooltip formatter={(value: number) => `${value.toFixed(2)}억원`} contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: 'none' }} />
                                        <Bar dataKey="구매" stackId="a" fill="#cbd5e1" radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="감축" stackId="a" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Strategy cards */}
                            <div className="space-y-3">
                                {r.strategies.map((s, i) => {
                                    const isOptimal = i === r.optimalStrategyIndex;
                                    return (
                                        <div key={s.name}
                                            className={`rounded-xl p-4 border transition-all ${isOptimal
                                                ? 'border-[#10b77f] bg-[#f0fdf4]'
                                                : 'border-slate-100 bg-white'}`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    {isOptimal && <span className="text-[10px] bg-[#10b77f] text-white px-1.5 py-0.5 rounded font-bold">추천</span>}
                                                    <span className="text-sm font-semibold text-slate-700">{s.name}. {s.label}</span>
                                                </div>
                                                <span className="text-lg font-bold text-slate-900">{fmtB(s.totalCost)}<span className="text-xs font-normal text-slate-400 ml-0.5">억</span></span>
                                            </div>
                                            <div className="flex gap-4 text-[11px] text-slate-400">
                                                <span>구매 {fmt(s.purchaseVolume)}t</span>
                                                {s.appliedReductions.length > 0 && <span>감축 {s.appliedReductions.join(', ')}</span>}
                                            </div>
                                            {isOptimal && (
                                                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{s.explanation}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
