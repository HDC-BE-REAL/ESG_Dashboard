import React, { useState, useRef, useCallback } from 'react';
import { login, saveToken } from '../../services/authApi';
import { AlertCircle, Loader2 } from 'lucide-react';

interface LoginProps {
    onLogin: (companyName: string) => void;
    onSignup: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onSignup }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState('');
    const [isFadingOut, setIsFadingOut] = useState(false);

    // 🌙 다크모드 이스터에그: 해를 정지 구간(5~10초)에 3번 클릭하면 활성화
    const sunClickCount = useRef(0);
    const sunClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [sunActivated, setSunActivated] = useState(false);

    // 애니메이션 타이밍 상수 (sun-rise: 15초 주기, 33.3%~66.6% 구간이 정지)
    const SUN_CYCLE_MS = 15000;
    const PAUSE_START = 0.333;
    const PAUSE_END = 0.666;

    const handleSunClick = useCallback(() => {
        // ① 현재 애니메이션 진행률 계산 (0.0 ~ 1.0)
        const progress = (Date.now() % SUN_CYCLE_MS) / SUN_CYCLE_MS;

        // ② 해가 정지 구간(5~10초)에 있는지 판단
        const isSunAtTop = progress >= PAUSE_START && progress <= PAUSE_END;

        // ③ 정지 구간이 아니면 카운트 초기화 후 종료
        if (!isSunAtTop) {
            sunClickCount.current = 0;
            if (sunClickTimer.current) clearTimeout(sunClickTimer.current);
            return;
        }

        // ④ 정지 구간이면 클릭 카운트 +1
        sunClickCount.current += 1;

        // ⑤ 클릭 시각 피드백: 300ms 동안 해가 밝아지고 커짐
        setSunActivated(true);
        setTimeout(() => setSunActivated(false), 300);

        // ⑥ 3초 타이머 리셋 (3초 이내에 3번을 완성하지 못하면 카운트 초기화)
        if (sunClickTimer.current) clearTimeout(sunClickTimer.current);
        sunClickTimer.current = setTimeout(() => {
            sunClickCount.current = 0;
        }, 3000);

        // ⑦ 3번째 클릭이면 다크모드 토글
        if (sunClickCount.current >= 3) {
            sunClickCount.current = 0;
            if (sunClickTimer.current) clearTimeout(sunClickTimer.current);

            const html = document.documentElement;
            if (html.classList.contains('dark')) {
                html.classList.remove('dark');
                setIsDarkMode(false);
            } else {
                html.classList.add('dark');
                setIsDarkMode(true);
            }
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(value)) {
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email.trim() || !formData.password.trim()) {
            setError('이메일과 비밀번호를 입력해주세요.');
            return;
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('올바른 이메일 형식을 입력해주세요.');
            return;
        }

        setIsLoggingIn(true);
        setError('');

        try {
            const response = await login({
                email: formData.email,
                password: formData.password
            });

            saveToken(response.access_token);

            setIsFadingOut(true);

            setTimeout(() => {
                onLogin('사용자');
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
            setIsLoggingIn(false);
        }
    };

    return (
        <section
            id="page-login"
            className={`page-section active min-h-screen relative overflow-hidden flex flex-col items-center pt-64 border-b-4 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100'}`}
        >
            {/* 다크모드 활성화 토스트 메시지 */}
            {isDarkMode && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50
                    px-5 py-2.5 bg-slate-700 text-slate-100 text-sm font-bold
                    rounded-full shadow-xl border border-slate-600
                    flex items-center gap-2 animate-[fadeIn_0.4s_ease-out]">
                    🌙 다크모드 활성화! 해를 3번 더 클릭하면 해제됩니다.
                </div>
            )}

            <div className={`fixed inset-0 pointer-events-none z-0 w-full h-full transition-opacity duration-1000 ease-in-out ${isDarkMode ? 'bg-slate-900' : 'bg-white'} ${isFadingOut ? 'opacity-0' : 'opacity-100'}`} id="bg-layer">
                <div className="ambient-warmth"></div>
            </div>

            <div className={`mb-14 text-center transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] ${isFadingOut ? 'opacity-50 grayscale scale-95' : 'opacity-100'}`} id="logo-container">
                <h1 className="font-display text-6xl md:text-7xl font-medium tracking-tight mb-3 flex items-baseline justify-center relative">
                    <span className={`mr-2 relative z-20 ${isDarkMode ? 'text-slate-100' : 'text-[#334155]'}`}>
                        Be-REA<span className="relative">L
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-[-1] pointer-events-none flex items-center justify-center">
                                {/* 🌙 이스터에그: 해 아이콘에 클릭 핸들러 연결 */}
                                <div
                                    onClick={handleSunClick}
                                    className={`
                                        w-32 h-32 rounded-full
                                        sun-ethereal animate-sun-rise
                                        cursor-pointer select-none
                                        transition-all duration-150
                                        ${sunActivated ? 'brightness-150 scale-110' : ''}
                                    `}
                                    title="☀️"
                                />
                            </div>
                        </span>
                    </span>
                    <div className="relative flex items-end gap-1 ml-2 h-[1.1em] leading-none">
                        <div className="relative flex flex-col justify-end w-[0.7em] animate-vine-grow-e origin-bottom opacity-0 h-full">
                            <span className="font-bold text-[#84cc16] text-6xl md:text-7xl leading-none animate-esg-pulse-glow">E</span>
                            <svg className="absolute -right-4 top-2 w-6 h-6 animate-leaf-unfold z-20 text-[#84cc16] fill-current" style={{ animationDelay: '3.2s' }} viewBox="0 0 24 24">
                                <path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20C19,20,22,3,22,3Z"></path>
                            </svg>
                        </div>
                        <div className="relative flex flex-col justify-end w-[0.7em] animate-vine-grow-s origin-bottom opacity-0 h-full">
                            <span className="font-bold text-[#84cc16] text-6xl md:text-7xl leading-none animate-esg-pulse-glow">S</span>
                            <svg className="absolute -left-4 top-4 w-5 h-5 animate-leaf-unfold z-20 text-[#65a30d] fill-current transform -scale-x-100" style={{ animationDelay: '3.5s' }} viewBox="0 0 24 24">
                                <path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20C19,20,22,3,22,3Z"></path>
                            </svg>
                        </div>
                        <div className="relative flex flex-col justify-end w-[0.8em] animate-vine-grow-g origin-bottom opacity-0 h-full">
                            <span className="font-bold text-[#84cc16] text-6xl md:text-7xl leading-none animate-esg-pulse-glow">G</span>
                            <svg className="absolute -right-3 -top-2 w-7 h-7 animate-leaf-unfold z-20 text-[#4d7c0f] fill-current rotate-45" style={{ animationDelay: '3.8s' }} viewBox="0 0 24 24">
                                <path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20C19,20,22,3,22,3Z"></path>
                            </svg>
                        </div>
                    </div>
                </h1>
                <p className={`font-medium tracking-wide text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Carbon Intelligence Platform</p>
            </div>

            <div className={`w-full max-w-md px-6 transition-all duration-1000 ${isFadingOut ? 'opacity-0 scale-95' : 'opacity-100'}`}>
                <form onSubmit={handleLogin} className={`space-y-6 backdrop-blur-sm p-8 rounded-2xl shadow-sm border ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-slate-100'}`}>
                    <div>
                        <label htmlFor="email" className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            이메일
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 rounded-xl border transition-all ${isDarkMode
                                ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-800'
                                : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                                }`}
                            placeholder="email@company.com"
                            disabled={isLoggingIn}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            비밀번호
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 rounded-xl border transition-all ${isDarkMode
                                ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-800'
                                : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                                }`}
                            placeholder="비밀번호를 입력하세요"
                            disabled={isLoggingIn}
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-sm text-red-600 flex items-center gap-2">
                                <AlertCircle size={16} /> {error}
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full h-12 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        disabled={isLoggingIn}
                    >
                        {isLoggingIn ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                로그인 중...
                            </>
                        ) : (
                            '로그인'
                        )}
                    </button>

                    <div className="text-center pt-4">
                        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            계정이 없으신가요?{' '}
                            <button
                                type="button"
                                onClick={onSignup}
                                className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors"
                                disabled={isLoggingIn}
                            >
                                회원가입
                            </button>
                        </p>
                    </div>
                </form>
            </div>
        </section>
    );
};
