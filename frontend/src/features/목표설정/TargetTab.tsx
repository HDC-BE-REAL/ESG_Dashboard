import React from 'react';
import {
    ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Flag, TrendingDown, TrendingUp, CheckCircle2, AlertCircle, Target } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { cn } from '../../components/ui/utils';

// actual이 있는 연도에서는 forecast 항목을 툴팁에서 제외
const TargetChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const hasActual = payload.some((p: any) => p.dataKey === 'actual' && p.value != null);
    const filtered = payload.filter((p: any) => !(p.dataKey === 'forecast' && hasActual));
    return (
        <div className="bg-white/95 backdrop-blur-md border border-slate-100 p-4 rounded-xl shadow-2xl text-xs z-50">
            <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2">{label}</p>
            {filtered.map((entry: any, i: number) => (
                <div key={i} className="flex items-center gap-2 mb-1 justify-between min-w-[120px]">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-slate-500 font-medium">{entry.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 font-mono">
                        {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value} t
                    </span>
                </div>
            ))}
        </div>
    );
};

interface TargetTabProps {
    sbtiAnalysis: any;
}

export const TargetTab: React.FC<TargetTabProps> = ({ sbtiAnalysis }) => {
    const annualRateNum = parseFloat(sbtiAnalysis.annualRate);
    const speedGapNum = parseFloat(sbtiAnalysis.speedGap);
    const isOnTrack = speedGapNum <= 0;

    return (
        <div className="space-y-8">

            {/* ── KPI 카드 4개 ───────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                {/* 기준 배출량 */}
                <Card className="flex flex-col justify-between">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            기준 배출량 ({sbtiAnalysis.baseYear})
                        </p>
                        <p className="text-3xl font-bold text-slate-900">
                            {sbtiAnalysis.baseEmission.toLocaleString()}
                            <span className="text-sm font-medium text-slate-400"> t</span>
                        </p>
                    </div>
                    <div className="mt-4 space-y-1">
                        <div className="flex items-center gap-1 text-slate-500 text-xs font-bold">
                            <Flag size={12} />
                            기준 배출량 (Scope 1 + Scope 2{sbtiAnalysis.hasScope3 ? ' + Scope 3' : ''})
                        </div>
                        {!sbtiAnalysis.hasScope3 && (
                            <p className="text-[10px] text-slate-400 leading-tight">
                                현재 분석 범위: Scope 1+2<br />
                                (Scope 3는 데이터 한계로 제외)
                            </p>
                        )}
                    </div>
                </Card>

                {/* 최신 배출량 */}
                <Card className="flex flex-col justify-between">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            최신 배출량 ({sbtiAnalysis.latestDataYear})
                        </p>
                        <p className="text-3xl font-bold text-slate-900">
                            {sbtiAnalysis.actualEmissionNow.toLocaleString()}
                            <span className="text-sm font-medium text-slate-400"> t</span>
                        </p>
                    </div>
                    <div className={cn(
                        "mt-4 flex items-center gap-1.5 text-xs font-bold w-fit px-2 py-1 rounded-full",
                        parseFloat(sbtiAnalysis.actualReductionPct) >= 0
                            ? "bg-[#10b77f]/10 text-[#10b77f]"
                            : "bg-red-50 text-red-500"
                    )}>
                        {parseFloat(sbtiAnalysis.actualReductionPct) >= 0
                            ? <TrendingDown size={14} />
                            : <TrendingUp size={14} />
                        }
                        {parseFloat(sbtiAnalysis.actualReductionPct) >= 0
                            ? `${sbtiAnalysis.actualReductionPct}% 감축`
                            : `${Math.abs(parseFloat(sbtiAnalysis.actualReductionPct)).toFixed(1)}% 증가`
                        } (vs {sbtiAnalysis.baseYear})
                    </div>
                </Card>

                {/* SBTi 목표달성도 */}
                <Card className={cn(
                    "flex flex-col justify-between border-2",
                    sbtiAnalysis.isAhead ? "border-[#10b77f]/20 bg-[#10b77f]/5" : "border-red-100 bg-red-50/30"
                )}>
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            SBTi 목표달성도 ({sbtiAnalysis.latestDataYear})
                        </p>
                        <p className={cn("text-3xl font-bold", sbtiAnalysis.isAhead ? "text-[#10b77f]" : "text-red-600")}>
                            {sbtiAnalysis.isAhead ? '초과 달성' : '미달'}
                        </p>
                    </div>
                    <div className={cn("mt-4 text-xs font-bold flex items-center gap-1", sbtiAnalysis.isAhead ? "text-[#10b77f]" : "text-red-500")}>
                        {sbtiAnalysis.isAhead ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        목표 대비 {Math.abs(sbtiAnalysis.gap).toLocaleString()}t {sbtiAnalysis.isAhead ? '여유' : '초과'}
                    </div>
                </Card>

                {/* Net Zero 2050 */}
                <Card className="flex flex-col justify-between bg-[#10221c] text-white border-[#1a2e28]">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                            Net Zero 2050
                        </p>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400">총 필요 감축률</span>
                                <span className="text-sm font-bold text-white">90%+</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400">현재 누적 감축률</span>
                                <span className="text-sm font-bold text-[#10b77f]">{sbtiAnalysis.currentReductionPct}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400">잔여 감축 격차</span>
                                <span className="text-sm font-bold text-orange-400">{sbtiAnalysis.remainingGap}%p</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-500">
                        <Target size={10} /> 글로벌 Net Zero 2050 시나리오 기준 정렬
                    </div>
                </Card>
            </div>

            {/* ── 차트 + 우측 분석 패널 ──────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* 차트 */}
                <Card padding="lg" className="lg:col-span-2">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-xl font-bold text-slate-900">Net Zero 경로 (SBTi 1.5°C)</h3>
                        <div className="flex flex-wrap gap-3 text-[10px] font-bold">
                            <div className="flex items-center gap-1.5">
                                <div className="w-6 h-0.5 bg-slate-800 rounded-full"></div>
                                실적
                            </div>
                            <div className="flex items-center gap-1.5">
                                <svg width="18" height="4"><line x1="0" y1="2" x2="18" y2="2" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 2"/></svg>
                                회귀 예측
                            </div>
                            <div className="flex items-center gap-1.5">
                                <svg width="18" height="4"><line x1="0" y1="2" x2="18" y2="2" stroke="#10b77f" strokeWidth="2" strokeDasharray="4 2"/></svg>
                                SBTi 경로
                            </div>
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={sbtiAnalysis.trajectory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                                <Tooltip content={<TargetChartTooltip />} />

                                {/* SBTi 표준 경로 (초록 점선) */}
                                <Line isAnimationActive={false} type="monotone" dataKey="sbti"
                                    name="SBTi 경로" stroke="#10b77f" strokeWidth={2}
                                    strokeDasharray="5 4" dot={false} connectNulls />

                                {/* 로그-선형 회귀 예측선 (검은 점선) */}
                                <Line isAnimationActive={false} type="monotone" dataKey="forecast"
                                    name="회귀 예측" stroke="#1e293b" strokeWidth={2}
                                    strokeDasharray="6 3" dot={false} connectNulls />

                                {/* 실제 배출량 (실선) */}
                                <Line isAnimationActive={false} type="monotone" dataKey="actual"
                                    name="실적" stroke="#1e293b" strokeWidth={3}
                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#1e293b' }}
                                    connectNulls={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {/* 방법론 주석 */}
                    <p className="mt-4 text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                        SBTi 경로: Absolute Contraction Approach(ACA) 기준, 기준연도({sbtiAnalysis.baseYear}) 대비 연 최소 4.2% 감축 가정 &nbsp;|&nbsp;
                        회귀 예측: log(E<sub>t</sub>) = α + βt (OLS, 로그-선형), 실적 구간 이후부터 표시
                    </p>
                </Card>

                {/* 우측 분석 패널 */}
                <div className="space-y-4">

                    {/* 감축 속도 분석 */}
                    <Card className="p-5">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">감축 속도 분석</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">현재 평균 감축률</span>
                                <span className={cn("text-sm font-bold", annualRateNum < 0 ? "text-[#10b77f]" : "text-red-500")}>
                                    {annualRateNum > 0 ? '+' : ''}{sbtiAnalysis.annualRate}%/yr
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">SBTi 요구 감축률</span>
                                <span className="text-sm font-bold text-slate-700">-4.20%/yr</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                                <span className="text-xs text-slate-500">감축 속도 격차</span>
                                <span className={cn("text-sm font-bold", isOnTrack ? "text-[#10b77f]" : "text-red-500")}>
                                    {isOnTrack ? '' : '+'}{sbtiAnalysis.speedGap}%p
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Monte Carlo 결과 */}
                    <Card className="p-5">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">2030 목표 달성 시뮬레이션</h4>
                        <div className="text-center py-3">
                            <p className={cn(
                                "text-4xl font-black",
                                sbtiAnalysis.achievementProbability >= 70 ? "text-[#10b77f]"
                                : sbtiAnalysis.achievementProbability >= 40 ? "text-orange-500"
                                : "text-red-500"
                            )}>
                                {sbtiAnalysis.achievementProbability}%
                            </p>
                            <p className="text-xs text-slate-500 mt-1">2030 SBTi 목표 달성 확률</p>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                            <span className="text-xs text-slate-500">필요 감축 가속도</span>
                            <span className="text-sm font-bold text-orange-500">
                                +{sbtiAnalysis.requiredAcceleration}%p
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
                            로그-선형 회귀 추세 + 불확실성 반영<br />Monte Carlo 시뮬레이션 (10,000회) 기반 추정
                        </p>
                    </Card>

                    {/* 회귀 모델 통계 */}
                    <Card className="p-5">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">회귀 모델 통계</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">추정 연평균 감축률</span>
                                <span className="text-sm font-bold text-slate-700">{sbtiAnalysis.annualRate}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">표준오차 (SE)</span>
                                <span className="text-sm font-bold text-slate-700">±{sbtiAnalysis.seBeta}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">모델</span>
                                <span className="text-xs font-mono text-slate-600">log(E<sub>t</sub>) = α + βt</span>
                            </div>
                        </div>
                        {!sbtiAnalysis.regressionValid && (
                            <p className="text-[10px] text-orange-400 mt-3">
                                * 데이터 포인트 부족 (2개 이상 필요)으로 신뢰구간 미산출
                            </p>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};
