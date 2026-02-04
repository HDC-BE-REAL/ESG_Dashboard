import React, { useState } from 'react';
import {
    PieChart, Pie, Cell, Label, Tooltip, Legend, ResponsiveContainer,
    ComposedChart, CartesianGrid, XAxis, YAxis, Line, Area, ReferenceLine, Sector
} from 'recharts';
import {
    Cloud, TrendingDown, Euro, AlertCircle, Activity,
    TrendingUp, CheckCircle, CheckCircle2, MoreHorizontal
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { CustomTooltip } from '../ui/CustomTooltip';
import { cn } from '../ui/utils';
import type { Competitor } from '../../types';

interface DashboardTabProps {
    selectedComp: Competitor;
    costEU_KRW: number;
    ytdAnalysis: {
        currentIntensity: string;
        percentChange: string;
        delta: string;
        period: string;
        scopeLabel: string;
    };
    intensityType: string;
    sbtiAnalysis: any;
}

// [ADDED] 3D Active Shape for Pie Chart
const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

    return (
        <g>
            <text x={cx} y={cy} dy={-10} textAnchor="middle" fill="#1e293b" className="text-sm font-bold">
                {payload.name}
            </text>
            <text x={cx} y={cy} dy={15} textAnchor="middle" fill="#10b77f" className="text-xl font-black">
                {(percent * 100).toFixed(0)}%
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 8} // Scale up effect
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                style={{ filter: "drop-shadow(0px 8px 8px rgba(0,0,0,0.25))" }} // 3D Shadow
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 10}
                outerRadius={outerRadius + 12}
                fill={fill}
            />
        </g>
    );
};

