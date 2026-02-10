import React, { useState } from 'react';
import { ArrowLeft, Flame, Zap, Globe } from 'lucide-react';

interface DataInputProps {
    onBack: () => void;
}

export const DataInput: React.FC<DataInputProps> = ({ onBack }) => {
    return (
        <section className="page-section min-h-screen bg-gray-50 flex flex-col">
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-8 bg-emerald-700 rounded-lg flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-xl">eco</span>
                        </div>
                        <h1 className="text-lg font-black italic">Be-REAL <span className="text-emerald-700 not-italic">ESG</span>
                        </h1>
                    </div>

                    <button onClick={onBack}
                        className="text-sm font-bold text-gray-600 hover:text-emerald-700 flex items-center gap-1">
                        <ArrowLeft size={16} /> 돌아가기
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10 w-full">
                <div className="mb-10">
                    <h2 className="text-4xl font-black">데이터 입력</h2>
                    <p className="text-gray-500 mt-2">탄소 배출 데이터를 입력하고 관리하세요</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Scope 1 Input */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                            <div className="p-2 bg-red-50 rounded-xl">
                                <Flame className="text-red-500" size={24} />
                            </div>
                            Scope 1 - 직접 배출
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">연료 사용량 (L)</label>
                                <input type="number" placeholder="0"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">천연가스 (m³)</label>
                                <input type="number" placeholder="0"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
                            </div>
                            <div className="bg-red-50 p-4 rounded-xl">
                                <p className="text-xs font-bold text-red-600">예상 배출량</p>
                                <p className="text-2xl font-black text-red-700 mt-1">0 tCO2e</p>
                            </div>
                        </div>
                    </div>

                    {/* Scope 2 Input */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                            <div className="p-2 bg-yellow-50 rounded-xl">
                                <Zap className="text-yellow-500" size={24} />
                            </div>
                            Scope 2 - 간접 배출
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">전력 사용량 (kWh)</label>
                                <input type="number" placeholder="0"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">증기 사용량 (ton)</label>
                                <input type="number" placeholder="0"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-xl">
                                <p className="text-xs font-bold text-yellow-600">예상 배출량</p>
                                <p className="text-2xl font-black text-yellow-700 mt-1">0 tCO2e</p>
                            </div>
                        </div>
                    </div>

                    {/* Scope 3 Input */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-xl">
                                <Globe className="text-blue-500" size={24} />
                            </div>
                            Scope 3 - 기타 간접 배출
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">출장 (km)</label>
                                <input type="number" placeholder="0"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">물류 운송 (ton·km)</label>
                                <input type="number" placeholder="0"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">폐기물 처리 (kg)</label>
                                <input type="number" placeholder="0"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
                            </div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl mt-6">
                            <p className="text-xs font-bold text-blue-600">예상 배출량</p>
                            <p className="text-2xl font-black text-blue-700 mt-1">0 tCO2e</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-4">
                    <button
                        className="flex-1 h-14 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition-colors shadow-lg shadow-emerald-700/20">저장하기</button>
                    <button
                        className="px-8 h-14 border-2 border-gray-200 font-bold rounded-xl hover:border-emerald-700 hover:text-emerald-700 transition-colors bg-white">임시저장</button>
                </div>
            </main>
        </section>
    );
};
