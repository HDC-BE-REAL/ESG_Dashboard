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

const parseApiError = async (response: Response, fallback: string): Promise<string> => {
    try {
        const error = await response.json();
        return error.detail || fallback;
    } catch {
        return fallback;
    }
};

export const signup = async (data: SignupData): Promise<UserResponse> => {
    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
    } catch {
        throw new Error(`백엔드 서버에 연결할 수 없습니다. (${API_BASE_URL})`);
    }

    if (!response.ok) {
        throw new Error(await parseApiError(response, '회원가입에 실패했습니다.'));
    }

    return response.json();
};

export const login = async (data: LoginData): Promise<TokenResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', data.email);
    formData.append('password', data.password);

    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });
    } catch {
        throw new Error(`백엔드 서버에 연결할 수 없습니다. (${API_BASE_URL})`);
    }

    if (!response.ok) {
        throw new Error(await parseApiError(response, '로그인에 실패했습니다.'));
    }

    return response.json();
};

export const getCurrentUser = async (token: string): Promise<UserResponse> => {
    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    } catch {
        throw new Error(`백엔드 서버에 연결할 수 없습니다. (${API_BASE_URL})`);
    }

    if (!response.ok) {
        throw new Error(await parseApiError(response, '사용자 정보를 가져오지 못했습니다.'));
    }

    return response.json();
};

export const saveToken = (token: string): void => {
    localStorage.setItem('auth_token', token);
};

export const getToken = (): string | null => {
    return localStorage.getItem('auth_token');
};

export const removeToken = (): void => {
    localStorage.removeItem('auth_token');
};

export const isAuthenticated = (): boolean => {
    return getToken() !== null;
};
