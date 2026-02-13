import React, { useEffect, useState } from 'react';
import { fetchProfile, updateProfile, uploadAvatar } from '../../services/profileApi';
import type { ProfileResponse } from '../../services/profileApi';

interface ProfileProps {
    onBack: () => void;
}

const NICKNAME_PRESETS = ['위험한 물방개', 'Snow Leopard', 'ESG Explorer', 'Green Pioneer'];

export const Profile: React.FC<ProfileProps> = ({ onBack }) => {
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [form, setForm] = useState({
        nickname: '',
        company_name: '',
        classification: 'mammal',
        bio: '',
    });
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const result = await fetchProfile();
                setProfile(result);
                setForm({
                    nickname: result.nickname || '',
                    company_name: result.company_name || '',
                    classification: result.classification || 'mammal',
                    bio: result.bio || '',
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : '프로필을 불러오지 못했습니다.');
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
            setPreview(URL.createObjectURL(file));
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.');
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
            setError(null);
            onBack();
        } catch (err) {
            setError(err instanceof Error ? err.message : '프로필 저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    if (!profile) {
        return (
            <section className="min-h-screen flex items-center justify-center">
                <p className="text-slate-500">프로필을 불러오는 중...</p>
            </section>
        );
    }

    return (
        <section className="min-h-screen bg-background-light font-sans-kr px-6 py-10">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-lg border border-slate-100 p-8">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <p className="text-sm text-slate-500">프로필 설정</p>
                        <h1 className="text-3xl font-black text-slate-900">나의 탄소 아이덴티티</h1>
                    </div>
                    <button onClick={onBack} className="text-slate-500 hover:text-slate-900">← 돌아가기</button>
                </div>

                        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-10">
                            <div className="lg:col-span-1 flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div className="size-32 rounded-3xl border-4 border-white shadow-xl bg-slate-50 overflow-hidden flex items-center justify-center">
                                        {preview || profile.profile_image_url ? (
                                            <img src={preview || profile.profile_image_url!} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined text-5xl text-emerald-600">eco</span>
                                        )}
                                    </div>
                                    <label className="absolute right-2 bottom-2 size-11 flex items-center justify-center bg-white rounded-2xl border shadow cursor-pointer">
                                        <span className="material-symbols-outlined text-primary">photo_camera</span>
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
                                <p className="text-center text-slate-500 text-sm">PNG/JPG 2MB 이하</p>
                            </div>

                            <div className="lg:col-span-2 space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-500">닉네임</label>
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                            value={form.nickname}
                                            onChange={e => handleChange('nickname', e.target.value)}
                                        />
                                        <button type="button" onClick={handleNicknameCycle} className="px-4 py-3 rounded-2xl border border-slate-200 hover:border-emerald-400">
                                            랜덤
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-500">회사명</label>
                                    <input
                                        className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                        value={form.company_name}
                                        onChange={e => handleChange('company_name', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-500">멸종위기종 분류</label>
                                    <select
                                        className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-emerald-500"
                                        value={form.classification}
                                        onChange={e => handleChange('classification', e.target.value)}
                                    >
                                        <option value="mammal">포유류</option>
                                        <option value="bird">조류</option>
                                        <option value="reptile">파충류</option>
                                        <option value="amphibian">양서류</option>
                                        <option value="fish">어류</option>
                                        <option value="insect">곤충</option>
                                        <option value="plant">식물</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-500">소개</label>
                                    <textarea
                                        className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                        rows={4}
                                        value={form.bio}
                                        onChange={e => handleChange('bio', e.target.value)}
                                        placeholder="ESG 미션, 관심 분야 등을 소개해 주세요"
                                    />
                                </div>

                                {error && <p className="text-sm text-red-600">{error}</p>}

                                <div className="flex items-center gap-4 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-2xl shadow hover:bg-emerald-700 disabled:opacity-50"
                                        disabled={saving}
                                    >
                                        {saving ? '저장 중...' : '저장하기'}
                                    </button>
                                    <button type="button" className="text-slate-500" onClick={onBack}>
                                        취소
                                    </button>
                                </div>
                            </div>
                        </form>
            </div>
        </section>
    );
};
