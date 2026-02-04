import React from 'react';
import {
    AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
    Printer, Share2, SlidersHorizontal, RotateCcw, Coins, ThumbsUp, TrendingUp, Clock, Wallet, Lightbulb
} from 'lucide-react';
import { Button } from '../ui/Button';
import { CustomTooltip } from '../ui/CustomTooltip';

interface InvestmentTabProps {
    investTotalAmount: number;
    investCarbonPrice: number;
    setInvestCarbonPrice: (val: number) => void;
    investEnergySavings: number;
    setInvestEnergySavings: (val: number) => void;
    investDiscountRate: number;
    setInvestDiscountRate: (val: number) => void;
    investTimeline: number;
    setInvestTimeline: (val: number) => void;
    investmentAnalysis: any;
}

export const InvestmentTab: React.FC<InvestmentTabProps> = ({
    investTotalAmount,
    investCarbonPrice,
    setInvestCarbonPrice,
    investEnergySavings,
    setInvestEnergySavings,
    investDiscountRate,
    setInvestDiscountRate,
    investTimeline,
    setInvestTimeline,
    investmentAnalysis
}) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-6 mb-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                            투자 전략: <span className="text-[#10b77f]">녹색 설비투자(CAPEX) 배분</span>
                        </h2>
                        <p className="text-slate-500 text-base max-w-2xl">
                            부채 대비 7,621억 원 규모의 녹색 투자 계획에 대한 전략적 분석입니다.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="gap-2 bg-white text-slate-700 border-slate-200 hover:bg-slate-50">
                            <Printer size={20} /> 리포트 출력
                        </Button>
                        <Button className="gap-2 shadow-lg shadow-[#10b77f]/25 bg-[#10b77f] hover:bg-[#0e9f6e] text-white">
                            <Share2 size={20} /> 전략 내보내기
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                {/* Left Panel: Simulation Controls (3 Cols) */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 h-full flex flex-col shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <SlidersHorizontal className="text-[#10b77f]" size={20} />
                            <h3 className="text-lg font-bold text-slate-900">시뮬레이션 변수</h3>
                        </div>
                        <div className="flex flex-col gap-8 flex-1">
                            {/* Slider 1 */}
                            <div className="group">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-sm font-medium text-slate-500">탄소세율 (Tax Rate)</label>
                                    <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">₩{investCarbonPrice.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ 톤</span></span>
                                </div>
                                <input
                                    type="range" min="10000" max="100000" step="1000" value={investCarbonPrice} onChange={(e) => setInvestCarbonPrice(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#10b77f]"
                                />
                                <div className="flex justify-between mt-1 text-[10px] text-slate-400 uppercase tracking-wider">
                                    <span>보수적</span><span>공격적</span>
                                </div>
                            </div>
                            {/* Slider 2 */}
                            <div className="group">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-sm font-medium text-slate-500">에너지 절감률</label>
                                    <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{investEnergySavings}% <span className="text-xs text-slate-400 font-normal">YoY</span></span>
                                </div>
                                <input
                                    type="range" min="0" max="30" step="0.5" value={investEnergySavings} onChange={(e) => setInvestEnergySavings(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#10b77f]"
                                />
                            </div>
                            {/* Slider 3 */}
                            <div className="group">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-sm font-medium text-slate-500">할인율 (Discount)</label>
                                    <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{investDiscountRate}%</span>
                                </div>
                                <input
                                    type="range" min="1" max="10" step="0.1" value={investDiscountRate} onChange={(e) => setInvestDiscountRate(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#10b77f]"
                                />
                            </div>
                            {/* Slider 4 */}
                            <div className="group">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-sm font-medium text-slate-500">이행 기간 (Timeline)</label>
                                    <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{investTimeline} 년</span>
                                </div>
                                <input
                                    type="range" min="1" max="10" step="1" value={investTimeline} onChange={(e) => setInvestTimeline(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#10b77f]"
                                />
                            </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <button onClick={() => { setInvestCarbonPrice(45000); setInvestEnergySavings(12.5); setInvestDiscountRate(4.2); setInvestTimeline(5); }} className="w-full py-2.5 rounded-lg border border-[#10b77f] text-[#10b77f] font-bold text-sm hover:bg-[#10b77f]/5 transition-colors flex items-center justify-center gap-2">
                                <RotateCcw size={18} /> 시뮬레이션 초기화
                            </button>
                        </div>
                    </div>
                </div>

                {/* Center Panel: Visualizations (6 Cols) */}
                <div className="lg:col-span-6 flex flex-col gap-6">
                    {/* Hero Stat Card */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                            <Coins size={120} className="text-[#10b77f]" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded-full bg-[#10b77f]/10 text-[#10b77f] text-xs font-bold uppercase tracking-wider">승인됨 (Approved)</span>
                                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">총 녹색 투자액 (Total Green CAPEX)</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-5xl font-black text-slate-900 tracking-tighter">{(investTotalAmount / 100000000).toLocaleString()}</h2>
                                <span className="text-xl font-bold text-slate-400">억 원 (KRW)</span>
                            </div>
                            <p className="mt-2 text-sm text-slate-500">재생에너지 전환 및 탄소 포집 기술(CCUS) 도입을 위해 배정됨.</p>
                        </div>
                    </div>

                    {/* Charts Container */}
                    <div className="flex-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-8">
                        {/* Bar Chart Section */}
                        <div className="flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-base font-bold text-slate-900">부채(Risk) vs 투자(Action)</h3>
                                <div className="flex items-center gap-4 text-xs font-medium">
                                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#10b77f]"></div><span className="text-slate-500">투자 (Investment)</span></div>
                                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-400"></div><span className="text-slate-500">리스크 부채 (Risk Liability)</span></div>
                                </div>
                            </div>
                            <div className="relative flex-1 min-h-[180px] flex items-end justify-center gap-16 pb-6 border-b border-slate-100">
                                {/* Bar 1 */}
                                <div className="flex flex-col items-center gap-2 w-24 group z-10 relative cursor-pointer">
                                    <span className="text-sm font-bold text-[#10b77f] opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8">{(investmentAnalysis.investmentCost / 100000000).toFixed(0)}억</span>
                                    <div className="w-full bg-[#10b77f] rounded-t-lg relative hover:brightness-110 transition-all shadow-lg shadow-[#10b77f]/20" style={{ height: '140px' }}></div>
                                    <span className="text-xs font-bold text-slate-500 mt-2 text-center">녹색 설비투자<br />(Action)</span>
                                </div>
                                {/* Bar 2 */}
                                <div className="flex flex-col items-center gap-2 w-24 group z-10 relative cursor-pointer">
                                    <span className="text-sm font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8">{(investmentAnalysis.liabilityCost / 100000000).toFixed(0)}억</span>
                                    <div className="w-full bg-slate-300 rounded-t-lg relative hover:brightness-95 transition-all" style={{ height: `${Math.min(200, (investmentAnalysis.liabilityCost / investmentAnalysis.investmentCost) * 140)}px` }}>
                                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '8px 8px' }}></div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 mt-2 text-center">환경 부채<br />(Inaction)</span>
                                </div>
                            </div>
                        </div>

                        {/* Line Chart Section */}
                        <div className="flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-base font-bold text-slate-900">손익분기점 도달 시기 (Break-even)</h3>
                                <span className="text-xs font-bold bg-[#10b77f]/10 text-[#10b77f] px-2 py-1 rounded">4.5년 후 전환</span>
                            </div>
                            <div className="relative w-full h-[180px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={investmentAnalysis.chartData}>
                                        <defs>
                                            <linearGradient id="gradientSavings" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b77f" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#10b77f" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                        <YAxis hide />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line type="monotone" dataKey="investment" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                                        <Area type="monotone" dataKey="savings" stroke="#10b77f" strokeWidth={3} fill="url(#gradientSavings)" />
                                        {/* Break-even point marker simulation */}
                                        {Number(investmentAnalysis.payback) <= 10 && (
                                            <ReferenceLine x={`Y${Math.floor(Number(investmentAnalysis.payback))}`} stroke="#10b77f" strokeDasharray="3 3" label={{ value: 'BEP', position: 'top', fill: '#10b77f', fontSize: 10, fontWeight: 700 }} />
                                        )}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Verdict & KPIs (3 Cols) */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    {/* Verdict Card */}
                    <div className="bg-[#10b77f]/5 border border-[#10b77f]/20 rounded-2xl p-6 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-[#10b77f] flex items-center justify-center text-white mb-3 shadow-lg shadow-[#10b77f]/30">
                            <ThumbsUp size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">재무적 판단 (Verdict)</h3>
                        <div className="bg-[#10b77f] text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider mb-4 shadow-sm">
                            강력 매수 (Strong Buy)
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            시뮬레이션 결과 매우 긍정적입니다. 5년 차부터 리스크 헷징 효과가 구현 비용을 상회합니다.
                        </p>
                    </div>

                    {/* KPI Cards Stack */}
                    <div className="flex flex-col gap-4">
                        {/* ROI */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">투자수익률 (ROI 10yr)</p>
                                <p className="text-2xl font-black text-[#10b77f]">+{investmentAnalysis.roi}%</p>
                            </div>
                            <TrendingUp size={32} className="text-[#10b77f]/30" />
                        </div>
                        {/* Payback */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">회수 기간 (Payback)</p>
                                <p className="text-2xl font-black text-slate-900">{investmentAnalysis.payback} <span className="text-sm font-medium text-slate-400">년</span></p>
                            </div>
                            <Clock size={32} className="text-slate-300" />
                        </div>
                        {/* NPV */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">순현재가치 (NPV)</p>
                                <p className="text-2xl font-black text-slate-900">{(investmentAnalysis.netBenefit / 100000000).toFixed(0)} <span className="text-sm font-medium text-slate-400">억 원</span></p>
                            </div>
                            <Wallet size={32} className="text-slate-300" />
                        </div>
                    </div>

                    {/* Analyst Insight */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 flex-1 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="text-amber-500" size={20} />
                            <h4 className="text-sm font-bold text-slate-900">분석가 인사이트</h4>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            이 CAPEX 배분은 인프라 현대화와 동시에 2026년 예상되는 탄소세 인상에 대비하는 이중 목적(Dual-purpose) 전략으로 작용합니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
