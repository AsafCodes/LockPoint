// ─────────────────────────────────────────────────────────────
// LockPoint — JWT Token Management
// ─────────────────────────────────────────────────────────────

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';

export interface TokenPayload {
    userId: string;
    serviceNumber: string;
    role: string;
}

/** Sign a short-lived access token (15 minutes) */
export function signAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

/** Sign a long-lived refresh token (7 days) */
export function signRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

/** Verify an access token — throws on invalid/expired */
export function verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

/** Verify a refresh token — throws on invalid/expired */
export function verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
}
