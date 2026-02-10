import React from 'react';
import { ArrowLeft, BarChart2 } from 'lucide-react';

interface AnalyticsProps {
    onBack: () => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({ onBack }) => {
    return (
        <section className="page-section min-h-screen bg-gray-50 flex flex-col">
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-8 bg-emerald-700 rounded-lg flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-xl">eco</span>
                        </div>
                        <h1 className="text-lg font-black italic">Be-REAL <span className="text-emerald-700 not-italic">ESG</span></h1>
                    </div>
                    <button onClick={onBack} className="text-sm font-bold text-gray-600 hover:text-emerald-700 flex items-center gap-1">
                        <ArrowLeft size={16} /> 돌아가기
                    </button>
                </div>
            </header>
            <main className="flex-grow flex flex-col items-center justify-center p-10 text-center">
                <div className="size-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                    <BarChart2 size={48} className="text-emerald-600" />
                </div>
                <h2 className="text-3xl font-black mb-2">분석 페이지 준비 중</h2>
                <p className="text-gray-500 max-w-md">더 깊이 있는 탄소 데이터 분석 기능을 준비하고 있습니다. 곧 업데이트될 예정입니다.</p>
            </main>
        </section>
    );
};
