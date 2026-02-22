'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — Auth Provider (Real API + JWT)
// ─────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import type { User, UserRole } from '@/features/hierarchy';
import type { LoginCredentials } from '@/lib/api/types';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

interface AuthContextValue extends AuthState {
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
    hasRole: (role: UserRole) => boolean;
    getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: false,
    });

    const accessTokenRef = useRef<string | null>(null);
    const refreshTokenRef = useRef<string | null>(null);
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Token refresh logic ──────────────────────────────────

    const refreshAccessToken = useCallback(async () => {
        if (!refreshTokenRef.current) return;

        try {
            const res = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: refreshTokenRef.current }),
            });

            if (!res.ok) {
                // Refresh failed — session expired
                accessTokenRef.current = null;
                refreshTokenRef.current = null;
                setState({ user: null, isAuthenticated: false, isLoading: false });
                return;
            }

            const json = await res.json();
            accessTokenRef.current = json.data.accessToken;
            refreshTokenRef.current = json.data.refreshToken;

            // Schedule next refresh 1 minute before expiry (14 minutes)
            scheduleRefresh();
        } catch {
            console.error('[AUTH] Token refresh failed');
        }
    }, []);

    const scheduleRefresh = useCallback(() => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
        }
        // Refresh 1 minute before the 15-minute expiry
        refreshTimerRef.current = setTimeout(refreshAccessToken, 14 * 60 * 1000);
    }, [refreshAccessToken]);

    // ── Login ────────────────────────────────────────────────

    const login = useCallback(async (credentials: LoginCredentials) => {
        setState((s) => ({ ...s, isLoading: true }));

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });

        if (!res.ok) {
            setState({ user: null, isAuthenticated: false, isLoading: false });
            const json = await res.json().catch(() => ({}));
            throw new Error(json.error?.message || 'Login failed');
        }

        const json = await res.json();
        const { user, tokens } = json.data;

        // Store tokens in memory only (not localStorage — XSS protection)
        accessTokenRef.current = tokens.accessToken;
        refreshTokenRef.current = tokens.refreshToken;

        // Map API response to User type
        const mappedUser: User = {
            id: user.id,
            serviceNumber: user.serviceNumber,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            rank: user.rank,
            unitId: user.unitId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        setState({ user: mappedUser, isAuthenticated: true, isLoading: false });
        scheduleRefresh();
    }, [scheduleRefresh]);

    // ── Logout ───────────────────────────────────────────────

    const logout = useCallback(() => {
        accessTokenRef.current = null;
        refreshTokenRef.current = null;
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
        }
        setState({ user: null, isAuthenticated: false, isLoading: false });
    }, []);

    // ── Helpers ──────────────────────────────────────────────

    const hasRole = useCallback(
        (role: UserRole) => state.user?.role === role,
        [state.user]
    );

    const getAccessToken = useCallback(() => accessTokenRef.current, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
            }
        };
    }, []);

    return (
        <AuthContext.Provider value={{ ...state, login, logout, hasRole, getAccessToken }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
