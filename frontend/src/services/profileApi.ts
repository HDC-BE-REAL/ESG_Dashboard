import { API_BASE_URL } from '../config';
import { getToken, removeToken } from './authApi';

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

export interface PasswordChangeRequest {
    current_password: string;
    new_password: string;
}

export interface EmailChangeRequest {
    new_email: string;
    current_password: string;
}

export interface AccountDeleteRequest {
    current_password: string;
}

export interface MessageResponse {
    detail: string;
}

export class UnauthorizedError extends Error {
    constructor(message = '세션이 만료되었습니다. 다시 로그인해주세요.') {
        super(message);
        this.name = 'UnauthorizedError';
    }
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

const handleResponse = async <T>(response: Response, defaultMessage: string): Promise<T> => {
    if (response.status === 401) {
        removeToken();
        throw new UnauthorizedError();
    }
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || defaultMessage);
    }
    return response.json();
};

export const fetchProfile = async (): Promise<ProfileResponse> => {
    const response = await fetch(`${API_BASE_URL}/profile/me`, {
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
        },
    });
    return handleResponse(response, '프로필 정보를 가져오지 못했습니다.');
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
    return handleResponse(response, '프로필 업데이트에 실패했습니다.');
};

export const uploadAvatar = async (file: File): Promise<ProfileResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/profile/me/avatar`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
    });
    return handleResponse(response, '프로필 이미지 업로드에 실패했습니다.');
};

export const changePassword = async (payload: PasswordChangeRequest): Promise<MessageResponse> => {
    const response = await fetch(`${API_BASE_URL}/profile/me/password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
        },
        body: JSON.stringify(payload),
    });
    return handleResponse(response, '비밀번호 변경에 실패했습니다.');
};

export const changeEmail = async (payload: EmailChangeRequest): Promise<ProfileResponse> => {
    const response = await fetch(`${API_BASE_URL}/profile/me/email`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
        },
        body: JSON.stringify(payload),
    });
    return handleResponse(response, '이메일 변경에 실패했습니다.');
};

export const deleteAccount = async (payload: AccountDeleteRequest): Promise<MessageResponse> => {
    const response = await fetch(`${API_BASE_URL}/profile/me/delete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
        },
        body: JSON.stringify(payload),
    });
    return handleResponse(response, '계정 탈퇴에 실패했습니다.');
};
