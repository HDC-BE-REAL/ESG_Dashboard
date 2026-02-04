import React from 'react';
import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
    TrendingUp, TrendingDown, Euro, Globe, Database, MoreHorizontal, CheckCircle, ShieldCheck, Sparkles
} from 'lucide-react';
import { Card } from '../ui/Card';
import { CustomTooltip } from '../ui/CustomTooltip';
import { cn, formatBillions } from '../ui/utils';
import type { MarketType, TimeRangeType, Tranche, TrendData } from '../../types';
import { MARKET_DATA } from '../../data/mockData';

interface SimulatorTabProps {
    selectedMarket: MarketType;
    setSelectedMarket: (market: MarketType) => void;
    timeRange: TimeRangeType;
    setTimeRange: (range: TimeRangeType) => void;
    trendData: TrendData[];
    handleChartClick: (data: any) => void;
    activeTranches: Tranche[];
    totalExposure: number;
    simBudget: number;
    setSimBudget: (budget: number) => void;
    simRisk: number;
    setSimRisk: (risk: number) => void;
    budgetInWon: number;
    estimatedSavings: number;
    generateAIPlan: () => void;
}

export const SimulatorTab: React.FC<SimulatorTabProps> = ({
    selectedMarket,
    setSelectedMarket,
    timeRange,
    setTimeRange,
    trendData,
    handleChartClick,
    activeTranches,
    totalExposure,
    simBudget,
    setSimBudget,
    simRisk,
    setSimRisk,
    budgetInWon,
    estimatedSavings,
    generateAIPlan
}) => {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
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
            </div>

            <Card padding="lg" className="relative overflow-hidden bg-white border border-slate-100">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">글로벌 가격 동향 (Global Price Trend)</h3>
                        <p className="text-sm text-slate-500">다중 시장 수렴 분석 (Convergence Analysis)</p>
                        <div className="flex gap-2 mt-2">
                            <p className="text-[10px] text-[#10b77f] font-bold bg-[#10b77f]/10 w-fit px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Database size={10} /> Source: EEX & KRX Data
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex gap-3 text-xs font-medium">
                            <div className={cn("flex items-center gap-1.5 transition-opacity", selectedMarket === 'K-ETS' ? "opacity-100 font-bold text-slate-900" : "opacity-40 text-slate-400")}><span className="w-2 h-2 rounded-full bg-[#10b77f]"></span> K-ETS</div>
                            <div className={cn("flex items-center gap-1.5 transition-opacity", selectedMarket === 'EU-ETS' ? "opacity-100 font-bold text-slate-900" : "opacity-40 text-slate-400")}><span className="w-2 h-2 rounded-full bg-[#a5d8ff]"></span> EU-ETS</div>
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
                <div className="h-72 w-full">
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

                            {/* Left Axis: EU-ETS (EUR) */}
                            <YAxis yAxisId="left" orientation="left" hide={false} domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#a5d8ff' }} label={{ value: 'EUR', angle: -90, position: 'insideLeft', fill: '#a5d8ff', fontSize: 10 }} />

                            {/* Right Axis: K-ETS (KRW) */}
                            <YAxis yAxisId="right" orientation="right" hide={false} domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#10b77f' }} label={{ value: 'KRW', angle: 90, position: 'insideRight', fill: '#10b77f', fontSize: 10 }} />

                            <Tooltip content={<CustomTooltip />} />
                            {(timeRange !== '1개월') && (
                                <ReferenceLine yAxisId="left" x="2026-01-01" stroke="#94a3b8" strokeDasharray="5 5" label={{ value: '현재', fill: '#94a3b8', fontSize: 10 }} />
                            )}

                            {/* EU-ETS Line on Left Axis */}
                            <Line
                                isAnimationActive={false}
                                yAxisId="left"
                                type="monotone"
                                dataKey="EU-ETS"
                                stroke={MARKET_DATA['EU-ETS'].color}
                                strokeWidth={selectedMarket === 'EU-ETS' ? 3 : 1}
                                strokeOpacity={selectedMarket === 'EU-ETS' ? 1 : 0.4}
                                dot={false}
                            />

                            {/* K-ETS Line on Right Axis */}
                            <Line
                                isAnimationActive={false}
                                yAxisId="right"
                                type="monotone"
                                dataKey="K-ETS"
                                stroke={MARKET_DATA['K-ETS'].color}
                                strokeWidth={selectedMarket === 'K-ETS' ? 3 : 1}
                                strokeOpacity={selectedMarket === 'K-ETS' ? 1 : 0.4}
                                dot={false}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <div className="flex flex-col lg:flex-row gap-6 pb-8">
                {/* Left: Smart Tranche Planner Table */}
                <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">스마트 분할 매수 플래너</h3>
                            <p className="text-sm text-slate-500">변동성 기반 매수 전략 제안</p>
                        </div>
                        <button
                            onClick={generateAIPlan}
                            className="bg-[#10b77f] hover:bg-[#0e9f6e] text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm shadow-[#10b77f]/20"
                        >
                            <Sparkles size={16} /> AI 전략 생성
                        </button>
                    </div>
                    <div className="overflow-x-auto p-2">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">전략 날짜</th>
                                    <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">물량 (tCO2)</th>
                                    <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">목표가</th>
                                    <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">시장</th>
                                    <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">상태</th>
                                    <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">실행</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {activeTranches.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-3 text-sm font-medium text-slate-900">{t.month}</td>
                                        <td className="p-3 text-sm text-slate-900 font-mono">{(totalExposure * (t.percentage / 100)).toLocaleString()}</td>
                                        <td className="p-3 text-sm text-slate-900 font-semibold">{t.market === 'EU-ETS' ? '€' : '₩'}{t.price.toLocaleString()}</td>
                                        <td className="p-3 text-sm text-slate-500">{t.market}</td>
                                        <td className="p-3">
                                            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", t.isFuture ? "bg-amber-50 text-amber-700" : "bg-[#10b77f]/10 text-[#10b77f]")}>
                                                <span className={cn("w-1.5 h-1.5 rounded-full", t.isFuture ? "bg-amber-500" : "bg-[#10b77f]")}></span>
                                                {t.isFuture ? '대기' : '완료'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-slate-400 hover:text-[#10b77f] cursor-pointer">
                                            <MoreHorizontal size={18} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: Financial Diagnosis */}
                <div className="w-full lg:w-[32%] bg-[#102219] rounded-xl shadow-lg p-6 flex flex-col justify-between text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b77f]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <ShieldCheck className="text-[#10b77f]" size={24} />
                            <h3 className="text-lg font-bold">재무 건전성 진단</h3>
                        </div>
                        <div className="flex flex-col gap-6 mb-8">
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between text-sm">
                                    <label className="text-slate-300">예산 배정 (Budget)</label>
                                    <span className="font-mono text-[#10b77f]">{simBudget}%</span>
                                </div>
                                <input
                                    type="range" min="0" max="100" value={simBudget} onChange={(e) => setSimBudget(parseInt(e.target.value))}
                                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#10b77f]"
                                />
                                <div className="flex justify-between text-[10px] text-slate-500">
                                    <span>보수적</span><span>공격적</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between text-sm">
                                    <label className="text-slate-300">리스크 허용범위 (Risk)</label>
                                    <span className="font-mono text-[#10b77f]">{simRisk < 30 ? '낮음' : simRisk < 70 ? '중간' : '높음'}</span>
                                </div>
                                <input
                                    type="range" min="0" max="100" value={simRisk} onChange={(e) => setSimRisk(parseInt(e.target.value))}
                                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#10b77f]"
                                />
                                <div className="flex justify-between text-[10px] text-slate-500">
                                    <span>저변동성</span><span>고수익</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-400 mb-1">총 예산</p>
                                <p className="text-xl font-bold">{formatBillions(budgetInWon)}</p>
                            </div>
                            <div className="border-l border-white/10 pl-4">
                                <p className="text-xs text-slate-400 mb-1">예상 절감액</p>
                                <div className="flex items-end gap-1">
                                    <p className="text-xl font-bold text-[#10b77f]">{formatBillions(estimatedSavings)}</p>
                                    <p className="text-[10px] text-slate-400 mb-1">({((estimatedSavings / budgetInWon) * 100).toFixed(1)}%)</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/10">
                            <p className="text-xs text-slate-300 flex items-center gap-1">
                                <CheckCircle className="text-[#10b77f]" size={14} />
                                전략이 안전 마진 내에 있습니다.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
