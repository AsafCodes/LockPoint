// ─────────────────────────────────────────────────────────────
// LockPoint — Next.js Edge Middleware (§9.1 CORS)
//
// ⚠️  SECURITY-CRITICAL FILE — edit with care
//
// Runs on EVERY request matching the `config.matcher` pattern.
// Handles two CORS responsibilities:
//
//   1. OPTIONS preflight → respond immediately with 204 + CORS headers
//   2. All other /api/* requests → attach CORS headers to the response
//
// ── Strict Whitelisting ──────────────────────────────────────
// Origins are checked with Set.has() (exact match only).
// NO wildcards (*), NO regex, NO substring matching.
// If the Origin header does not exactly match a whitelisted
// value, NO CORS headers are sent — the browser blocks the response.
//
// ── Defense in Depth ─────────────────────────────────────────
// CORS is Layer 1 (browser-enforced origin gate).
// It does NOT replace the following layers that run INSIDE routes:
//   Layer 2 — JWT authentication  (withAuth / withRole)
//   Layer 3 — Integrity Guard     (X-Integrity-Token, §9.9)
// Non-browser clients (curl, Postman) bypass CORS entirely,
// which is why Layers 2 and 3 remain mandatory.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';

/**
 * Strict origin whitelist.
 * Only these origins will receive Access-Control-Allow-Origin headers.
 */
const ALLOWED_ORIGINS = new Set([
    'capacitor://localhost',     // Android Capacitor WebView
    'ionic://localhost',         // iOS Capacitor WebView
    'http://localhost:3000',     // Local development
]);

// Extend with environment variable if provided
if (typeof process !== 'undefined' && process.env?.CORS_ALLOWED_ORIGINS) {
    process.env.CORS_ALLOWED_ORIGINS.split(',')
        .map(o => o.trim())
        .filter(Boolean)
        .forEach(o => ALLOWED_ORIGINS.add(o));
}

/** CORS headers for an allowed origin */
function corsHeaders(origin: string): Record<string, string> {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Integrity-Token',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
    };
}

export function middleware(req: NextRequest) {
    const origin = req.headers.get('origin') ?? '';
    const isAllowed = ALLOWED_ORIGINS.has(origin);

    // ── OPTIONS preflight ────────────────────────────────────
    if (req.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 204,
            headers: isAllowed ? corsHeaders(origin) : {},
        });
    }

    // ── All other requests: run the route, then attach CORS ──
    const response = NextResponse.next();

    if (isAllowed) {
        const headers = corsHeaders(origin);
        for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
        }
    }

    return response;
}

/** Only apply this middleware to API routes */
export const config = {
    matcher: '/api/:path*',
};
