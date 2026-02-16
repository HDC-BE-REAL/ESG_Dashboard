import React, { useEffect, useState } from 'react';

interface DropoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string) => void;
    email: string;
    loading?: boolean;
    error?: string | null;
}

export const DropoutModal: React.FC<DropoutModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    email,
    loading = false,
    error,
}) => {
    const [confirmEmail, setConfirmEmail] = useState('');
    const [password, setPassword] = useState('');
    const [acknowledged, setAcknowledged] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLightOff, setIsLightOff] = useState(false);

    const normalizedEmail = email.trim().toLowerCase();
    const isConfirmValid = confirmEmail.trim().toLowerCase() === normalizedEmail;

    useEffect(() => {
        if (isConfirmValid) {
            setIsLightOff(true);
        } else {
            setIsLightOff(false);
        }
    }, [isConfirmValid]);

    useEffect(() => {
        if (!isOpen) {
            setConfirmEmail('');
            setPassword('');
            setAcknowledged(false);
            setShowPassword(false);
            setIsLightOff(false);
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (isConfirmValid && password.trim() && acknowledged) {
            onConfirm(password.trim());
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`min-h-screen bg-white font-sans-kr flex pl-24 relative ${isLightOff ? 'light-off' : ''}`}>
            <style>{`
        @keyframes patrol {
          0% { left: 10px; transform: scaleX(1); }
          45% { left: 60px; transform: scaleX(1); }
          50% { left: 60px; transform: scaleX(-1); }
          95% { left: 10px; transform: scaleX(-1); }
          100% { left: 10px; transform: scaleX(1); }
        }

        .snow-leopard-walker {
          position: absolute;
          top: -24px;
          width: 32px;
          height: 32px;
          z-index: 60;
          animation: patrol 10s infinite linear;
          pointer-events: none;
        }

        .light-off .snow-leopard-walker {
          animation-play-state: paused !important;
          transition: transform 1s ease-out;
        }

        .light-off .snow-leopard-walker svg g {
          animation: none !important;
        }

        .light-off .snow-leopard-head {
          transform-origin: 20% 60%;
          transition: transform 1.5s ease-in-out;
          transform: rotate(25deg) translateY(2px);
        }

        .light-off .snow-leopard-walker svg {
          filter: grayscale(0.8) brightness(0.9);
          transition: filter 2s ease;
        }

        #sun-light {
          transition: opacity 3s ease-in-out, transform 4s ease-in-out;
        }

        .light-off #sun-light {
          opacity: 0;
          transform: translateY(100px);
        }

        #logo-glow {
          transition: opacity 2s ease-out;
        }

        .light-off #logo-glow {
          opacity: 0;
        }

        .light-off .logo-icon {
          color: #9CA3AF !important;
          transition: color 3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

            <div
                id="sun-light"
                className="fixed inset-0 h-[600px] bg-gradient-radial from-[#fffcf5] via-white to-white -z-10 pointer-events-none"
            ></div>

            <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-[2px] bg-black/5 animate-[fadeIn_0.3s_ease-out]">
                <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] border border-gray-100 transform transition-all scale-100 opacity-100 relative overflow-hidden">
                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 mb-2">정말 탈퇴하시겠습니까?</h2>

                        <p className="text-sm text-gray-500 leading-relaxed mb-6 px-4">
                            탈퇴 시 모든 활동 내역과 획득한<br />
                            멸종위기종 페르소나 데이터가 영구적으로 삭제됩니다.
                        </p>

                        <div className="w-full space-y-4">
                            <div className="text-left space-y-2 relative">
                                <label className="block text-xs font-medium text-gray-700 ml-1" htmlFor="confirm_email">
                                    확인용 이메일 입력
                                </label>
                                <input
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm outline-none"
                                    id="confirm_email"
                                    placeholder={email}
                                    type="email"
                                    value={confirmEmail}
                                    onChange={e => setConfirmEmail(e.target.value)}
                                />
                                {!isConfirmValid && confirmEmail.trim().length > 0 && (
                                    <p className="text-xs text-red-500 ml-1">이메일이 일치하지 않습니다.</p>
                                )}
                            </div>
                            <div className="text-left space-y-2">
                                <label className="block text-xs font-medium text-gray-700 ml-1" htmlFor="confirm_password">
                                    현재 비밀번호
                                </label>
                                <input
                                    className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm outline-none"
                                    id="confirm_password"
                                    placeholder="현재 비밀번호"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(prev => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>

                            <label className="flex items-start gap-2 text-xs text-gray-600">
                                <input
                                    type="checkbox"
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    checked={acknowledged}
                                    onChange={e => setAcknowledged(e.target.checked)}
                                />
                                <span>탈퇴 시 모든 데이터가 영구 삭제되며 복구할 수 없음을 이해했습니다.</span>
                            </label>

                            {error && <p className="text-sm text-red-500 text-left">{error}</p>}

                            <div className="flex gap-3 pt-2">
                                <button
                                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors duration-200"
                                    onClick={onClose}
                                    type="button"
                                >
                                    취소
                                </button>
                                <button
                                    className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-500 border border-transparent ${
                                        isConfirmValid && password.trim() && acknowledged
                                            ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30 cursor-pointer'
                                            : 'bg-red-600/10 text-red-600 cursor-not-allowed'
                                    }`}
                                    disabled={!isConfirmValid || !password.trim() || !acknowledged || loading}
                                    onClick={handleConfirm}
                                    type="button"
                                >
                                    {loading ? '처리 중...' : '탈퇴 확인'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <nav className="fixed left-0 top-0 h-full w-24 flex flex-col items-center py-8 z-50 bg-transparent pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-8 overflow-hidden">
                    <div className="snow-leopard-walker" title="지켜보고 있는 눈표범">
                        <svg className="w-full h-full drop-shadow-sm" fill="none" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                            <g className="animate-[bounce_1s_infinite] snow-leopard-body">
                                <path d="M8 18C8 18 10 14 16 14C22 14 24 18 24 18L26 22H6L8 18Z" fill="#F5F5F5" />
                                <circle cx="12" cy="16" fill="#A8A29E" r="1.5" />
                                <circle cx="18" cy="17" fill="#A8A29E" r="1.2" />
                                <circle cx="22" cy="16" fill="#A8A29E" r="1" />
                                <g className="snow-leopard-head">
                                    <circle cx="24" cy="14" fill="#F5F5F5" r="5" />
                                    <circle cx="23" cy="13" fill="#1F2937" r="0.5" />
                                    <circle cx="26" cy="13" fill="#1F2937" r="0.5" />
                                    <path d="M24.5 15L23.5 16H25.5L24.5 15Z" fill="#FCA5A5" />
                                    <path d="M21 10L23 12L20 13L21 10Z" fill="#F5F5F5" />
                                    <path d="M27 10L25 12L28 13L27 10Z" fill="#F5F5F5" />
                                </g>
                                <path d="M6 20C4 20 2 16 4 14C6 12 8 16 8 18" stroke="#F5F5F5" strokeLinecap="round" strokeWidth="3" />
                                <path d="M10 22V26" stroke="#F5F5F5" strokeLinecap="round" strokeWidth="2" />
                                <path d="M22 22V26" stroke="#F5F5F5" strokeLinecap="round" strokeWidth="2" />
                            </g>
                        </svg>
                    </div>
                </div>

                <div className="mt-6 p-3 text-[#61892F] bg-white/80 shadow-sm rounded-full relative backdrop-blur-sm">
                    <span className="material-symbols-outlined filled text-3xl logo-icon">eco</span>
                    <div id="logo-glow" className="absolute inset-0 rounded-full bg-[#A3D977]/40 blur-md -z-10 animate-pulse"></div>
                </div>
            </nav>
        </div>
    );
};
