import React from 'react';
import {
    ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    Flag, TrendingDown, CheckCircle2, AlertCircle, Target,
    LineChart as LineChartIcon, Quote, Zap, Briefcase
} from 'lucide-react';
import { Card } from '../ui/Card';
import { CustomTooltip } from '../ui/CustomTooltip';
import { cn } from '../ui/utils';

interface TargetTabProps {
    sbtiAnalysis: any;
}

export const TargetTab: React.FC<TargetTabProps> = ({ sbtiAnalysis }) => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="flex flex-col justify-between">
                    <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">기준 연도 배출량 (2021)</p><p className="text-3xl font-bold text-slate-900">{sbtiAnalysis.baseEmission.toLocaleString()} <span className="text-sm font-medium text-slate-400">t</span></p></div>
                    <div className="mt-4 flex items-center gap-1 text-slate-500 text-xs font-bold"><Flag size={14} /> Baseline (S1+S2)</div>
                </Card>
                <Card className="flex flex-col justify-between">
                    <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">현재 배출량 (2026)</p><p className="text-3xl font-bold text-slate-900">{sbtiAnalysis.actualEmissionNow.toLocaleString()} <span className="text-sm font-medium text-slate-400">t</span></p></div>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-bold w-fit px-2 py-1 rounded-full bg-[#10b77f]/10 text-[#10b77f]">
                        <TrendingDown size={14} />
                        {sbtiAnalysis.actualReductionPct}% 감축 (vs 2021)
                    </div>
                </Card>
                <Card className={cn("flex flex-col justify-between border-2", sbtiAnalysis.isAhead ? "border-[#10b77f]/20 bg-[#10b77f]/5" : "border-red-100 bg-red-50/30")}>
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">SBTi 목표 달성도</p><p className={cn("text-3xl font-bold", sbtiAnalysis.isAhead ? "text-[#10b77f]" : "text-red-600")}>{sbtiAnalysis.isAhead ? '초과 달성' : '미달'}</p>
                    </div>
                    <div className={cn("mt-4 text-xs font-bold flex items-center gap-1", sbtiAnalysis.isAhead ? "text-[#10b77f]" : "text-red-500")}>
                        {sbtiAnalysis.isAhead ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        목표 대비 {Math.abs(sbtiAnalysis.gap).toLocaleString()}t {sbtiAnalysis.isAhead ? '여유' : '초과'}
                    </div>
                </Card>
                <Card className="flex flex-col justify-between bg-[#10221c] text-white border-[#1a2e28]">
                    <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Net Zero 목표 (2050)</p><p className="text-3xl font-bold text-[#10b77f]">D-24</p></div>
                    <div className="mt-4 text-xs font-bold text-slate-400 flex items-center gap-1"><Target size={14} /> 잔여 감축 필요량: 90%</div>
                </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card padding="lg" className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><LineChartIcon size={20} className="text-[#10b77f]" /> Net Zero 경로 (SBTi 1.5°C)</h3>
                        <div className="flex gap-4 text-[10px] font-bold">
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>실적 (Actual)</div>
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#10b77f]"></div>SBTi 목표</div>
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={sbtiAnalysis.trajectory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSbti" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b77f" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b77f" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Area isAnimationActive={false} type="monotone" dataKey="sbti" name="SBTi 경로" stroke="#10b77f" fill="url(#colorSbti)" strokeWidth={2} strokeDasharray="5 5" />
                                <Line isAnimationActive={false} type="monotone" dataKey="actual" name="배출량" stroke="#1e293b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#1e293b' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <div className="space-y-6">
                    <Card className="h-full bg-[#10b77f] text-white border-[#0e9f6e] flex flex-col justify-center p-8 shadow-xl shadow-[#10b77f]/20">
                        <Quote className="text-white/30 mb-6" size={40} />
                        <p className="text-xl font-bold leading-relaxed mb-6">
                            "현재 감축 속도(연평균 -5.2%)는 SBTi 요구사항(-4.2%)을 상회하고 있습니다. 2030년 중간 목표 달성이 유력합니다."
                        </p>
                        <div className="flex items-center gap-2 text-xs font-bold text-white/80 bg-white/10 w-fit px-3 py-1.5 rounded-full"><CheckCircle2 size={14} /> AI 지속가능성 진단</div>
                    </Card>
                    <Card className="p-6">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">주요 감축 활동 현황</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mt-0.5"><Zap size={14} /></div>
                                <div><p className="text-sm font-bold text-slate-700">재생에너지 전환 (RE100)</p><p className="text-xs text-slate-400 mt-0.5">태양광 PPA 계약 체결 완료</p></div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mt-0.5"><Briefcase size={14} /></div>
                                <div><p className="text-sm font-bold text-slate-700">공정 효율화</p><p className="text-xs text-slate-400 mt-0.5">스마트 팩토리 시스템 도입 중</p></div>
                            </li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};
