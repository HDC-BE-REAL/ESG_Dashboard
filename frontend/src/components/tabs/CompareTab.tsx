import { Filter, BarChart4, Award } from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, CartesianGrid, ReferenceLine, Cell
} from 'recharts';
import { cn } from '../../lib/utils';
import { Card, Badge } from '../ui';

type IntensityType = 'revenue' | 'production';

interface Competitor {
    id: number;
    name: string;
    intensityValue: number;
}

interface CompareTabProps {
    intensityType: IntensityType;
    setIntensityType: (type: IntensityType) => void;
    chartData: Competitor[];
    topThreshold: number;
    medianThreshold: number;
    myRank: number;
    selectedCompId: number;
    setSelectedCompId: (id: number) => void;
    activeScopes: { s1: boolean; s2: boolean; s3: boolean };
    setActiveScopes: React.Dispatch<React.SetStateAction<{ s1: boolean; s2: boolean; s3: boolean }>>;
}

export function CompareTab({
    intensityType,
    setIntensityType,
    chartData,
    topThreshold,
    medianThreshold,
    myRank,
    selectedCompId,
    setSelectedCompId,
    activeScopes,
    setActiveScopes,
}: CompareTabProps) {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Top Controls Section */}
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <Card variant="glass" padding="lg" className="lg:col-span-1 space-y-8 min-h-[320px] backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="grad-purple p-2 rounded-xl text-white shadow-lg"><Filter size={18} /></div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Comparison Filter</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="p-1 bg-slate-100/50 rounded-2xl border border-white/50 flex relative">
                            <button onClick={() => setIntensityType('revenue')} className={cn("flex-1 py-3 text-[10px] font-black rounded-xl transition-all duration-300 relative z-10", intensityType === 'revenue' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400 hover:text-slate-600')}>REVENUE</button>
                            <button onClick={() => setIntensityType('production')} className={cn("flex-1 py-3 text-[10px] font-black rounded-xl transition-all duration-300 relative z-10", intensityType === 'production' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400 hover:text-slate-600')}>PRODUCTION</button>
                        </div>

                        <div className="p-6 bg-slate-900 rounded-[32px] text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            <span className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-wider relative z-10">Industry Rank</span>
                            <div className="flex items-end gap-3 mb-4 relative z-10">
                                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">{myRank}</span>
                                <span className="text-sm font-bold text-slate-500 pb-2">/ {chartData.length}</span>
                            </div>
                            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden mb-4 relative z-10">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${100 - (myRank / chartData.length * 100)}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-slate-300 leading-relaxed font-medium relative z-10">
                                {myRank <= 3 ? '🏆 Maintaining top-tier efficiency in the industry.' :
                                    myRank <= chartData.length / 2 ? '📈 Performance is above the industry average.' :
                                        '⚠️ Efficiency improvement is required.'}
                            </p>
                        </div>

                        <div className="flex items-center gap-3 px-2">
                            <span className="text-[10px] font-bold text-slate-400">Current Metric:</span>
                            <Badge variant={intensityType === 'revenue' ? 'success' : 'blue'} className="shadow-none">
                                {intensityType === 'revenue' ? 'Revenue Intensity' : 'Production Intensity'}
                            </Badge>
                        </div>
                    </div>
                </Card>

                <Card variant="glass" padding="xl" className="lg:col-span-3 border-none shadow-2xl shadow-blue-500/5 backdrop-blur-xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="grad-emerald p-2 rounded-xl text-white shadow-lg"><BarChart4 size={20} /></div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Efficiency Benchmarking</h3>
                            </div>

                            {/* Scope Toggle Buttons - Restored & Styled */}
                            <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100 w-fit">
                                {(['s1', 's2', 's3'] as const).map((scope) => (
                                    <button
                                        key={scope}
                                        onClick={() => setActiveScopes(prev => ({ ...prev, [scope]: !prev[scope] }))}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[10px] font-black transition-all duration-300 flex items-center gap-2",
                                            activeScopes[scope]
                                                ? "bg-slate-900 text-white shadow-lg transform scale-105"
                                                : "bg-transparent text-slate-400 hover:bg-white hover:text-slate-600"
                                        )}
                                    >
                                        <span className={cn("w-1.5 h-1.5 rounded-full", activeScopes[scope] ? "bg-emerald-400" : "bg-slate-300")} />
                                        SCOPE {scope.replace('s', '')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-6 bg-white/50 p-4 rounded-3xl border border-slate-100 backdrop-blur-sm">
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Top 10%</p>
                                <p className="text-lg font-black text-emerald-500">{topThreshold}</p>
                            </div>
                            <div className="w-px bg-slate-200" />
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Median</p>
                                <p className="text-lg font-black text-slate-600">{medianThreshold}</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }} barSize={60}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} dy={20} />
                                <ReferenceLine y={topThreshold} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'right', value: 'Top 10%', fill: '#10b981', fontSize: 10, fontWeight: 800, dy: -10 }} />
                                <ReferenceLine y={medianThreshold} stroke="#94a3b8" strokeDasharray="5 5" label={{ position: 'right', value: 'Median', fill: '#94a3b8', fontSize: 10, fontWeight: 800, dy: -10 }} />
                                <Bar dataKey="intensityValue" radius={[16, 16, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={index}
                                            fill={entry.id === 1 ? 'url(#grad1)' : (entry.intensityValue <= topThreshold ? 'url(#grad2)' : '#f1f5f9')}
                                            className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                                        />
                                    ))}
                                </Bar>
                                <defs>
                                    <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#059669" />
                                    </linearGradient>
                                    <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#2563eb" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card variant="hoverable" padding="lg" className="lg:col-span-1 rounded-[32px] border-none shadow-xl shadow-slate-200/50">
                    <h3 className="text-md font-black mb-6 flex items-center gap-2 text-slate-800"><Award size={20} className="text-amber-500" /> Rank Leaderboard</h3>
                    <div className="space-y-3">
                        {chartData.map((comp, idx) => (
                            <div
                                key={comp.id}
                                onClick={() => setSelectedCompId(comp.id)}
                                className={cn(
                                    "p-4 rounded-2xl flex items-center justify-between border cursor-pointer transition-all duration-300 group",
                                    comp.id === selectedCompId
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-105'
                                        : 'bg-white border-slate-50 hover:border-emerald-100 hover:shadow-md'
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <span className={cn("text-xl font-black w-8 text-center", comp.id === selectedCompId ? "text-emerald-400" : "text-slate-200")}>{idx + 1}</span>
                                    <div>
                                        <p className={cn("text-sm font-bold leading-tight", comp.name === "우리 기업" && "text-emerald-500")}>{comp.name}</p>
                                        <p className={cn("text-[10px] uppercase tracking-wider mt-0.5", comp.id === selectedCompId ? "opacity-60" : "text-slate-400")}>Score: {comp.intensityValue.toFixed(1)}</p>
                                    </div>
                                </div>
                                {idx === 0 && <span className="grad-amber text-[8px] font-black px-2 py-1 rounded-lg text-white shadow-md transform group-hover:rotate-12 transition-transform">TOP</span>}
                            </div>
                        ))}
                    </div>
                </Card>

                <Card variant="dark" padding="xl" className="lg:col-span-2 rounded-[32px] shadow-2xl flex flex-col justify-center relative overflow-hidden bg-slate-900">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none" />
                    <div className="relative z-10">
                        <p className="text-2xl font-black leading-tight mb-6 text-white w-3/4">
                            You are currently in the top <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">{(myRank / chartData.length * 100).toFixed(0)}%</span> of industry efficiency.
                        </p>
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-sm font-medium leading-relaxed text-slate-300 backdrop-blur-md">
                            "The gap with Top Tier Company A mainly occurs in <span className="text-white font-bold">Scope 2 (Indirect Emissions)</span>. Expanding renewable energy procurement by 15%p could allow entry into the top tier."
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
