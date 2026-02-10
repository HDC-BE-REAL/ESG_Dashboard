import React, { useEffect, useState } from 'react';
import { Building2, TrendingDown, Globe, CheckCircle } from 'lucide-react';

interface WelcomePageProps {
    onContinue: () => void;
    companyName: string;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onContinue, companyName }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        setIsVisible(true);

        // 3초 후 자동으로 대시보드로 이동
        const autoRedirect = setTimeout(() => {
            handleContinue();
        }, 3000);

        return () => clearTimeout(autoRedirect);
    }, []);

    const handleContinue = () => {
        setIsFadingOut(true);
        setTimeout(() => {
            onContinue();
        }, 800);
    };

    return (
        <section
            className={`min-h-screen bg-gradient-to-br from-white via-slate-50 to-emerald-50/30 relative overflow-hidden flex flex-col items-center justify-center transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'} ${isFadingOut ? 'opacity-0 scale-95' : ''}`}
        >
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-20 right-10 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-10 w-80 h-80 bg-lime-100/20 rounded-full blur-3xl"></div>
            </div>

            <main className={`w-full max-w-4xl mx-auto px-6 z-10 py-12 flex flex-col items-center justify-center transition-all duration-700 ${isVisible ? 'translate-y-0' : 'translate-y-4'}`}>
                {/* Success Icon */}
                <div className="mb-8 relative">
                    <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl"></div>
                    <div className="relative bg-white rounded-full p-6 shadow-lg border-4 border-emerald-100">
                        <CheckCircle size={64} className="text-emerald-600" strokeWidth={2} />
                    </div>
                </div>

                {/* Welcome Message */}
                <div className="text-center mb-12">
                    <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight mb-4 text-slate-900">
                        환영합니다
                    </h1>
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Building2 size={28} className="text-emerald-600" />
                        <h2 className="font-display text-3xl md:text-4xl font-semibold text-slate-700 tracking-tight">
                            <span className="text-emerald-600">{companyName}</span>
                        </h2>
                    </div>
                    <p className="text-slate-500 text-lg md:text-xl font-medium tracking-wide mt-4">
                        Carbon Intelligence Platform에 성공적으로 로그인했습니다
                    </p>
                </div>

                {/* Quick Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mb-12">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm hover:shadow-md transition-all hover:scale-105 duration-300">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <Globe size={24} className="text-emerald-600" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">시스템 상태</h3>
                        </div>
                        <p className="text-2xl font-black text-emerald-600">정상</p>
                        <p className="text-xs text-slate-400 mt-1">All systems operational</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm hover:shadow-md transition-all hover:scale-105 duration-300">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <TrendingDown size={24} className="text-blue-600" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">최근 활동</h3>
                        </div>
                        <p className="text-2xl font-black text-slate-900">8.5%</p>
                        <p className="text-xs text-slate-400 mt-1">배출량 감소 (YTD)</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm hover:shadow-md transition-all hover:scale-105 duration-300">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <CheckCircle size={24} className="text-purple-600" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">목표 달성</h3>
                        </div>
                        <p className="text-2xl font-black text-purple-600">On Track</p>
                        <p className="text-xs text-slate-400 mt-1">SBTi 목표 진행 중</p>
                    </div>
                </div>

                {/* CTA Button */}
                <div className="flex flex-col items-center gap-6">
                    <button
                        onClick={handleContinue}
                        className="group px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-300"
                    >
                        <span className="flex items-center gap-2">
                            대시보드로 이동
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </span>
                    </button>
                    <p className="text-xs text-slate-400 font-medium tracking-wide">
                        자동으로 3초 후 이동합니다...
                    </p>
                </div>

                {/* Footer Nav */}
                <nav className="mt-20 flex flex-wrap gap-x-8 gap-y-2 text-xs font-medium text-slate-400 justify-center tracking-wide">
                    <a className="hover:text-slate-600 transition-colors" href="#">Privacy</a>
                    <a className="hover:text-slate-600 transition-colors" href="#">Terms</a>
                    <a className="hover:text-slate-600 transition-colors" href="#">Help</a>
                </nav>
            </main>
        </section>
    );
};
