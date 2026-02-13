import { API_BASE_URL } from '../config';
import { getToken } from './authApi';

export interface ProfileResponse {
    id: number;
    email: string;
    company_name: string;
    nickname: string;
    classification?: string;
    bio?: string;
    profile_image_url?: string;
}

export interface ProfileUpdateRequest {
    nickname?: string;
    company_name?: string;
    classification?: string;
    bio?: string;
}

const authHeaders = () => {
    const token = getToken();
    if (!token) {
        throw new Error('로그인이 필요합니다.');
    }
    return {
        Authorization: `Bearer ${token}`,
    };
};

export const fetchProfile = async (): Promise<ProfileResponse> => {
    const response = await fetch(`${API_BASE_URL}/profile/me`, {
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
        },
    });
    if (!response.ok) {
        throw new Error('프로필 정보를 가져오지 못했습니다.');
    }
    return response.json();
};

export const updateProfile = async (payload: ProfileUpdateRequest): Promise<ProfileResponse> => {
    const response = await fetch(`${API_BASE_URL}/profile/me`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || '프로필 업데이트에 실패했습니다.');
    }
    return response.json();
};

export const uploadAvatar = async (file: File): Promise<ProfileResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/profile/me/avatar`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || '프로필 이미지 업로드에 실패했습니다.');
    }
    return response.json();
};
