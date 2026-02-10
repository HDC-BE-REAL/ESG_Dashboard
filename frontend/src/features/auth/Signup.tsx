import React, { useState } from 'react';
import { signup } from '../../services/authApi';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

interface SignupProps {
    onBack: () => void;
    onComplete: (companyName: string) => void;
}

export const Signup: React.FC<SignupProps> = ({ onBack, onComplete }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        company_name: ''
    });

    const [errors, setErrors] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        company_name: '',
        api: ''
    });

    const [isLoading, setIsLoading] = useState(false);

    // 비밀번호 요구사항 체크
    const passwordRequirements = {
        minLength: formData.password.length >= 8,
        hasUpperCase: /[A-Z]/.test(formData.password),
        hasLowerCase: /[a-z]/.test(formData.password),
        hasNumber: /[0-9]/.test(formData.password),
        noKorean: !/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(formData.password)
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // 한글 입력 차단 (이메일, 비밀번호)
        if (name === 'email' || name === 'password' || name === 'confirmPassword') {
            if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(value)) {
                return;
            }
        }

        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '', api: '' }));
    };

    const validateForm = (): boolean => {
        const newErrors = {
            email: '',
            password: '',
            confirmPassword: '',
            company_name: '',
            api: ''
        };

        // 이메일 검증
        if (!formData.email) {
            newErrors.email = '이메일을 입력해주세요.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = '올바른 이메일 형식이 아닙니다.';
        }

        // 비밀번호 검증
        if (!formData.password) {
            newErrors.password = '비밀번호를 입력해주세요.';
        } else if (!Object.values(passwordRequirements).every(Boolean)) {
            newErrors.password = '비밀번호 요구사항을 충족해주세요.';
        }

        // 비밀번호 확인 검증
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
        }

        // 회사명 검증
        if (!formData.company_name || formData.company_name.length < 2) {
            newErrors.company_name = '회사명은 최소 2자 이상이어야 합니다.';
        }

        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error !== '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            await signup({
                email: formData.email,
                password: formData.password,
                company_name: formData.company_name
            });

            // 회원가입 성공 시 환영 페이지로
            onComplete(formData.company_name);
        } catch (error) {
            setErrors(prev => ({
                ...prev,
                api: error instanceof Error ? error.message : '회원가입에 실패했습니다.'
            }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="page-section min-h-screen bg-gradient-to-br from-white via-slate-50 to-emerald-50/30 py-20 px-6 flex items-center justify-center">
            <div className="max-w-md w-full mx-auto bg-white rounded-3xl p-10 shadow-lg border border-gray-100">
                <h1 className="text-4xl font-black mb-2 text-slate-900">회원가입</h1>
                <p className="text-slate-500 mb-8 font-medium">Carbon Intelligence Platform에 가입하세요</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 회사명 */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            회사명 *
                        </label>
                        <input
                            type="text"
                            name="company_name"
                            value={formData.company_name}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 rounded-xl border ${errors.company_name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                } focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all`}
                            placeholder="회사명을 입력하세요"
                        />
                        {errors.company_name && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle size={14} /> {errors.company_name}
                            </p>
                        )}
                    </div>

                    {/* 이메일 */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            이메일 *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                } focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all`}
                            placeholder="email@company.com"
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle size={14} /> {errors.email}
                            </p>
                        )}
                    </div>

                    {/* 비밀번호 */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            비밀번호 *
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 rounded-xl border ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                } focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all`}
                            placeholder="8자 이상, 영문 대소문자, 숫자 포함"
                        />
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle size={14} /> {errors.password}
                            </p>
                        )}

                        {/* 비밀번호 요구사항 */}
                        {formData.password && (
                            <div className="mt-3 space-y-1 text-xs">
                                <RequirementItem met={passwordRequirements.minLength} text="8자 이상" />
                                <RequirementItem met={passwordRequirements.hasUpperCase} text="대문자 포함" />
                                <RequirementItem met={passwordRequirements.hasLowerCase} text="소문자 포함" />
                                <RequirementItem met={passwordRequirements.hasNumber} text="숫자 포함" />
                                <RequirementItem met={passwordRequirements.noKorean} text="한글 제외" />
                            </div>
                        )}
                    </div>

                    {/* 비밀번호 확인 */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            비밀번호 확인 *
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 rounded-xl border ${errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                } focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all`}
                            placeholder="비밀번호를 다시 입력하세요"
                        />
                        {errors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle size={14} /> {errors.confirmPassword}
                            </p>
                        )}
                    </div>

                    {/* API 에러 메시지 */}
                    {errors.api && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-sm text-red-600 flex items-center gap-2">
                                <AlertCircle size={16} /> {errors.api}
                            </p>
                        </div>
                    )}

                    {/* 버튼 */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex-1 h-12 border-2 border-gray-200 font-bold rounded-xl hover:border-emerald-700 hover:text-emerald-700 transition-colors"
                            disabled={isLoading}
                        >
                            돌아가기
                        </button>
                        <button
                            type="submit"
                            className="flex-1 h-12 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    처리 중...
                                </>
                            ) : (
                                '가입하기'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
};

// 비밀번호 요구사항 체크 아이템 컴포넌트
const RequirementItem: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
    <div className={`flex items-center gap-1.5 ${met ? 'text-emerald-600' : 'text-gray-400'}`}>
        <Check size={14} strokeWidth={3} />
        <span>{text}</span>
    </div>
);
