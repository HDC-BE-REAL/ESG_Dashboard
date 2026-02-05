import { History, MousePointer2, Trash2, Calculator, Zap, FileText } from 'lucide-react';
import {
    ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';
import { cn } from '../../lib/utils';
import { Card, Badge, Button } from '../ui';

type MarketType = 'K_ETS' | 'EU_ETS' | 'UK_ETS' | 'NZ_ETS';

interface MarketInfo {
    id: MarketType;
    name: string;
    ticker: string;
    price: number;
    change: number;
    color: string;
    volatility: string;
}

interface Tranche {
    id: number;
    market: MarketType;
    price: number;
    month: string;
    isFuture: boolean;
    percentage: number;
}

interface TrendData {
    date: string;
    euPrice: number;
    krPrice: number;
    [key: string]: string | number;
}

interface MarketStats {
    tranches: Tranche[];
    totalPct: number;
    vwap: number;
}

interface SimulatorTabProps {
    planningMarket: MarketType;
    setPlanningMarket: (market: MarketType) => void;
    marketData: Record<MarketType, MarketInfo>;
    trendData: TrendData[];
    tranches: Tranche[];
    marketStats: Record<MarketType, MarketStats>;
    selectedMarketStats: MarketStats;
    globalVWAP: number;
    totalSimCost: number;
    budgetInWon: number;
    simBudget: number;
    setSimBudget: (budget: number) => void;
    handleChartClick: (data: any) => void;
    updateTranchePercentage: (id: number, val: string, market: MarketType) => void;
    removeTranche: (id: number) => void;
    isLoading: boolean;
}

export function SimulatorTab({
    planningMarket,
    setPlanningMarket,
    marketData,
    trendData,
    tranches,
    marketStats,
    selectedMarketStats,
    globalVWAP,
    totalSimCost,
    budgetInWon,
    simBudget,
    setSimBudget,
    handleChartClick,
    updateTranchePercentage,
    removeTranche,
    isLoading
}: SimulatorTabProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="space-y-10 animate-fade-in">
                {/* Market Selection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {Object.values(marketData).map((market) => (
                        <Card
                            key={market.id}
                            variant={planningMarket === market.id ? 'active' : 'hoverable'}
                            onClick={() => setPlanningMarket(market.id as MarketType)}
                            className="relative overflow-hidden group border-none"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <Badge variant={market.id === 'EU_ETS' ? 'blue' : market.id === 'UK_ETS' ? 'purple' : market.id === 'K_ETS' ? 'success' : 'amber'}>
                                    {market.ticker}
                                </Badge>
                                <div className={cn("text-xs font-black px-2 py-1 rounded-lg bg-slate-50", market.change > 0 ? "text-rose-500" : "text-emerald-500")}>
                                    {market.change > 0 ? '▲' : '▼'} {Math.abs(market.change)}%
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1">{market.name}</p>
                            <p className="text-2xl font-black text-slate-800 tracking-tight">
                                <span className="text-sm font-bold text-slate-400 mr-1">₩</span>
                                {market.price.toLocaleString()}
                            </p>

                            {/* Decorative background circle */}
                            <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-700" style={{ backgroundColor: market.color }} />
                        </Card>
                    ))}
                </div>

                {/* Global Price Trend Chart */}
                <Card padding="xl" variant="glass" className="border-none shadow-2xl shadow-blue-500/5">
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="grad-blue p-2 rounded-xl text-white shadow-lg"><History size={20} /></div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Market Analytics Hub</h3>
                            </div>
                            <p className="text-sm text-slate-500 font-medium">실시간 탄소배출권 데이터 기반 시뮬레이션. 차트의 특정 시점을 클릭하여 매입 계획을 수립하세요.</p>
                        </div>
                        <div className="flex bg-slate-100/50 p-1.5 rounded-2xl gap-2 border border-white/50">
                            {Object.values(marketData).map((m) => (
                                <div
                                    key={m.id}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300",
                                        planningMarket === m.id ? "bg-white shadow-md scale-105" : "opacity-40"
                                    )}
                                >
                                    <div className="w-2.5 h-2.5 rounded-full shadow-inner" style={{ backgroundColor: m.color }} />
                                    <span className="text-[10px] font-black text-slate-800">{m.ticker}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={trendData} onClick={handleChartClick} className="cursor-crosshair">
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <YAxis yAxisId="left" hide domain={['auto', 'auto']} />
                                <YAxis yAxisId="right" orientation="right" hide domain={['auto', 'auto']} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                                <ReferenceLine yAxisId="left" x="26.01" stroke="#94a3b8" strokeDasharray="5 5" label={{ value: 'NOW', fill: '#94a3b8', fontSize: 10 }} />
                                <Line yAxisId="left" type="monotone" dataKey="euPrice" name="EU_ETS" stroke={marketData['EU_ETS'].color} strokeWidth={planningMarket === 'EU_ETS' ? 4 : 2} strokeOpacity={planningMarket === 'EU_ETS' ? 1 : 0.4} dot={false} />
                                <Line yAxisId="right" type="monotone" dataKey="krPrice" name="K_ETS" stroke={marketData['K_ETS'].color} strokeWidth={planningMarket === 'K_ETS' ? 4 : 2} strokeOpacity={planningMarket === 'K_ETS' ? 1 : 0.4} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Smart Purchase Planner */}
                    <Card padding="lg" variant="glass" className="lg:col-span-7 border-none shadow-2xl shadow-blue-500/5 min-h-[550px] flex flex-col relative overflow-hidden backdrop-blur-2xl">
                        <div className="flex justify-between items-center mb-10 relative z-10">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">{marketData[planningMarket].name} Smart Planner</h3>
                                <p className="text-[10px] font-black text-blue-600 tracking-widest mt-1 opacity-80 uppercase">Portfolio Allocation</p>
                            </div>
                            <div className="flex gap-3">
                                {(Object.keys(marketData) as MarketType[]).map(market => (
                                    <div key={market} className={cn("text-right px-3 py-2 rounded-2xl transition-all duration-300", planningMarket === market ? 'bg-white shadow-md' : 'opacity-30')}>
                                        <span className="text-[9px] font-black text-slate-400 block tracking-tighter uppercase">{marketData[market].ticker}</span>
                                        <span className={cn("text-xs font-black", marketStats[market].totalPct === 100 ? 'text-emerald-500' : marketStats[market].totalPct > 0 ? 'text-blue-500' : 'text-slate-300')}>{marketStats[market].totalPct}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 space-y-6 overflow-y-auto pr-3 custom-scrollbar relative z-10">
                            {tranches.filter(t => t.market === planningMarket).length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-6 border-4 border-dashed border-slate-50 rounded-[40px] bg-slate-50/30">
                                    <MousePointer2 size={60} className="opacity-20 animate-bounce" />
                                    <div className="text-center">
                                        <p className="text-lg font-black text-slate-400">Ready to Strategic Planning</p>
                                        <p className="text-xs font-bold text-slate-300 mt-1">차트의 특정 포인트를 클릭하여 매입 계획을 시작하세요.</p>
                                    </div>
                                </div>
                            ) : (
                                tranches.filter(t => t.market === planningMarket).sort((a, b) => a.id - b.id).map((t) => (
                                    <div key={t.id} className="p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-500 flex items-center gap-8 group">
                                        <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-[10px] font-black text-white shadow-lg transform group-hover:rotate-6 transition-transform duration-500" style={{ backgroundColor: marketData[t.market].color }}>
                                            {marketData[t.market].ticker}
                                            <span className="text-[8px] opacity-70 leading-none mt-0.5">{t.month}</span>
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase italic">Allocation Weight</span>
                                                <span className="text-sm font-black text-slate-800">{t.percentage}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={t.percentage}
                                                onChange={(e) => updateTranchePercentage(t.id, e.target.value, t.market)}
                                                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-100"
                                                style={{ accentColor: marketData[t.market].color }}
                                            />
                                        </div>
                                        <div className="text-right w-28">
                                            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1 italic">Unit Price</p>
                                            <p className="text-lg font-black text-slate-800 tracking-tighter">₩{t.price.toLocaleString()}</p>
                                        </div>
                                        <button
                                            onClick={() => removeTranche(t.id)}
                                            className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all duration-300"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    <div className="lg:col-span-5 space-y-10">
                        {/* Financial Diagnosis */}
                        <Card variant="dark" padding="xl" className="border-none shadow-3xl bg-slate-900/95 space-y-10 relative overflow-hidden backdrop-blur-xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-[80px]" />
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="grad-emerald p-3 rounded-[20px] text-white shadow-2xl shadow-emerald-500/20"><Calculator size={24} /></div>
                                <h3 className="text-2xl font-black text-white tracking-tight">Financial Diagnosis</h3>
                            </div>

                            <div className="space-y-8 relative z-10">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 flex flex-col items-center">
                                        <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase mb-2 italic">{marketData[planningMarket].ticker} VWAP</p>
                                        <p className="text-2xl font-black" style={{ color: marketData[planningMarket].color }}>₩ {Math.round(selectedMarketStats.vwap).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 flex flex-col items-center text-center">
                                        <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase mb-2 italic">Global Avg</p>
                                        <p className="text-2xl font-black text-white">₩ {Math.round(globalVWAP).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="p-8 bg-white/5 rounded-[40px] border border-white/10 space-y-6">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase italic">Projected Total Cost</span>
                                            <span className={cn("text-4xl font-black tracking-tighter", totalSimCost > budgetInWon ? 'text-rose-400' : 'text-white')}>
                                                ₩ {(totalSimCost / 100000000).toFixed(2)} 억
                                            </span>
                                        </div>
                                        <div className="text-right flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase italic">Budget Limit</span>
                                            <span className="text-lg font-black text-slate-300">₩ {simBudget} 억</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                                        <div className={cn("h-full transition-all duration-1000 ease-out", totalSimCost > budgetInWon ? 'bg-rose-500' : 'bg-blue-500')} style={{ width: `${Math.min(100, (totalSimCost / budgetInWon) * 100)}%` }} />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Strategic Insight */}
                        <Card variant="glass" padding="lg" className="border-none shadow-2xl shadow-blue-500/5 space-y-8 flex flex-col justify-between backdrop-blur-3xl">
                            <div className="space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="grad-amber p-2.5 rounded-2xl text-white shadow-lg"><Zap size={20} /></div>
                                    <h4 className="text-lg font-black text-slate-800 tracking-tight">AI Strategic Insight</h4>
                                </div>
                                <div className="p-5 bg-slate-50 rounded-[28px] border border-slate-100 italic">
                                    <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                                        "{selectedMarketStats.vwap > marketData[planningMarket].price ? '미래 예측가가 실거래가보다 높아 단가가 상승 중입니다. 상반기 비중을 확대하세요.' : '평균 단가가 예산 내에서 안정적으로 유지되고 있습니다.'}"
                                    </p>
                                </div>
                            </div>
                            <div className="pt-2 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase italic">Control Budget</span>
                                        <span className="text-sm font-black text-slate-800">₩ {simBudget} 억</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        value={simBudget}
                                        onChange={(e) => setSimBudget(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-900"
                                    />
                                </div>
                                <Button variant="gradient" size="lg" className="w-full shadow-2xl">
                                    <FileText size={20} /> Generate Intelligence Report
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
