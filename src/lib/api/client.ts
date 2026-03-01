// ─────────────────────────────────────────────────────────────
// LockPoint — HTTP Client
// Supports both same-origin (/api) and remote (https://...) base URLs
// to work in both the web (Docker) and Capacitor (native) builds.
// ─────────────────────────────────────────────────────────────

import type { ApiResponse, ApiError } from './types';

// In Capacitor static builds, NEXT_PUBLIC_API_URL must be set to the
// fully-qualified server URL (e.g. https://lockpoint.onrender.com/api).
// In Docker / dev builds, it falls back to relative /api.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

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

    /** Build a full URL, handling both absolute and relative bases */
    private buildUrl(path: string, params?: Record<string, string>): string {
        const fullPath = `${this.baseUrl}${path}`;
        const url = fullPath.startsWith('http')
            ? new URL(fullPath)
            : new URL(fullPath, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
        if (params) {
            Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
        }
        return url.toString();
    }

    async get<T>(path: string, params?: Record<string, string>): Promise<T> {
        const res = await fetch(this.buildUrl(path, params), {
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

/** Singleton API client — uses NEXT_PUBLIC_API_URL for Capacitor, /api for web */
export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
