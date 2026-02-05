import {
    BarChart3, TrendingUp, TrendingDown
} from 'lucide-react';
import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
    AreaChart, Area, CartesianGrid, XAxis, YAxis
} from 'recharts';
import { Card } from '../ui';

interface TrajectoryPoint {
    year: string;
    v: number;
}

interface DashboardTabProps {
    trajectory: TrajectoryPoint[];
}

export function DashboardTab({ trajectory }: DashboardTabProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">총 배출량 (S1+S2)</p>
                    <p className="text-3xl font-black">120,000 <span className="text-sm font-normal opacity-50">t</span></p>
                    <div className="mt-4 flex items-center gap-1 text-emerald-500 font-bold text-xs"><TrendingDown size={14} /> 전년비 4.2% 감소</div>
                </Card>
                <Card>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">탄소 집약도 (Revenue)</p>
                    <p className="text-3xl font-black">24.0</p>
                    <div className="mt-4 text-[10px] text-slate-400 font-bold">tCO2e / 매출 1억</div>
                </Card>
                <Card>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">무상 할당량</p>
                    <p className="text-3xl font-black text-blue-600">100,000 <span className="text-sm font-normal opacity-50 text-slate-900">t</span></p>
                    <div className="mt-4 text-[10px] text-slate-400 font-bold">전체 배출의 83% 커버</div>
                </Card>
                <Card variant="dark">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">현재 리스크 비용</p>
                    <p className="text-3xl font-black text-emerald-400">₩ 3.1 <span className="text-sm font-normal text-white">억</span></p>
                    <div className="mt-4 text-[10px] opacity-60 font-bold">K-ETS 현행가 기준</div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card padding="lg" className="rounded-[40px]">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-2"><BarChart3 size={20} className="text-emerald-500" /> Scope별 배출 기여도</h3>
                    <div className="h-[420px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={[{ name: 'S1', v: 75000 }, { name: 'S2', v: 45000 }, { name: 'S3', v: 120000 }]} dataKey="v" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                    <Cell fill="#1e293b" /><Cell fill="#10b981" /><Cell fill="#e2e8f0" />
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card padding="lg" className="rounded-[40px]">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-emerald-500" /> 연도별 배출 실적 추이</h3>
                    <div className="h-[420px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trajectory}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip />
                                <Area type="monotone" dataKey="v" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
}
