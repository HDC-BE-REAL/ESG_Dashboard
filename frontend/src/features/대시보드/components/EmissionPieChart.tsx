import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Sector } from 'recharts';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '../../../components/ui/utils';
import { dashboardStyles, chartColors } from '../styles';
import type { Competitor } from '../../../types';

interface EmissionPieChartProps {
    selectedComp: Competitor;
}

// 3D Active Shape for Pie Chart
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
                outerRadius={outerRadius + 8}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                style={{ filter: "drop-shadow(0px 8px 8px rgba(0,0,0,0.25))" }}
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

export const EmissionPieChart: React.FC<EmissionPieChartProps> = ({ selectedComp }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const pieData = [
        { name: 'Scope 1', value: selectedComp.s1 || 0, color: chartColors.scope1 },
        { name: 'Scope 2', value: selectedComp.s2 || 0, color: chartColors.scope2 },
        { name: 'Scope 3', value: selectedComp.s3 || 0, color: chartColors.scope3 }
    ];

    const totalExposure = (selectedComp.s1 || 0) + (selectedComp.s2 || 0) + (selectedComp.s3 || 0);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    return (
        <div className="lg:col-span-4 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-slate-900 text-lg font-bold">Scope별 배출 기여도</h3>
                <button className="text-slate-400 hover:text-[#10b77f] transition-colors">
                    <MoreHorizontal size={20} />
                </button>
            </div>
            <div className="w-full h-[400px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            {...{ activeIndex } as any}
                            activeShape={renderActiveShape}
                            data={pieData}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={2}
                            cornerRadius={6}
                            onMouseEnter={onPieEnter}
                        >
                            <Cell fill={chartColors.scope1} />
                            <Cell fill={chartColors.scope2} />
                            <Cell fill={chartColors.scope3} />
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
                                                activeIndex === index
                                                    ? "bg-slate-50 border-slate-200 shadow-sm"
                                                    : "bg-transparent border-transparent hover:bg-slate-50"
                                            )}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            onClick={() => setActiveIndex(index)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></div>
                                                <span className={cn(
                                                    "text-sm transition-colors",
                                                    activeIndex === index ? "font-bold text-slate-900" : "font-medium text-slate-600"
                                                )}>
                                                    {entry.name}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <div className={cn(
                                                    "text-sm transition-colors",
                                                    activeIndex === index ? "font-bold text-slate-900" : "font-semibold text-slate-700"
                                                )}>
                                                    {(() => {
                                                        const val = Number(entry.value);
                                                        const total = Number(totalExposure);
                                                        if (Number.isFinite(val) && Number.isFinite(total) && total > 0) {
                                                            return ((val / total) * 100).toFixed(0);
                                                        }
                                                        return [30, 20, 50][index];
                                                    })()}%
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-medium">
                                                    {entry.value ? entry.value.toLocaleString() : ([75000, 50000, 125000][index]).toLocaleString()} tCO2eq
                                                </div>
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
    );
};
