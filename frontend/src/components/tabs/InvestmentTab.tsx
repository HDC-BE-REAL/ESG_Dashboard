import { Zap, Lock, Scale, BarChart3, TrendingUp, Calculator, CheckCircle2, Database } from 'lucide-react';
import {
    ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Label, Scatter
} from 'recharts';
import { cn } from '../../lib/utils';
import { Card, Badge, Button } from '../ui';

interface ChartDataPoint {
    price: number;
    liability: number;
    investment: number;
}

interface InvestmentAnalysis {
    targetYear: number;
    targetReductionPct: string;
    totalEmissions: number;
    liabilityCost: number;
    investmentCost: number;
    netBenefit: number;
    isInvestFavorable: boolean;
    roi: string;
    transitionCostEfficiency: number;
    payback: string;
    chartData: ChartDataPoint[];
}

interface InvestmentTabProps {
    greenInvestment: number;
    investCarbonPrice: number;
    setInvestCarbonPrice: (price: number) => void;
    investmentAnalysis: InvestmentAnalysis;
}

const formatKRW = (val: number) => `₩${(val / 100000000).toFixed(1)}억`;

export function InvestmentTab({
    greenInvestment,
    investCarbonPrice,
    setInvestCarbonPrice,
    investmentAnalysis,
}: InvestmentTabProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-12 gap-8">
                {/* Left Sidebar (Input Variables) */}
                <aside className="col-span-12 lg:col-span-3 space-y-6">
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <Zap className="text-[#10b77f]" size={20} />
                        <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800">시뮬레이션 변수 설정</h3>
                    </div>

                    <Card className="relative bg-slate-50 border-slate-200 overflow-visible">
                        <div className="absolute top-4 right-4 text-slate-400"><Lock size={16} /></div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase mb-2">2030 감축 목표</p>
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-4xl font-black text-slate-900 tracking-tight">{investmentAnalysis.targetReductionPct}%</span>
                            <span className="text-[10px] font-bold text-[#10b77f] bg-[#10b77f]/10 px-2 py-1 rounded">SBTi Mandatory</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-[#10b77f] h-full rounded-full" style={{ width: `${investmentAnalysis.targetReductionPct}%` }}></div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-3 font-medium">기업 지속가능성 정책에 의해 고정됨</p>
                    </Card>

                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-[11px] font-bold text-slate-400 uppercase">녹색 투자 총액 (Total CAPEX)</p>
                            <span className="text-[#10b77f] font-mono text-sm font-bold">₩ {(greenInvestment / 100000000).toLocaleString()}억</span>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                            <Badge variant="default" className="text-[10px] text-slate-500 bg-white border border-slate-200 hover:bg-white"><Database size={10} className="mr-1" /> ERP 연동됨</Badge>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-[11px] font-bold text-slate-400 uppercase">2030 예상 탄소 가격</p>
                            <span className="text-blue-600 font-mono text-sm font-bold">₩ {investCarbonPrice.toLocaleString()}</span>
                        </div>
                        <input
                            type="range" min="10000" max="100000" step="1000"
                            value={investCarbonPrice} onChange={(e) => setInvestCarbonPrice(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-mono"><span>10k</span><span>100k</span></div>
                    </Card>

                    <div className="h-px bg-slate-200 my-2"></div>

                    <Card variant="dark" className="shadow-xl shadow-slate-900/20">
                        <div className="flex items-center gap-2 mb-4">
                            <Scale size={16} className="text-[#10b77f]" />
                            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">전환 비용 효율성 (TCE)</p>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-3xl font-bold text-white font-mono tracking-tight">₩ {(investmentAnalysis.transitionCostEfficiency / 10000).toFixed(0)}만</span>
                            <span className="text-sm text-slate-500 font-medium">/ tCO2e</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">탄소 가격이 이 임계값을 초과할 경우,<br />직접 투자가 경제적으로 더 유리합니다.</p>
                    </Card>
                </aside>

                {/* Center (Charts) */}
                <section className="col-span-12 lg:col-span-6 bg-[#10221c] text-white rounded-[32px] p-8 flex flex-col relative overflow-hidden border border-[#1a2e28] shadow-2xl">
                    {/* Background Decor */}
                    <div className="absolute top-0 right-0 p-64 bg-[#10b77f] opacity-[0.03] blur-[120px] rounded-full pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2"><BarChart3 className="text-[#10b77f]" /> 리스크 헷징 분석</h2>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-700"></div><span className="text-xs text-slate-400 font-medium">탄소 리스크 총액</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#10b77f]"></div><span className="text-xs text-slate-400 font-medium">녹색 투자 총액</span></div>
                            </div>
                        </div>

                        {/* 1. Bar Chart (Cost Comparison) */}
                        <div className="flex-1 flex items-end justify-center gap-16 pb-12 border-b border-white/5 mb-8">
                            <div className="flex flex-col items-center gap-3 w-32 group cursor-pointer">
                                <div className="w-full bg-slate-800/50 rounded-t-xl relative flex items-end justify-center hover:bg-slate-700 transition-colors" style={{ height: '240px' }}>
                                    <span className="text-white font-bold mb-3 text-sm">{formatKRW(investmentAnalysis.liabilityCost)}</span>
                                </div>
                                <div className="text-center">
                                    <p className="text-slate-900 font-bold text-lg">{formatKRW(investmentAnalysis.liabilityCost)}</p>
                                    <p className="text-slate-500 text-xs font-bold mt-1">탄소 리스크 총액</p>
                                </div>
                            </div>

                            <div className="h-[240px] flex items-center pb-8 opacity-30">
                                <div className="text-2xl font-black text-slate-600">VS</div>
                            </div>

                            <div className="flex flex-col items-center gap-3 w-32 group cursor-pointer">
                                <div className="w-full bg-[#10b77f] rounded-t-xl relative flex items-end justify-center shadow-[0_0_30px_-5px_rgba(16,183,127,0.3)] hover:brightness-110 transition-all" style={{ height: `${Math.min(100, (investmentAnalysis.investmentCost / Math.max(investmentAnalysis.liabilityCost, investmentAnalysis.investmentCost)) * 240)}px` }}>
                                    <span className="text-white font-bold mb-3 text-sm">{formatKRW(investmentAnalysis.investmentCost)}</span>
                                </div>
                                <div className="text-center">
                                    <p className="text-emerald-600 font-bold text-lg">{formatKRW(investmentAnalysis.investmentCost)}</p>
                                    <p className="text-slate-900 text-xs font-bold mt-1">녹색 투자 총액</p>
                                </div>
                            </div>
                        </div>

                        {/* 2. Line Chart (Break-even) */}
                        <div className="h-[280px] w-full">
                            <h3 className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-wider flex items-center gap-2"><TrendingUp size={14} /> 투자 적정성 임계값 (Break-even Analysis)</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={investmentAnalysis.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorLiability" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                                    <XAxis dataKey="price" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(val) => `₩${val / 10000}만`} stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis hide />
                                    <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#334155', backgroundColor: '#0f172a', color: '#fff' }} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />

                                    {/* Investment Line (Flat) */}
                                    <Line type="monotone" dataKey="investment" name="녹색 투자 (Investment)" stroke="#10b77f" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#10b77f' }} />

                                    {/* Liability Line (Slope) */}
                                    <Area type="monotone" dataKey="liability" name="탄소 리스크 (Liability)" stroke="#64748b" fill="url(#colorLiability)" strokeWidth={2} dot={false} />

                                    {/* Intersection Point */}
                                    <ReferenceLine x={investmentAnalysis.transitionCostEfficiency} stroke="#ef4444" strokeDasharray="3 3">
                                        <Label value="BEP" position="top" fill="#ef4444" fontSize={10} fontWeight={700} />
                                    </ReferenceLine>
                                    <Scatter data={[{ price: investmentAnalysis.transitionCostEfficiency, investment: investmentAnalysis.investmentCost }]} fill="#ef4444" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </section>

                {/* Right Panel (Verdict) */}
                <aside className="col-span-12 lg:col-span-3 flex flex-col h-full space-y-6">
                    <Card className="flex-1 flex flex-col justify-center border-l-4 border-l-[#10b77f] bg-white shadow-lg">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="p-2 bg-emerald-50 rounded-lg text-[#10b77f]"><Calculator size={20} /></div>
                            <div>
                                <h3 className="text-slate-900 font-bold text-sm uppercase tracking-wider">재무적 판단</h3>
                                <p className="text-[10px] text-slate-400">Current Simulation Verdict</p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <p className="text-slate-400 text-[11px] font-bold uppercase mb-2">예상 순 편익 (Net Benefit)</p>
                            <div className="flex items-baseline gap-2">
                                <span className={cn("text-4xl font-black font-mono tracking-tighter", investmentAnalysis.isInvestFavorable ? "text-[#10b77f]" : "text-red-500")}>
                                    {investmentAnalysis.isInvestFavorable ? '+' : ''} {formatKRW(investmentAnalysis.netBenefit)}
                                </span>
                            </div>
                            <div className="mt-4">
                                <span className={cn("inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border", investmentAnalysis.isInvestFavorable ? "bg-[#10b77f]/10 text-[#10b77f] border-[#10b77f]/20" : "bg-red-50 text-red-600 border-red-200")}>
                                    {investmentAnalysis.isInvestFavorable ? '투자 유리 (INVESTMENT)' : '배출권 구매 유리 (CREDIT BUY)'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                <span className="text-xs text-slate-500 font-bold">리스크 커버리지</span>
                                <span className={cn("text-lg font-mono font-bold", parseFloat(investmentAnalysis.roi) > 0 ? "text-slate-900" : "text-red-500")}>{investmentAnalysis.roi}%</span>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                <span className="text-xs text-slate-500 font-bold">회수 기간 (Payback)</span>
                                <span className="text-lg font-mono font-bold text-slate-900">{investmentAnalysis.payback} Yrs</span>
                            </div>
                        </div>

                        <div className="mt-auto pt-8 flex flex-col gap-3">
                            <Button className="w-full h-12 text-sm font-bold gap-2 shadow-lg shadow-[#10b77f]/20">
                                <CheckCircle2 size={18} /> 투자 우선순위 설정
                            </Button>
                            <Button variant="outline" className="w-full h-12 text-sm font-bold text-slate-500">
                                시장 배출권 조달
                            </Button>
                        </div>
                    </Card>
                </aside>
            </div>
        </div>
    );
}
