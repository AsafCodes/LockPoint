// ─────────────────────────────────────────────────────────────
// LockPoint — HTTP Client (Same-origin API)
// ─────────────────────────────────────────────────────────────

import type { ApiResponse, ApiError } from './types';

class ApiClient {
    private baseUrl: string;
    private tokenGetter: (() => string | null) | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    /** Set a function that returns the current access token */
    setTokenGetter(getter: () => string | null) {
        this.tokenGetter = getter;
    }

    // Legacy compat
    setToken(_token: string | null) {
        // no-op: tokens are now managed by AuthProvider
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        const token = this.tokenGetter?.();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const error: ApiError = await response.json().catch(() => ({
                code: 'UNKNOWN',
                message: response.statusText,
            }));
            throw error;
        }
        const json: ApiResponse<T> = await response.json();
        return json.data;
    }

    async get<T>(path: string, params?: Record<string, string>): Promise<T> {
        const url = new URL(`${this.baseUrl}${path}`, window.location.origin);
        if (params) {
            Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
        }
        const res = await fetch(url.toString(), {
            method: 'GET',
            headers: this.getHeaders(),
        });
        return this.handleResponse<T>(res);
    }

    async post<T>(path: string, body?: unknown): Promise<T> {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        });
        return this.handleResponse<T>(res);
    }

    async put<T>(path: string, body?: unknown): Promise<T> {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        });
        return this.handleResponse<T>(res);
    }

    async patch<T>(path: string, body?: unknown): Promise<T> {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        });
        return this.handleResponse<T>(res);
    }

    async delete<T>(path: string): Promise<T> {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });
        return this.handleResponse<T>(res);
    }
}

/** Singleton API client — now points to same-origin API routes */
export const apiClient = new ApiClient('/api');
export default apiClient;
