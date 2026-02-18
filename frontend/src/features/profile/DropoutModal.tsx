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

    const normalizedEmail = email.trim().toLowerCase();
    const isConfirmValid = confirmEmail.trim().toLowerCase() === normalizedEmail;

    useEffect(() => {
        if (!isOpen) {
            setConfirmEmail('');
            setPassword('');
            setAcknowledged(false);
            setShowPassword(false);
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (!isConfirmValid || !password.trim() || !acknowledged || loading) return;
        onConfirm(password.trim());
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-[2px] bg-black/5">
            <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] border border-gray-100">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-2">{"\uC815\uB9D0 \uD0C8\uD1F4\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?"}</h2>
                    <p className="text-sm text-gray-500 leading-relaxed mb-6 px-4">
                        {"\uD0C8\uD1F4 \uC2DC \uBAA8\uB4E0 \uD65C\uB3D9 \uB0B4\uC5ED\uACFC \uD398\uB974\uC18C\uB098 \uB370\uC774\uD130\uAC00 \uC601\uAD6C\uC801\uC73C\uB85C \uC0AD\uC81C\uB429\uB2C8\uB2E4."}
                    </p>

                    <div className="w-full space-y-4 text-left">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="confirm_email">
                                {"\uD655\uC778\uC6A9 \uC774\uBA54\uC77C \uC785\uB825"}
                            </label>
                            <input
                                id="confirm_email"
                                type="email"
                                placeholder={email}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                value={confirmEmail}
                                onChange={(e) => setConfirmEmail(e.target.value)}
                            />
                            {confirmEmail.trim().length > 0 && !isConfirmValid && (
                                <p className="text-xs text-red-500 mt-1">{"\uC774\uBA54\uC77C\uC774 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="confirm_password">
                                {"\uD604\uC7AC \uBE44\uBC00\uBC88\uD638"}
                            </label>
                            <div className="relative">
                                <input
                                    id="confirm_password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={"\uD604\uC7AC \uBE44\uBC00\uBC88\uD638"}
                                    className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                                    aria-label={showPassword ? 'hide-password' : 'show-password'}
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <label className="flex items-start gap-2 text-xs text-gray-600">
                            <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                checked={acknowledged}
                                onChange={(e) => setAcknowledged(e.target.checked)}
                            />
                            <span>{"\uD0C8\uD1F4 \uC2DC \uBAA8\uB4E0 \uB370\uC774\uD130\uAC00 \uC601\uAD6C \uC0AD\uC81C\uB418\uBA70 \uBCF5\uAD6C\uD560 \uC218 \uC5C6\uC74C\uC744 \uC774\uD574\uD588\uC2B5\uB2C8\uB2E4."}</span>
                        </label>

                        {error && <p className="text-sm text-red-500">{error}</p>}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"
                            >
                                {"\uCDE8\uC18C"}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={!isConfirmValid || !password.trim() || !acknowledged || loading}
                                className="flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all border border-transparent bg-red-600 text-white disabled:bg-red-600/10 disabled:text-red-600"
                            >
                                {loading ? "\uCC98\uB9AC \uC911..." : "\uD0C8\uD1F4 \uD655\uC778"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
