import React from 'react';
import {
    BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Label, ResponsiveContainer
} from 'recharts';
import {
    Download, Star, TrendingUp, TrendingDown, Lightbulb, ArrowRight, ChevronUp, ChevronDown
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../ui/utils';
import { CustomTooltip } from '../ui/CustomTooltip';
import type { Competitor, IntensityType } from '../../types';

interface CompareTabProps {
    intensityType: IntensityType;
    setIntensityType: (type: IntensityType) => void;
    chartData: any[]; // sorted competitors
    selectedCompId: number;
    setSelectedCompId: (id: number) => void;
    activeScopes: { s1: boolean, s2: boolean, s3: boolean };
    setActiveScopes: React.Dispatch<React.SetStateAction<{ s1: boolean, s2: boolean, s3: boolean }>>;
    topThreshold: number;
    medianThreshold: number;
    isInsightOpen: boolean;
    setIsInsightOpen: (open: boolean) => void;
}

export const CompareTab: React.FC<CompareTabProps> = ({
    intensityType,
    setIntensityType,
    chartData,
    selectedCompId,
    setSelectedCompId,
    activeScopes,
    setActiveScopes, // Note: passing state setter directly from App
    topThreshold,
    medianThreshold,
    isInsightOpen,
    setIsInsightOpen
}) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col gap-4 mb-2">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">업계 벤치마킹 분석</h2>
                        <p className="text-slate-500 text-sm mt-1">경쟁사 비교</p>
                    </div>
                    <Button variant="outline" className="gap-2">
                        <Download size={16} /> 리포트 내보내기
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                {/* LEFT PANEL */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Filter */}
                    <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        <div className="grid grid-cols-2 gap-1 h-10">
                            <button
                                onClick={() => setIntensityType('revenue')}
                                className={cn("relative flex items-center justify-center rounded-lg text-sm font-medium transition-all", intensityType === 'revenue' ? "bg-[#10b77f]/10 text-[#10b77f] ring-1 ring-[#10b77f]" : "text-slate-500 hover:bg-slate-50")}
                            >
                                매출액 (Revenue)
                            </button>
                            <button
                                onClick={() => setIntensityType('production')}
                                className={cn("relative flex items-center justify-center rounded-lg text-sm font-medium transition-all", intensityType === 'production' ? "bg-[#10b77f]/10 text-[#10b77f] ring-1 ring-[#10b77f]" : "text-slate-500 hover:bg-slate-50")}
                            >
                                생산량 (Production)
                            </button>
                        </div>
                    </div>

                    {/* Rankings */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">경쟁사 순위</h3>
                            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">실시간 데이터</span>
                        </div>
                        <p className="text-sm text-slate-500 leading-snug">탄소 집약도 기준 (tCO2e / 단위). 낮을수록 우수합니다.</p>

                        <div className="flex flex-col gap-3">
                            {chartData.map((comp, idx) => {
                                const isMe = comp.id === 1;
                                const isSelected = selectedCompId === comp.id;
                                return (
                                    <div
                                        key={comp.id}
                                        onClick={() => setSelectedCompId(comp.id)}
                                        className={cn(
                                            "group flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden",
                                            isSelected ? "ring-2 ring-offset-2 ring-[#10b77f]/50" : "hover:shadow-md",
                                            isMe
                                                ? (isSelected ? "border-[#10b77f] bg-[#10b77f]/10" : "border-[#10b77f]/50 bg-[#10b77f]/5")
                                                : (isSelected ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-white")
                                        )}
                                    >
                                        <div className={cn("flex items-center justify-center size-8 rounded-full font-bold text-sm transition-colors",
                                            isMe ? "bg-[#10b77f] text-white shadow-sm" : (isSelected ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600")
                                        )}>
                                            {isMe ? <Star size={14} fill="white" /> : idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                                {comp.name}
                                                {isMe && <span className="text-[10px] text-[#10b77f] bg-[#10b77f]/10 px-1.5 py-0.5 rounded font-bold">Me</span>}
                                            </h4>
                                            <p className={cn("text-xs", isMe ? "text-[#10b77f] font-medium" : "text-slate-400")}>
                                                {isMe ? "현재 성과" : "글로벌 피어"}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={cn("block text-lg font-bold", isMe ? "text-[#10b77f]" : "text-slate-900")}>
                                                {comp.intensityValue?.toFixed(2)}
                                            </span>
                                            <span className="text-xs text-slate-500">tCO2e</span>
                                        </div>
                                        {isSelected && <div className="absolute right-0 top-0 p-1.5"><div className="w-2 h-2 rounded-full bg-[#10b77f]"></div></div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: Chart */}
                <div className="lg:col-span-8 flex flex-col h-full min-h-[500px]">
                    <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 lg:p-8 flex flex-col relative shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">탄소 집약도 비교 (Intensity Comparison)</h3>
                                <div className="flex items-center gap-4 mt-2">
                                    <p className="text-sm text-slate-500">{intensityType === 'revenue' ? '매출액' : '생산량'} 기준 집약도</p>
                                    <div className="h-4 w-px bg-slate-200"></div>
                                    <div className="flex gap-1">
                                        {(['s1', 's2', 's3'] as const).map(scope => (
                                            <button
                                                key={scope}
                                                onClick={() => setActiveScopes(prev => ({ ...prev, [scope]: !prev[scope] }))}
                                                className={cn(
                                                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border",
                                                    activeScopes[scope]
                                                        ? "bg-[#10b77f]/10 text-[#10b77f] border-[#10b77f]/30"
                                                        : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                                                )}
                                            >
                                                {scope.replace('s', 'S')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* Legend */}
                            <div className="flex gap-4 text-xs font-medium">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#10b77f] rounded-sm"></div>자사 (Our Co)</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-800 rounded-sm"></div>선택됨</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-300 rounded-sm"></div>기타</div>
                            </div>
                        </div>

                        {/* Recharts Implementation */}
                        <div className="flex-1 w-full min-h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }} barSize={60}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                    <ReferenceLine y={topThreshold} stroke="#10b77f" strokeDasharray="3 3">
                                        <Label value={`상위 10% (${topThreshold})`} position="right" fill="#10b77f" fontSize={11} fontWeight={700} />
                                    </ReferenceLine>
                                    <ReferenceLine y={medianThreshold} stroke="#94a3b8" strokeDasharray="5 5">
                                        <Label value={`중앙값 (${medianThreshold})`} position="right" fill="#94a3b8" fontSize={11} fontWeight={700} />
                                    </ReferenceLine>
                                    <Bar dataKey="intensityValue" radius={[8, 8, 0, 0]}>
                                        {chartData.map((entry, index) => {
                                            const isMe = entry.id === 1;
                                            const isSelected = entry.id === selectedCompId;
                                            let fillColor = '#cbd5e1'; // Default Gray

                                            if (isMe) {
                                                fillColor = isSelected ? '#059669' : '#10b77f'; // Darker green if selected
                                            } else if (isSelected) {
                                                fillColor = '#1e293b'; // Dark Slate for selected competitor
                                            }

                                            return <Cell key={`cell-${index}`} fill={fillColor} />;
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Strategic Insight Footer */}
            <div className="w-full transition-all duration-300">
                {isInsightOpen ? (
                    <div className="bg-[#111814] text-white rounded-xl p-6 lg:p-8 flex flex-col md:flex-row gap-6 md:items-start shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                        <div className="absolute right-0 top-0 w-64 h-full opacity-10 pointer-events-none bg-gradient-to-l from-[#10b77f] to-transparent"></div>

                        <div className="flex-shrink-0 bg-white/10 p-3 rounded-lg text-[#10b77f]">
                            <Lightbulb size={24} />
                        </div>

                        <div className="flex-1 flex flex-col gap-2 relative z-10">
                            {/* Title & Content */}
                            <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                                전략적 인사이트: 효율성 격차 (Efficiency Gap)
                                <span className="text-[10px] font-bold bg-[#10b77f]/20 text-[#10b77f] px-2 py-0.5 rounded-full border border-[#10b77f]/30">조치 필요 (Action Required)</span>
                            </h3>
                            <p className="text-slate-300 leading-relaxed max-w-3xl text-sm">
                                <strong className="text-white">우리 기업</strong>은 현재 업계 평균(Median)을 상회하고 있으나, 상위 10% 진입을 위해서는 생산 집약도의 <span className="text-[#10b77f] font-bold">15% 추가 감축</span>이 필요합니다.
                                선두 기업(A사)의 주요 경쟁력은 40% 더 높은 <span className="text-white underline decoration-[#10b77f]/50 decoration-2 underline-offset-4">재생에너지 전환율</span>에서 기인합니다.
                            </p>
                        </div>

                        <div className="flex flex-col justify-center min-w-[140px] gap-2 relative z-10">
                            <button className="bg-[#10b77f] hover:bg-[#0e9f6e] text-white font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-[#10b77f]/20">
                                세부 실행 계획
                                <ArrowRight size={16} />
                            </button>
                            <button
                                onClick={() => setIsInsightOpen(false)}
                                className="text-slate-400 hover:text-white text-sm font-medium py-1 px-4 text-center transition-colors flex items-center justify-center gap-1"
                            >
                                접기 <ChevronUp size={14} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center animate-in fade-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setIsInsightOpen(true)}
                            className="bg-[#111814] text-white hover:bg-slate-800 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold transition-all hover:scale-105 border border-slate-700"
                        >
                            <Lightbulb size={16} className="text-[#10b77f]" />
                            전략적 인사이트 보기 (Efficiency Gap)
                            <ChevronDown size={16} className="text-slate-400" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
