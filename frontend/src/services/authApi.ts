import { API_BASE_URL } from '../config';

export interface SignupData {
    email: string;
    password: string;
    company_name: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
}

export interface UserResponse {
    id: number;
    email: string;
    company_name: string;
    created_at: string;
}

/**
 * 회원가입 API
 */
export const signup = async (data: SignupData): Promise<UserResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '회원가입에 실패했습니다.');
    }

    return response.json();
};

/**
 * 로그인 API
 */
export const login = async (data: LoginData): Promise<TokenResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', data.email);
    formData.append('password', data.password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '로그인에 실패했습니다.');
    }

    return response.json();
};

/**
 * 현재 사용자 정보 조회 API
 */
export const getCurrentUser = async (token: string): Promise<UserResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '사용자 정보를 가져오는데 실패했습니다.');
    }

    return response.json();
};

/**
 * 로컬스토리지에 토큰 저장
 */
export const saveToken = (token: string): void => {
    localStorage.setItem('auth_token', token);
};

/**
 * 로컬스토리지에서 토큰 가져오기
 */
export const getToken = (): string | null => {
    return localStorage.getItem('auth_token');
};

/**
 * 로컬스토리지에서 토큰 삭제
 */
export const removeToken = (): void => {
    localStorage.removeItem('auth_token');
};

/**
 * 로그인 여부 확인
 */
export const isAuthenticated = (): boolean => {
    return getToken() !== null;
};