export const DashboardTab: React.FC<DashboardTabProps> = ({
    selectedComp,
    costEU_KRW,
    ytdAnalysis,
    intensityType,
    sbtiAnalysis
}) => {
    const [pieActiveIndex, setPieActiveIndex] = useState(0);

    const pieData = [
        { name: 'Scope 1', value: selectedComp.s1 || 0, color: '#0da559' },
        { name: 'Scope 2', value: selectedComp.s2 || 0, color: '#86efac' },
        { name: 'Scope 3', value: selectedComp.s3 || 0, color: '#dcfce7' }
    ];

    const totalExposure = (selectedComp.s1 || 0) + (selectedComp.s2 || 0) + (selectedComp.s3 || 0);

    const onPieEnter = (_: any, index: number) => {
        setPieActiveIndex(index);
    };

    return (
        <div className="space-y-8">
            {/* KPI Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1: Total Emissions */}
                <div className="flex flex-col p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                            <Cloud size={24} />
                        </div>
                        <Badge variant="success" className="bg-emerald-100 text-emerald-700">
                            <TrendingDown size={14} className="mr-1" />
                            4.2%
                        </Badge>
                    </div>
                    <p className="text-sm font-medium text-slate-500">총 탄소 배출량 (Total Emissions)</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{(selectedComp.s1 + selectedComp.s2).toLocaleString()} <span className="text-sm font-normal text-slate-400">tCO2e</span></p>
                    <p className="text-xs text-slate-400 mt-2">전년 대비 (vs Last Year)</p>
                </div>

                {/* Card 2: Risk Exposure */}
                <div className="flex flex-col p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                            <Euro size={24} />
                        </div>
                        <Badge variant="default" className="bg-slate-100 text-slate-600">
                            <AlertCircle size={14} className="mr-1" />
                            안정적 (Stable)
                        </Badge>
                    </div>
                    <p className="text-sm font-medium text-slate-500">EU 리스크 노출액</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">€ {(costEU_KRW / 1450 / 1000000).toFixed(1)}M</p>
                    <p className="text-xs text-slate-400 mt-2">탄소 가격 영향 (Pricing Impact)</p>
                </div>

                {/* Card 3: Carbon Intensity */}
                <div className="flex flex-col p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
                            <Activity size={24} />
                        </div>
                        <Badge variant={Number(ytdAnalysis.percentChange) > 0 ? "warning" : "success"} className={Number(ytdAnalysis.percentChange) > 0 ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"}>
                            {Number(ytdAnalysis.percentChange) > 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                            {Math.abs(Number(ytdAnalysis.percentChange))}%
                        </Badge>
                    </div>
                    <p className="text-sm font-medium text-slate-500">탄소 집약도 (Intensity)</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{ytdAnalysis.currentIntensity}</p>
                    <p className="text-xs text-slate-400 mt-2">{intensityType === 'revenue' ? 'tCO2e / 1억 매출' : 'kg / 제품 단위'}</p>
                </div>

                {/* Card 4: Allowances */}
                <div className="flex flex-col p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                            <CheckCircle size={24} />
                        </div>
                        <Badge variant="success" className="bg-emerald-100 text-emerald-700">
                            <CheckCircle2 size={14} className="mr-1" />
                            양호 (On Track)
                        </Badge>
                    </div>
                    <p className="text-sm font-medium text-slate-500">무상 할당량 소진율</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{((selectedComp.allowance / (selectedComp.s1 + selectedComp.s2)) * 100).toFixed(0)}%</p>
                    <p className="text-xs text-slate-400 mt-2">할당량 활용 (Utilization)</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                {/* Pie Chart (Scope Contribution) - Width 4/12 */}
                <div className="lg:col-span-4 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-slate-900 text-lg font-bold">Scope별 배출 기여도</h3>
                        <button className="text-slate-400 hover:text-[#10b77f] transition-colors"><MoreHorizontal size={20} /></button>
                    </div>
                    <div className="flex-1 w-full min-h-[400px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    {...{ activeIndex: pieActiveIndex } as any}
                                    activeShape={renderActiveShape}
                                    data={pieData}
                                    dataKey="value"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={80} // Increased size as requested
                                    paddingAngle={2}
                                    cornerRadius={6}
                                    onMouseEnter={onPieEnter}
                                >
                                    <Cell fill="#0da559" /> {/* Scope 1 - Primary Green */}
                                    <Cell fill="#86efac" /> {/* Scope 2 - Pastel Green */}
                                    <Cell fill="#dcfce7" /> {/* Scope 3 - Lightest */}
                                </Pie>
                                <Legend
                                    layout="vertical"
                                    verticalAlign="bottom"
                                    align="center"
                                    iconType="circle"
                                    content={({ payload }) => (
                                        <div className="grid grid-cols-1 gap-1.5 mt-2 w-full">
                                            {payload?.map((entry: any, index: number) => (
                                                <div
                                                    key={index}
                                                    className={cn(
                                                        "flex items-center justify-between py-1 px-2 rounded-lg transition-all cursor-pointer w-full border",
                                                        pieActiveIndex === index
                                                            ? "bg-slate-50 border-slate-200 shadow-sm"
                                                            : "bg-transparent border-transparent hover:bg-slate-50"
                                                    )}
                                                    onMouseEnter={() => setPieActiveIndex(index)}
                                                    onClick={() => setPieActiveIndex(index)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></div>
                                                        <span className={cn(
                                                            "text-sm transition-colors",
                                                            pieActiveIndex === index ? "font-bold text-slate-900" : "font-medium text-slate-600"
                                                        )}>
                                                            {entry.name}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={cn(
                                                            "text-sm transition-colors", // Reduced to text-sm
                                                            pieActiveIndex === index ? "font-bold text-slate-900" : "font-semibold text-slate-700"
                                                        )}>
                                                            {(() => {
                                                                const val = Number(entry.value);
                                                                const total = Number(totalExposure);
                                                                if (Number.isFinite(val) && Number.isFinite(total) && total > 0) {
                                                                    return ((val / total) * 100).toFixed(0);
                                                                }
                                                                return [30, 20, 50][index]; // Fallback
                                                            })()}%
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-medium">{entry.value ? entry.value.toLocaleString() : ([75000, 50000, 125000][index]).toLocaleString()} tCO2eq</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Area Chart (Annual Trajectory) - Width 8/12 */}
                <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
                        <div>
                            <h3 className="text-slate-900 text-lg font-bold">연간 배출 추이 (Trajectory)</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-slate-500">실적 vs 목표 대비 성과</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-0.5 bg-[#10b77f] rounded-full"></div>
                                <span className="text-xs font-semibold text-slate-600">실적 (Actual)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-0.5 bg-slate-300 border border-slate-300 border-dashed"></div>
                                <span className="text-xs font-medium text-slate-400">목표 (Target)</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={sbtiAnalysis.trajectory} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b77f" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10b77f" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                <YAxis width={60} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip content={(props) => <CustomTooltip {...props} unit="tCO2eq" />} />

                                {/* Target Line (Simulated) */}
                                <Line
                                    type="monotone"
                                    dataKey="target"
                                    stroke="#cbd5e1"
                                    strokeDasharray="4 4"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={false}
                                />

                                {/* Actual Data Area */}
                                <Area
                                    type="monotone"
                                    dataKey="actual"
                                    stroke="#10b77f"
                                    fillOpacity={1}
                                    fill="url(#chartGradient)"
                                    strokeWidth={3}
                                />

                                {/* Reference Line for Current Year */}
                                <ReferenceLine x="2026" stroke="#10b77f" strokeDasharray="3 3">
                                    <Label value="현재 (2026)" position="top" fill="#10b77f" fontSize={10} fontWeight={700} />
                                </ReferenceLine>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
