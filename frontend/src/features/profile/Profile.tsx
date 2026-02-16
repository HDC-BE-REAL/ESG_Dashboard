import React, { useEffect, useState } from 'react';
import {
    fetchProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
    changeEmail,
    deleteAccount,
    UnauthorizedError,
} from '../../services/profileApi';
import type { ProfileResponse } from '../../services/profileApi';
import { removeToken } from '../../services/authApi';
import { DropoutModal } from './DropoutModal';

interface ProfileProps {
    onBack: () => void;
    onProfileUpdated?: (profile: ProfileResponse) => void;
}

const NICKNAME_PRESETS = ['위험한 물방개', '용감한 눈표범', 'ESG 탐험가', 'Green Pioneer'];

const classificationLabels: Record<string, string> = {
    mammal: '포유류 (Mammals)',
    bird: '조류 (Birds)',
    reptile: '파충류 (Reptiles)',
    amphibian: '양서류 (Amphibians)',
    fish: '어류 (Fish)',
    insect: '곤충 (Insects)',
    plant: '식물 (Plants)',
};

export const Profile: React.FC<ProfileProps> = ({ onBack, onProfileUpdated }) => {
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [form, setForm] = useState({
        nickname: '',
        company_name: '',
        classification: 'mammal',
        bio: '',
    });
    const [preview, setPreview] = useState<string | null>(null);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [emailForm, setEmailForm] = useState({ newEmail: '', currentPassword: '' });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
    const [emailSaving, setEmailSaving] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
    const [showEmailPassword, setShowEmailPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const [deleteSaving, setDeleteSaving] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const result = await fetchProfile();
                setProfile(result);
                onProfileUpdated?.(result);
                setForm({
                    nickname: result.nickname || '',
                    company_name: result.company_name || '',
                    classification: result.classification || 'mammal',
                    bio: result.bio || '',
                });
                setEmailForm(prev => ({ ...prev, newEmail: result.email }));
                setProfileError(null);
            } catch (err) {
                if (err instanceof UnauthorizedError) {
                    setProfileError(err.message);
                } else {
                    setProfileError(err instanceof Error ? err.message : '프로필을 불러오지 못했습니다.');
                }
                setProfile(null);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleChange = (name: keyof typeof form, value: string) => {
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleNicknameCycle = () => {
        const idx = NICKNAME_PRESETS.indexOf(form.nickname);
        const next = NICKNAME_PRESETS[(idx + 1) % NICKNAME_PRESETS.length];
        handleChange('nickname', next);
    };

    const handleAvatarUpload = async (file: File) => {
        try {
            setSaving(true);
            const updated = await uploadAvatar(file);
            setProfile(updated);
            onProfileUpdated?.(updated);
            setPreview(URL.createObjectURL(file));
            setProfileError(null);
        } catch (err) {
            setProfileError(err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const updated = await updateProfile(form);
            setProfile(updated);
            onProfileUpdated?.(updated);
            setProfileError(null);
            onBack();
        } catch (err) {
            setProfileError(err instanceof Error ? err.message : '프로필 업데이트에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleEmailUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError(null);
        setEmailSuccess(null);
        try {
            setEmailSaving(true);
            const updated = await changeEmail({
                new_email: emailForm.newEmail,
                current_password: emailForm.currentPassword,
            });
            setProfile(updated);
            onProfileUpdated?.(updated);
            setEmailSuccess('이메일이 변경되었습니다. 다시 로그인하시면 새 이메일로 연결됩니다.');
            setEmailForm(prev => ({ ...prev, currentPassword: '' }));
        } catch (err) {
            setEmailError(err instanceof Error ? err.message : '이메일 변경에 실패했습니다.');
        } finally {
            setEmailSaving(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);
        if (passwordForm.newPassword.trim().length < 8) {
            setPasswordError('비밀번호는 8자 이상이어야 합니다.');
            return;
        }
        try {
            setPasswordSaving(true);
            await changePassword({
                current_password: passwordForm.currentPassword,
                new_password: passwordForm.newPassword,
            });
            setPasswordSuccess('비밀번호가 변경되었습니다. 다음 로그인부터 적용됩니다.');
            setPasswordForm({ currentPassword: '', newPassword: '' });
        } catch (err) {
            setPasswordError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.');
        } finally {
            setPasswordSaving(false);
        }
    };

    const handleDeleteAccount = async (password: string) => {
        setDeleteError(null);
        try {
            setDeleteSaving(true);
            await deleteAccount({ current_password: password });
            removeToken();
            window.location.href = '/';
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : '계정 탈퇴에 실패했습니다.');
        } finally {
            setDeleteSaving(false);
        }
    };

    if (loading) {
        return (
            <section className="min-h-screen flex items-center justify-center">
                <p className="text-slate-500">프로필을 불러오는 중...</p>
            </section>
        );
    }

    if (!profile) {
        return (
            <section className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
                <p className="text-slate-500">{profileError || '프로필 정보를 불러오지 못했습니다.'}</p>
                <div className="flex gap-3">
                    <button onClick={() => window.location.reload()} className="px-5 py-3 rounded-2xl bg-slate-900 text-white font-semibold">다시 시도</button>
                    <button
                        onClick={() => {
                            removeToken();
                            window.location.href = '/';
                        }}
                        className="px-5 py-3 rounded-2xl border border-slate-300 text-slate-600"
                    >
                        다시 로그인
                    </button>
                </div>
                <button onClick={onBack} className="text-slate-400 underline">대시보드로 돌아가기</button>
            </section>
        );
    }

    return (
        <section className="min-h-screen bg-white font-sans-kr px-6 py-10">
            <div className="fixed inset-0 h-[520px] bg-gradient-radial from-[#fffcf5] via-white to-white -z-10 pointer-events-none"></div>

            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">계정 및 페르소나</h1>
                        <p className="text-slate-500 mt-1">ESG 활동을 위한 멸종위기종 정체성과 계정 정보를 관리하세요.</p>
                    </div>
                    <button onClick={onBack} className="text-slate-500 hover:text-slate-900">대시보드로 돌아가기</button>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
                    <div className="bg-white/70 backdrop-blur-sm border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-shadow">
                        <div className="mb-6 pb-4 border-b border-slate-100">
                            <h2 className="text-xl font-semibold text-slate-900">멸종위기종 정체성</h2>
                            <p className="text-sm text-slate-500 mt-1">환경 보호 활동을 대변하는 페르소나</p>
                        </div>

                        <div className="flex flex-col items-center mb-8">
                            <div className="w-40 h-40 mb-5 relative group">
                                <div className="absolute inset-0 bg-slate-50 rounded-full shadow-inner"></div>
                                <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center border-[6px] border-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                                    {preview || profile.profile_image_url ? (
                                        <img
                                            alt="프로필 이미지"
                                            className="w-full h-full object-cover"
                                            src={preview || profile.profile_image_url!}
                                        />
                                    ) : (
                                        <span className="material-symbols-outlined text-6xl text-emerald-600">eco</span>
                                    )}
                                </div>
                                <label className="absolute bottom-1 right-1 bg-white p-2.5 rounded-full shadow-md text-[#1a2e22] border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                                    <span className="material-symbols-outlined text-lg">photo_camera</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) handleAvatarUpload(file);
                                        }}
                                    />
                                </label>
                            </div>

                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <h3 className="text-2xl font-semibold text-slate-900">{form.nickname || '눈표범'}</h3>
                                    <span className="material-symbols-outlined text-red-500 filled text-xl">error</span>
                                </div>
                                <span className="inline-block px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full border border-red-100">
                                    Critically Endangered
                                </span>
                                <p className="text-sm text-slate-500 mt-3">{profile.email}</p>
                            </div>
                        </div>

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-600 pl-1" htmlFor="nickname">
                                    표시되는 이름
                                </label>
                                <div className="relative flex items-center">
                                    <input
                                        className="block w-full py-3 px-4 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                        id="nickname"
                                        name="nickname"
                                        type="text"
                                        value={form.nickname}
                                        onChange={e => handleChange('nickname', e.target.value)}
                                    />
                                    <button
                                        className="absolute right-3 p-1.5 text-slate-400 hover:text-emerald-600 transition-colors hover:bg-slate-100 rounded-full"
                                        title="랜덤 생성"
                                        type="button"
                                        onClick={handleNicknameCycle}
                                    >
                                        <span className="material-symbols-outlined text-xl">autorenew</span>
                                    </button>
                                </div>
                                <p className="text-xs text-emerald-700 pl-1 mt-1.5 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                    활동 데이터에 따라 닉네임이 진화합니다
                                </p>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-600 pl-1" htmlFor="classification">
                                    종 분류 변경
                                </label>
                                <div className="relative">
                                    <select
                                        className="block w-full py-3 px-4 bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
                                        id="classification"
                                        name="classification"
                                        value={form.classification}
                                        onChange={e => handleChange('classification', e.target.value)}
                                    >
                                        {Object.entries(classificationLabels).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                        <span className="material-symbols-outlined">expand_more</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-600 pl-1" htmlFor="company_name">
                                    회사명
                                </label>
                                <input
                                    className="block w-full py-3 px-4 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    id="company_name"
                                    name="company_name"
                                    type="text"
                                    value={form.company_name}
                                    onChange={e => handleChange('company_name', e.target.value)}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-600 pl-1" htmlFor="bio">
                                    소개
                                </label>
                                <textarea
                                    className="block w-full py-3 px-4 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    id="bio"
                                    name="bio"
                                    rows={4}
                                    value={form.bio}
                                    onChange={e => handleChange('bio', e.target.value)}
                                    placeholder="ESG 미션, 관심 분야 등을 소개해주세요"
                                />
                            </div>

                            {profileError && <p className="text-sm text-red-600">{profileError}</p>}

                            <div className="pt-2 flex justify-end">
                                <button
                                    className="bg-[#1a2e22] hover:bg-[#14241b] text-white font-semibold py-2.5 px-6 rounded-xl shadow-sm hover:shadow transition-all"
                                    type="submit"
                                    disabled={saving}
                                >
                                    {saving ? '저장 중...' : '저장하기'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-shadow flex flex-col">
                        <div className="mb-6 pb-4 border-b border-slate-100">
                            <h2 className="text-xl font-semibold text-slate-900">개인정보 및 보안</h2>
                            <p className="text-sm text-slate-500 mt-1">로그인 및 계정 보호를 위한 설정</p>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                                        <span className="material-symbols-outlined">mail</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">이메일 주소</p>
                                        <p className="text-base font-semibold text-slate-900">{profile.email}</p>
                                    </div>
                                </div>
                                <form onSubmit={handleEmailUpdate} className="grid gap-3">
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                        value={emailForm.newEmail}
                                        onChange={e => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                                        placeholder="새 이메일"
                                        required
                                    />
                                    <div className="relative">
                                        <input
                                            type={showEmailPassword ? 'text' : 'password'}
                                            className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                            value={emailForm.currentPassword}
                                            onChange={e => setEmailForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                            placeholder="현재 비밀번호"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowEmailPassword(prev => !prev)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600"
                                            aria-label={showEmailPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                                        >
                                            <span className="material-symbols-outlined text-xl">
                                                {showEmailPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                    {emailError && <p className="text-sm text-red-500">{emailError}</p>}
                                    {emailSuccess && <p className="text-sm text-emerald-600">{emailSuccess}</p>}
                                    <button
                                        type="submit"
                                        className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-semibold hover:bg-slate-800 disabled:opacity-50"
                                        disabled={emailSaving}
                                    >
                                        {emailSaving ? '변경 중...' : '이메일 변경'}
                                    </button>
                                </form>
                            </div>

                            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                                        <span className="material-symbols-outlined">lock</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">비밀번호</p>
                                    </div>
                                </div>
                                <form onSubmit={handlePasswordUpdate} className="grid gap-3">
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                            value={passwordForm.currentPassword}
                                            onChange={e => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                            placeholder="현재 비밀번호"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(prev => !prev)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600"
                                            aria-label={showCurrentPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                                        >
                                            <span className="material-symbols-outlined text-xl">
                                                {showCurrentPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                            value={passwordForm.newPassword}
                                            onChange={e => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                            placeholder="새 비밀번호 (8자 이상)"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(prev => !prev)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600"
                                            aria-label={showNewPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                                        >
                                            <span className="material-symbols-outlined text-xl">
                                                {showNewPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                    {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
                                    {passwordSuccess && <p className="text-sm text-emerald-600">{passwordSuccess}</p>}
                                    <button
                                        type="submit"
                                        className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50"
                                        disabled={passwordSaving}
                                    >
                                        {passwordSaving ? '변경 중...' : '비밀번호 변경'}
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(true)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 hover:underline transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">block</span>
                                서비스 해지 및 탈퇴
                            </button>
                        </div>
                    </div>
                </main>
            </div>

            <DropoutModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteAccount}
                email={profile.email}
                loading={deleteSaving}
                error={deleteError}
            />
        </section>
    );
};
