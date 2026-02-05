import { Target, Flag, CheckCircle2, Activity, AlertCircle, Scale } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, Badge } from '../ui';

export function TargetTab() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-slate-800 mb-2">SBTi Target Management</h2>
                <p className="text-slate-500 text-sm">기업 탄소 감축 목표 및 진행 현황 관리</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Target Setting Card */}
                <Card padding="lg" className="rounded-[40px] space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Target size={20} className="text-emerald-500" />
                        <h3 className="text-lg font-black">감축 목표 설정</h3>
                    </div>
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-600 uppercase">Target 2030</span>
                                <Badge variant="success">Active</Badge>
                            </div>
                            <p className="text-3xl font-black text-emerald-600">-58%</p>
                            <p className="text-[10px] text-slate-400 mt-1">Scope 1/2 기준</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-600 uppercase">Target 2050</span>
                                <Badge variant="blue">Planned</Badge>
                            </div>
                            <p className="text-3xl font-black text-blue-600">Net Zero</p>
                            <p className="text-[10px] text-slate-400 mt-1">전 Scope 대상</p>
                        </div>
                    </div>
                </Card>

                {/* Progress Overview */}
                <Card padding="lg" className="lg:col-span-2 rounded-[40px]">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                        <Flag size={20} className="text-emerald-500" />
                        목표 달성 현황
                    </h3>
                    <div className="space-y-6">
                        <div className="p-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-3xl border border-emerald-100">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">현재 진행률</p>
                                    <p className="text-4xl font-black text-emerald-600">42.3%</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-500 uppercase">목표 대비</p>
                                    <p className="text-lg font-black text-slate-800">58% 중 24.5% 달성</p>
                                </div>
                            </div>
                            <div className="w-full bg-white/50 h-4 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700" style={{ width: '42.3%' }} />
                            </div>
                            <div className="flex justify-between mt-2 text-[10px] text-slate-400">
                                <span>2022 Baseline</span>
                                <span>현재</span>
                                <span>2030 Target</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-white border border-slate-100 rounded-2xl text-center">
                                <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2" />
                                <p className="text-xl font-black">3</p>
                                <p className="text-[10px] text-slate-400">완료 이니셔티브</p>
                            </div>
                            <div className="p-4 bg-white border border-slate-100 rounded-2xl text-center">
                                <Activity size={24} className="text-blue-500 mx-auto mb-2" />
                                <p className="text-xl font-black">5</p>
                                <p className="text-[10px] text-slate-400">진행중</p>
                            </div>
                            <div className="p-4 bg-white border border-slate-100 rounded-2xl text-center">
                                <AlertCircle size={24} className="text-orange-500 mx-auto mb-2" />
                                <p className="text-xl font-black">2</p>
                                <p className="text-[10px] text-slate-400">주의 필요</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Reduction Initiatives */}
            <Card padding="lg" className="rounded-[40px]">
                <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                    <Scale size={20} className="text-emerald-500" />
                    감축 이니셔티브 현황
                </h3>
                <div className="space-y-4">
                    {[
                        { name: '재생에너지 조달 확대', target: '30,000t', progress: 85, status: 'on-track' },
                        { name: '공정 효율화 프로젝트', target: '15,000t', progress: 62, status: 'on-track' },
                        { name: '전기차 전환', target: '5,000t', progress: 45, status: 'delayed' },
                        { name: 'LED 조명 교체', target: '2,000t', progress: 100, status: 'completed' },
                    ].map((item, idx) => (
                        <div key={idx} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm",
                                item.status === 'completed' ? 'bg-emerald-500' :
                                    item.status === 'on-track' ? 'bg-blue-500' : 'bg-orange-500'
                            )}>
                                {idx + 1}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold">{item.name}</span>
                                    <span className="text-xs text-slate-400">{item.target} 목표</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className={cn("h-full rounded-full transition-all duration-500",
                                        item.status === 'completed' ? 'bg-emerald-500' :
                                            item.status === 'on-track' ? 'bg-blue-500' : 'bg-orange-500'
                                    )} style={{ width: `${item.progress}%` }} />
                                </div>
                            </div>
                            <span className={cn("text-sm font-black",
                                item.status === 'completed' ? 'text-emerald-500' :
                                    item.status === 'on-track' ? 'text-blue-500' : 'text-orange-500'
                            )}>{item.progress}%</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
