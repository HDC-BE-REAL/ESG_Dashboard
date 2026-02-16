import React, { useState } from 'react';
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
        <section id="page-login" className="page-section active min-h-screen bg-white relative overflow-hidden flex flex-col items-center pt-64 border-b-4 border-gray-100">
            <div className={`fixed inset-0 pointer-events-none z-0 w-full h-full bg-white transition-opacity duration-1000 ease-in-out ${isFadingOut ? 'opacity-0' : 'opacity-100'}`} id="bg-layer">
                <div className="ambient-warmth"></div>
            </div>

            <div className={`mb-14 text-center transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] ${isFadingOut ? 'opacity-50 grayscale scale-95' : 'opacity-100'}`} id="logo-container">
                <h1 className="font-display text-6xl md:text-7xl font-medium tracking-tight mb-3 flex items-baseline justify-center relative">
                    <span className="text-[#334155] mr-2 relative z-20">
                        Be-REA<span className="relative">L
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-[-1] pointer-events-none flex items-center justify-center">
                                <div className="w-32 h-32 rounded-full sun-ethereal animate-sun-rise"></div>
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
                <p className="text-slate-500 font-medium tracking-wide text-lg">Carbon Intelligence Platform</p>
            </div>

            <div className={`w-full max-w-md px-6 transition-all duration-1000 ${isFadingOut ? 'opacity-0 scale-95' : 'opacity-100'}`}>
                <form onSubmit={handleLogin} className="space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-100 shadow-sm">
                    <div>
                        <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
                            이메일
                        </label>
                        <input
                            type="text"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                            placeholder="email@company.com 또는 admin"
                            disabled={isLoggingIn}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">
                            비밀번호
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
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
                        <p className="text-sm text-slate-500">
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
