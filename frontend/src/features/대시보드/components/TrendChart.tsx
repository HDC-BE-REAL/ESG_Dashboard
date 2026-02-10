import React from 'react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Line, Area, ReferenceLine, Label, Tooltip } from 'recharts';
import { CustomTooltip } from '../../../components/ui/CustomTooltip';
import { chartColors } from '../styles';

interface TrendChartProps {
    trajectory: Array<{
        year: string;
        actual: number;
        target: number;
    }>;
}

export const TrendChart: React.FC<TrendChartProps> = ({ trajectory }) => {
    return (
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
                        <Tooltip content={(props) => <CustomTooltip {...props} unit="tCO2eq" />} />

                        {/* Target Line */}
                        <Line
                            type="monotone"
                            dataKey="target"
                            stroke="#cbd5e1"
                            strokeDasharray="4 4"
                            strokeWidth={2}
                            dot={false}
                            activeDot={false}
                            isAnimationActive={true}
                            animationDuration={1200}
                            animationEasing="ease-out"
                        />

                        {/* Actual Data Area */}
                        <Area
                            type="monotone"
                            dataKey="actual"
                            stroke={chartColors.primary}
                            fillOpacity={1}
                            fill="url(#chartGradient)"
                            strokeWidth={3}
                            isAnimationActive={true}
                            animationDuration={1000}
                            animationEasing="ease-out"
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
