// ─────────────────────────────────────────────────────────────
// LockPoint — Base44 API Client & Envelope Types
// ─────────────────────────────────────────────────────────────

/** Standard API response wrapper */
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    timestamp: string;
}

/** Paginated response */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

/** API error */
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

/** Auth tokens */
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
}

/** Login credentials */
export interface LoginCredentials {
    serviceNumber: string;
    password: string;
}
