import React, { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '../../config';
import type { ProfileResponse } from '../../services/profileApi';
import {
    changeEmail,
    changePassword,
    deleteAccount,
    fetchProfile,
    updateProfile,
    uploadAvatar
} from '../../services/profileApi';
import { removeToken } from '../../services/authApi';
import { DropoutModal } from './DropoutModal';
import defaultProfileImage from '../../assets/images/default-profile-leopard.jpg';

interface ProfileProps {
    onBack: () => void;
    onProfileUpdated: (profile: ProfileResponse | null) => void;
    onNavigate?: (view: string) => void;
    companies?: { id: number; name: string }[];
}

const normalizeError = (value: unknown, fallback: string) => {
    if (!value) return fallback;
    const text = value instanceof Error ? value.message : String(value);
    if (!/[가-힣]/.test(text) || /�/.test(text)) return fallback;
    return text;
};

export const Profile: React.FC<ProfileProps> = ({ onBack, onProfileUpdated, onNavigate, companies = [] }) => {
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [nickname, setNickname] = useState('');
    const [classification, setClassification] = useState('mammal');
    const [companyName, setCompanyName] = useState('');
    const [bio, setBio] = useState('');

    const [emailForm, setEmailForm] = useState({ email: '', currentPassword: '' });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showEmailPassword, setShowEmailPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const backendOrigin = useMemo(() => {
        try {
            return new URL(API_BASE_URL).origin;
        } catch {
            return 'http://localhost:8000';
        }
    }, []);

    const displayName = useMemo(() => {
        if (profile?.nickname) return profile.nickname;
        return nickname || '눈표범';
    }, [profile?.nickname, nickname]);

    const profileImageSrc = useMemo(() => {
        const imageUrl = profile?.profile_image_url;
        if (!imageUrl) return defaultProfileImage;
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
        if (imageUrl.startsWith('/')) return `${backendOrigin}${imageUrl}`;
        return `${backendOrigin}/${imageUrl}`;
    }, [backendOrigin, profile?.profile_image_url]);

    useEffect(() => {
        let isMounted = true;
        const loadProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await fetchProfile();
                if (!isMounted) return;
                setProfile(result);
                setNickname(result.nickname || '');
                setClassification(result.classification || 'mammal');
                setCompanyName(result.company_name || '');
                setBio(result.bio || '');
                setEmailForm((prev) => ({ ...prev, email: result.email || '' }));
                onProfileUpdated(result);
            } catch (err) {
                if (!isMounted) return;
                setError(normalizeError(err, '프로필 정보를 불러오지 못했습니다.'));
                setProfile(null);
                onProfileUpdated(null);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        loadProfile();
        return () => {
            isMounted = false;
        };
    }, [onProfileUpdated]);

    const handleRandomNickname = () => {
        const adjectives = ['위험한', '용감한', '신비로운', '귀여운', '강인한'];
        const animals = ['물방개', '눈표범', '판다', '호랑이', '독수리'];
        const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
        setNickname(`${randomAdj} ${randomAnimal}`);
    };

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const result = await updateProfile({
                nickname: nickname.trim(),
                company_name: companyName.trim(),
                classification,
                bio: bio.trim(),
            });
            setProfile(result);
            onProfileUpdated(result);
            setSuccess('프로필이 저장되었습니다.');
        } catch (err) {
            setError(normalizeError(err, '프로필 저장에 실패했습니다.'));
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError(null);
        setSuccess(null);
        try {
            const result = await uploadAvatar(file);
            setProfile(result);
            onProfileUpdated(result);
            setSuccess('프로필 이미지가 업데이트되었습니다.');
        } catch (err) {
            setError(normalizeError(err, '프로필 이미지 업로드에 실패했습니다.'));
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        if (!emailForm.email.trim() || !emailForm.currentPassword.trim()) {
            setError('이메일과 현재 비밀번호를 입력해주세요.');
            return;
        }
        try {
            const result = await changeEmail({
                new_email: emailForm.email.trim(),
                current_password: emailForm.currentPassword.trim(),
            });
            setProfile(result);
            onProfileUpdated(result);
            setEmailForm({ email: result.email, currentPassword: '' });
            setSuccess('이메일이 변경되었습니다.');
        } catch (err) {
            setError(normalizeError(err, '이메일 변경에 실패했습니다.'));
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        if (!passwordForm.currentPassword.trim() || !passwordForm.newPassword.trim()) {
            setError('현재 비밀번호와 새 비밀번호를 입력해주세요.');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError('새 비밀번호가 일치하지 않습니다.');
            return;
        }
        try {
            await changePassword({
                current_password: passwordForm.currentPassword.trim(),
                new_password: passwordForm.newPassword.trim(),
            });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setSuccess('비밀번호가 변경되었습니다.');
        } catch (err) {
            setError(normalizeError(err, '비밀번호 변경에 실패했습니다.'));
        }
    };

    const handleDeleteAccount = async (password: string) => {
        setDeleteLoading(true);
        setDeleteError(null);
        try {
            await deleteAccount({ current_password: password });
            removeToken();
            onProfileUpdated(null);
            window.location.reload();
        } catch (err) {
            setDeleteError(normalizeError(err, '계정 탈퇴에 실패했습니다.'));
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleNavigate = (view: string) => {
        if (onNavigate) {
            onNavigate(view);
            return;
        }
        if (view === 'dashboard') onBack();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white font-sans flex items-center justify-center text-sm text-slate-500">
                프로필을 불러오는 중...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-display flex pl-24">
            <div className="fixed inset-0 h-[600px] bg-gradient-radial from-[#fffcf5] via-white to-white -z-10 pointer-events-none"></div>

            <nav className="fixed left-0 top-28 h-[calc(100vh-7rem)] w-24 flex flex-col items-center py-8 z-40 bg-transparent">
                <div className="absolute top-0 left-0 w-full h-8 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-2 w-8 h-8 animate-[patrol_10s_infinite_linear]">
                        <svg className="w-full h-full drop-shadow-sm" fill="none" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                            <g className="animate-bounce">
                                <path d="M8 18C8 18 10 14 16 14C22 14 24 18 24 18L26 22H6L8 18Z" fill="#F5F5F5" />
                                <circle cx="12" cy="16" fill="#A8A29E" r="1.5" />
                                <circle cx="18" cy="17" fill="#A8A29E" r="1.2" />
                                <circle cx="22" cy="16" fill="#A8A29E" r="1" />
                                <circle cx="24" cy="14" fill="#F5F5F5" r="5" />
                                <circle cx="23" cy="13" fill="#1F2937" r="0.5" />
                                <circle cx="26" cy="13" fill="#1F2937" r="0.5" />
                                <path d="M24.5 15L23.5 16H25.5L24.5 15Z" fill="#FCA5A5" />
                            </g>
                        </svg>
                    </div>
                </div>

                <button
                    onClick={() => handleNavigate('dashboard')}
                    className="mb-8 p-3 text-[#61892F] bg-white/80 hover:bg-green-50 shadow-sm hover:shadow-md rounded-full transition-all duration-300 hover:rotate-12 backdrop-blur-sm"
                >
                    <span className="material-symbols-outlined filled text-3xl">eco</span>
                </button>

                <div className="flex flex-col items-center gap-6 relative w-full px-2">
                    <NavItem icon="dashboard" label="대시보드" onClick={() => handleNavigate('dashboard')} />
                    <NavItem icon="person" label="프로필 설정" active onClick={() => handleNavigate('profile')} />
                    <NavItem icon="groups" label="비교 분석" onClick={() => handleNavigate('compare')} />
                    <NavItem icon="pets" label="시뮬레이터" onClick={() => handleNavigate('simulator')} />
                </div>

                <button
                    onClick={() => handleNavigate('dashboard')}
                    className="mt-auto rounded-full w-10 h-10 flex items-center justify-center text-gray-400 bg-white/80 shadow-sm hover:text-[#61892F] hover:bg-green-50 transition-all duration-300 backdrop-blur-sm"
                >
                    <span className="material-symbols-outlined text-xl">settings</span>
                </button>
            </nav>

            <div className="flex flex-col grow h-full max-w-[1280px] mx-auto w-full p-6 md:p-8 lg:p-10 relative">

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm px-4 py-3 rounded-xl">
                        {success}
                    </div>
                )}

                <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
                    <div className="w-full bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
                        <div className="mb-6 pb-4 border-b border-gray-100">
                            <h2 className="text-xl font-medium text-gray-800">멸종위기종 정체성</h2>
                            <p className="text-sm text-gray-500 mt-1">환경 보호 활동을 대변하는 페르소나</p>
                        </div>

                        <div className="flex flex-col items-center mb-8 relative">
                            <div className="w-40 h-40 mb-6 relative group cursor-pointer">
                                <div className="absolute inset-0 bg-gray-50 rounded-full shadow-inner"></div>
                                <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center border-[6px] border-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                                    <img alt="프로필 이미지" className="w-full h-full object-cover" src={profileImageSrc} />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-1 right-1 bg-white p-2.5 rounded-full shadow-md text-[#1a2e22] border border-gray-100 hover:bg-gray-50 transition-colors z-20"
                                >
                                    <span className="material-symbols-outlined text-lg">photo_camera</span>
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
                            </div>

                            <div className="text-center relative">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <h3 className="text-2xl font-medium text-gray-900">{displayName || '눈표범'}</h3>
                                    <QuizBadge nickname={displayName} />
                                </div>
                                <span className="inline-block px-3 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full border border-red-100">
                                    Critically Endangered
                                </span>
                                <p className="text-xs text-gray-400 mt-2">{profile?.email}</p>
                            </div>
                        </div>

                        <form className="space-y-6" onSubmit={handleProfileSave}>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-600 pl-1" htmlFor="nickname">
                                    표시되는 이름
                                </label>
                                <div className="relative flex items-center">
                                    <input
                                        className="block w-full py-3 px-4 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-[#86C232] focus:ring-1 focus:ring-[#86C232] transition-all text-base"
                                        id="nickname"
                                        name="nickname"
                                        type="text"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                    />
                                    <button
                                        className="absolute right-3 p-1.5 text-gray-400 hover:text-[#86C232] transition-colors hover:bg-gray-100 rounded-full"
                                        title="랜덤 생성"
                                        type="button"
                                        onClick={handleRandomNickname}
                                    >
                                        <span className="material-symbols-outlined text-xl">autorenew</span>
                                    </button>
                                </div>
                                <p className="text-xs text-[#61892F] pl-1 mt-1.5 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                    활동 데이터에 따라 닉네임이 진화합니다
                                </p>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-600 pl-1" htmlFor="company_name">
                                    회사명
                                </label>
                                <div className="relative">
                                    <select
                                        className="block w-full py-3 px-4 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-[#86C232] focus:ring-1 focus:ring-[#86C232] transition-all text-base appearance-none cursor-pointer"
                                        id="company_name"
                                        name="company_name"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                    >
                                        <option value="">회사를 선택하세요</option>
                                        {companies.map((c) => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                        <span className="material-symbols-outlined">expand_more</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-600 pl-1" htmlFor="classification">
                                    종 분류 변경
                                </label>
                                <div className="relative">
                                    <select
                                        className="block w-full py-3 px-4 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-[#86C232] focus:ring-1 focus:ring-[#86C232] transition-all text-base appearance-none cursor-pointer"
                                        id="classification"
                                        name="classification"
                                        value={classification}
                                        onChange={(e) => setClassification(e.target.value)}
                                    >
                                        <option value="mammal">포유류 (Mammals)</option>
                                        <option value="bird">조류 (Birds)</option>
                                        <option value="reptile">파충류 (Reptiles)</option>
                                        <option value="amphibian">양서류 (Amphibians)</option>
                                        <option value="fish">어류 (Fish)</option>
                                        <option value="insect">곤충 (Insects)</option>
                                        <option value="plant">식물 (Plants)</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                        <span className="material-symbols-outlined">expand_more</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-600 pl-1" htmlFor="bio">
                                    소개
                                </label>
                                <textarea
                                    id="bio"
                                    className="block w-full min-h-[120px] py-3 px-4 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-[#86C232] focus:ring-1 focus:ring-[#86C232] transition-all text-base"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="환경 보호를 위한 우리 회사의 비전을 소개해주세요."
                                />
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    className="bg-[#1a2e22] hover:bg-[#14241b] text-white font-medium py-2.5 px-6 rounded-lg shadow-sm hover:shadow transition-all duration-200 disabled:opacity-60"
                                    type="submit"
                                    disabled={saving}
                                >
                                    {saving ? '저장 중...' : '저장하기'}
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="w-full bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
                        <div className="mb-6 pb-4 border-b border-gray-100">
                            <h2 className="text-xl font-medium text-gray-800">개인정보 및 보안</h2>
                            <p className="text-sm text-gray-500 mt-1">이메일/비밀번호 변경</p>
                        </div>

                        <div className="flex-1 space-y-6">
                            <form onSubmit={handleEmailChange} className="space-y-3">
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-gray-600">이메일 변경</label>
                                    <input
                                        className="w-full py-2.5 px-3 bg-white border border-gray-200 rounded-lg text-sm"
                                        type="email"
                                        value={emailForm.email}
                                        onChange={(e) => setEmailForm((prev) => ({ ...prev, email: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-gray-600">현재 비밀번호</label>
                                    <div className="relative">
                                        <input
                                            className="w-full py-2.5 px-3 pr-10 bg-white border border-gray-200 rounded-lg text-sm"
                                            type={showEmailPassword ? 'text' : 'password'}
                                            value={emailForm.currentPassword}
                                            onChange={(e) => setEmailForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowEmailPassword((prev) => !prev)}
                                            className="absolute right-3 inset-y-0 my-auto h-5 flex items-center text-gray-400 hover:text-[#86C232]"
                                        >
                                            <span className="material-symbols-outlined text-lg leading-none">
                                                {showEmailPassword ? 'visibility' : 'visibility_off'}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    이메일 변경
                                </button>
                            </form>

                            <form onSubmit={handlePasswordChange} className="space-y-3 pt-4 border-t border-gray-100">
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-gray-600">현재 비밀번호</label>
                                    <div className="relative">
                                        <input
                                            className="w-full py-2.5 px-3 pr-10 bg-white border border-gray-200 rounded-lg text-sm"
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword((prev) => !prev)}
                                            className="absolute right-3 inset-y-0 my-auto h-5 flex items-center text-gray-400 hover:text-[#86C232]"
                                        >
                                            <span className="material-symbols-outlined text-lg leading-none">
                                                {showCurrentPassword ? 'visibility' : 'visibility_off'}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-gray-600">새 비밀번호</label>
                                    <div className="relative">
                                        <input
                                            className="w-full py-2.5 px-3 pr-10 bg-white border border-gray-200 rounded-lg text-sm"
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword((prev) => !prev)}
                                            className="absolute right-3 inset-y-0 my-auto h-5 flex items-center text-gray-400 hover:text-[#86C232]"
                                        >
                                            <span className="material-symbols-outlined text-lg leading-none">
                                                {showNewPassword ? 'visibility' : 'visibility_off'}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-gray-600">새 비밀번호 확인</label>
                                    <div className="relative">
                                        <input
                                            className="w-full py-2.5 px-3 pr-10 bg-white border border-gray-200 rounded-lg text-sm"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                                            className="absolute right-3 inset-y-0 my-auto h-5 flex items-center text-gray-400 hover:text-[#86C232]"
                                        >
                                            <span className="material-symbols-outlined text-lg leading-none">
                                                {showConfirmPassword ? 'visibility' : 'visibility_off'}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    비밀번호 변경
                                </button>
                            </form>
                        </div>

                        <div className="mt-auto pt-8 border-t border-gray-100 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsDeleteOpen(true)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 hover:underline transition-colors px-2 py-1 rounded"
                            >
                                <span className="material-symbols-outlined text-sm">block</span>
                                서비스 해지 및 탈퇴
                            </button>
                        </div>
                    </div>
                </main>

                <footer className="mt-12 text-center text-xs text-gray-400 border-t border-gray-100 pt-8">
                    <div className="flex justify-center gap-6 mb-4">
                        <a className="hover:text-gray-600" href="#">개인정보처리방침</a>
                        <a className="hover:text-gray-600" href="#">이용약관</a>
                        <a className="hover:text-gray-600" href="#">고객센터</a>
                    </div>
                    <p>© 2024 Be-REAL ESG Portal. All rights reserved.</p>
                </footer>
            </div>

            <DropoutModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDeleteAccount}
                email={profile?.email || ''}
                loading={deleteLoading}
                error={deleteError}
            />
        </div>
    );
};

interface NavItemProps {
    icon: string;
    label: string;
    active?: boolean;
    onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active = false, onClick }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group relative flex items-center justify-center w-full"
            title={label}
        >
            <div
                className={`w-12 h-12 flex items-center justify-center rounded-[40%_60%_70%_30%/40%_50%_60%_50%] transition-all duration-300 ease-out shadow-sm ${active
                    ? 'bg-green-50 border-2 border-[#86C232] text-[#61892F] shadow-lg ring-4 ring-white/50'
                    : 'bg-white border-2 border-gray-200 text-gray-400 hover:border-[#86C232]/30 hover:shadow-md'
                    }`}
            >
                <span className={`material-symbols-outlined text-xl ${active ? 'filled' : ''}`}>{icon}</span>
            </div>
            {active && <div className="absolute right-2 top-2 w-2.5 h-2.5 bg-[#86C232] rounded-full ring-2 ring-white animate-pulse"></div>}
            <span className="absolute left-16 ml-2 px-3 py-1 bg-white text-[#61892F] border border-green-100 text-xs rounded-2xl opacity-0 -translate-x-2 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 whitespace-nowrap shadow-sm z-50">
                {label}
            </span>
        </button>
    );
};

interface QuizData {
    question: string;
    correct: string;
    wrong: string;
    hint: string;
}

const ANIMAL_QUIZ_MAP: { keyword: string; quiz: QuizData }[] = [
    {
        keyword: '눈표범',
        quiz: {
            question: '눈표범은 전 세계에\n몇 마리 정도 남았을까요?',
            correct: '약 4,000~6,500마리',
            wrong: '약 50,000마리 이상',
            hint: '중앙아시아 고산지대에 서식하는 대형 고양이과 동물',
        },
    },
    {
        keyword: '물방개',
        quiz: {
            question: '물방개가 사라지는\n가장 큰 이유는 무엇일까요?',
            correct: '농약 사용과 수질 오염',
            wrong: '천적의 증가',
            hint: '깨끗한 민물에만 사는 수서곤충',
        },
    },
    {
        keyword: '판다',
        quiz: {
            question: '야생 자이언트 판다는\n현재 몇 마리일까요?',
            correct: '약 1,800마리',
            wrong: '약 10,000마리 이상',
            hint: '대나무 숲 파괴가 주요 위협 요인',
        },
    },
    {
        keyword: '호랑이',
        quiz: {
            question: '전 세계 야생 호랑이는\n현재 몇 마리일까요?',
            correct: '약 3,900마리',
            wrong: '약 30,000마리',
            hint: '100년 전 10만 마리에서 급감한 위기종',
        },
    },
    {
        keyword: '독수리',
        quiz: {
            question: '독수리가 멸종위기에 처한\n가장 큰 원인은?',
            correct: '납 중독 및 서식지 파괴',
            wrong: '사냥 능력 저하',
            hint: '죽은 동물을 먹는 과정에서 납탄 중독 발생',
        },
    },
];

const DEFAULT_QUIZ: QuizData = {
    question: '탄소 중립(Net Zero)의\n목표 연도는 언제일까요?',
    correct: '2050년',
    wrong: '2030년',
    hint: '파리협정 1.5°C 목표 달성을 위한 글로벌 기준',
};

const QuizBadge: React.FC<{ nickname: string }> = ({ nickname }) => {
    const [showQuiz, setShowQuiz] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);

    const quiz: QuizData = ANIMAL_QUIZ_MAP.find(({ keyword }) =>
        nickname.includes(keyword)
    )?.quiz ?? DEFAULT_QUIZ;

    const handleSelect = (answer: string) => setSelected(answer);
    const isCorrect = selected === quiz.correct;

    const handleOpen = () => {
        setShowQuiz(true);
        setSelected(null);
    };

    const handleClose = () => {
        setShowQuiz(false);
        setSelected(null);
    };

    return (
        <div className="relative">
            <span
                className="material-symbols-outlined text-red-500 filled text-xl animate-pulse cursor-pointer"
                onClick={handleOpen}
            >
                error
            </span>
            {showQuiz && (
                <>
                    <div
                        className="fixed inset-0 bg-black/5 z-40"
                        onClick={handleClose}
                    />
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[280px] bg-white rounded-xl shadow-xl border border-gray-100 p-5 z-50 animate-[fadeIn_0.3s_ease-out_forwards]">
                        <button
                            onClick={handleClose}
                            className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">close</span>
                        </button>
                        <div className="text-center mb-4">
                            <p className="text-xs font-bold text-[#86C232] uppercase tracking-wider mb-1">Mini Quiz</p>
                            <h4 className="text-sm font-bold text-gray-800 leading-snug whitespace-pre-line">
                                {quiz.question}
                            </h4>
                            <p className="text-[10px] text-gray-400 mt-1">{quiz.hint}</p>
                        </div>
                        {selected ? (
                            <div className={`text-center py-3 rounded-lg text-sm font-bold ${isCorrect ? 'bg-[#86C232]/10 text-[#61892F]' : 'bg-red-50 text-red-500'}`}>
                                {isCorrect ? '🎉 정답이에요!' : `❌ 오답! 정답은 "${quiz.correct}"`}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => handleSelect(quiz.correct)}
                                    className="w-full py-2 px-3 rounded-lg border border-gray-100 bg-gray-50 text-xs text-gray-600 hover:bg-[#86C232] hover:text-white hover:border-[#86C232] transition-all duration-200 font-medium"
                                >
                                    {quiz.correct}
                                </button>
                                <button
                                    onClick={() => handleSelect(quiz.wrong)}
                                    className="w-full py-2 px-3 rounded-lg border border-gray-100 bg-gray-50 text-xs text-gray-600 hover:bg-[#1a2e22] hover:text-white hover:border-[#1a2e22] transition-all duration-200 font-medium"
                                >
                                    {quiz.wrong}
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
