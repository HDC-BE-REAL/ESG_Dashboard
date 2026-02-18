import React from 'react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Line, Area, ReferenceLine, Label, Tooltip } from 'recharts';
import { chartColors } from '../styles';
import { cn } from '../../../components/ui/utils';

interface TrendChartProps {
    trajectory: Array<{
        year: string;
        actual: number | null;
        forecast: number | null;
    }>;
    activeScopes: { s1: boolean; s2: boolean; s3: boolean };
    setActiveScopes: React.Dispatch<React.SetStateAction<{ s1: boolean; s2: boolean; s3: boolean }>>;
}

const TrendChartTooltip = ({ active, payload, label }: any) => {
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
                        <span className="text-slate-500 font-medium capitalize">{entry.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 font-mono">
                        {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value} tCO2eq
                    </span>
                </div>
            ))}
        </div>
    );
};

export const TrendChart: React.FC<TrendChartProps> = ({ trajectory, activeScopes, setActiveScopes }) => {
    return (
        <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
                <div>
                    <h3 className="text-slate-900 text-lg font-bold">연간 배출 추이 (Trajectory)</h3>
                    <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-slate-500">연도별 배출량 실적</span>
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
                <div className="flex items-center gap-4 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-[#10b77f] rounded-full"></div>
                        <span className="text-xs font-semibold text-slate-600">실적</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="#10b77f" strokeWidth="2" strokeDasharray="4 2"/></svg>
                        <span className="text-xs font-semibold text-slate-400">회귀 예측</span>
                    </div>
                </div>
            </div>
            <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trajectory} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.2} />
                                <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="year"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            width={65}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                            tickCount={8}
                            domain={[(dataMin: number) => Math.floor(dataMin * 0.75), (dataMax: number) => Math.ceil(dataMax * 1.05)]}
                            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}
                        />
                        <Tooltip content={<TrendChartTooltip />} />

                        {/* 실적 (Actual) */}
                        <Area
                            type="monotone"
                            dataKey="actual"
                            stroke={chartColors.primary}
                            fillOpacity={1}
                            fill="url(#chartGradient)"
                            strokeWidth={3}
                            dot={false}
                            isAnimationActive={true}
                            animationDuration={1000}
                            animationEasing="ease-out"
                            connectNulls={false}
                        />
                        {/* CAGR 예측 (Forecast) */}
                        <Line
                            type="monotone"
                            dataKey="forecast"
                            stroke={chartColors.primary}
                            strokeWidth={2}
                            strokeDasharray="6 3"
                            dot={false}
                            isAnimationActive={false}
                            connectNulls={false}
                        />

                        {/* Reference Line for Current Year */}
                        <ReferenceLine x="2026" stroke={chartColors.primary} strokeDasharray="3 3">
                            <Label value="현재 (2026)" position="top" fill={chartColors.primary} fontSize={10} fontWeight={700} />
                        </ReferenceLine>
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
