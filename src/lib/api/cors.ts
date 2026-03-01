// ─────────────────────────────────────────────────────────────
// LockPoint — CORS Security Helper (§9.1)
//
// Restricts cross-origin API access to a strict whitelist of
// allowed origins. This is critical for Capacitor mobile builds
// where the WebView sends requests from capacitor://localhost.
//
// How it works:
//   1. The browser sends an `Origin` header with every request
//   2. We check if that origin is on our whitelist
//   3. If yes → we add CORS response headers allowing the request
//   4. If no  → we do NOT add CORS headers, and the browser blocks the response
//
// Important: This does NOT reject unknown origins with a 403.
// Instead, it simply omits the Access-Control-Allow-Origin header,
// which causes the browser itself to block the response — this is
// the standard and most secure CORS behavior.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';

/**
 * Allowed origins whitelist.
 * 
 * - capacitor://localhost  → Android WebView (Capacitor)
 * - ionic://localhost      → iOS WebView (Capacitor)
 * - http://localhost:3000  → Local development
 * 
 * Can be extended via CORS_ALLOWED_ORIGINS env var (comma-separated).
 */
function getAllowedOrigins(): string[] {
    const defaults = [
        'capacitor://localhost',
        'ionic://localhost',
        'http://localhost:3000',
    ];

    const extra = process.env.CORS_ALLOWED_ORIGINS;
    if (extra) {
        const parsed = extra.split(',').map(o => o.trim()).filter(Boolean);
        return [...defaults, ...parsed];
    }

    return defaults;
}

/**
 * Check if the request's Origin header is on the whitelist.
 * Returns the origin string if allowed, or null if not.
 */
function getAllowedOrigin(req: NextRequest): string | null {
    const origin = req.headers.get('origin');
    if (!origin) return null;

    const allowed = getAllowedOrigins();
    return allowed.includes(origin) ? origin : null;
}

/**
 * CORS response headers to attach when the origin is allowed.
 */
function corsHeaders(origin: string): Record<string, string> {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Integrity-Token',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
    };
}

/**
 * Wrap an existing NextResponse with CORS headers.
 * 
 * Usage in route handlers that build their own NextResponse.json():
 *   return withCors(NextResponse.json({ ... }), req);
 * 
 * If the origin is not on the whitelist, the response is returned
 * unchanged (no CORS headers), causing the browser to block it.
 */
export function withCors(response: NextResponse, req: NextRequest): NextResponse {
    const origin = getAllowedOrigin(req);
    if (origin) {
        const headers = corsHeaders(origin);
        for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
        }
    }
    return response;
}

/**
 * Handle CORS preflight (OPTIONS) requests.
 * 
 * The browser sends an OPTIONS request before the real request
 * to ask: "Am I allowed to make this cross-origin request?"
 * 
 * If the origin is allowed → respond 204 with CORS headers.
 * If the origin is NOT allowed → respond 204 without CORS headers
 * (the browser will then block the subsequent real request).
 */
export function handlePreflight(req: NextRequest): NextResponse {
    const origin = getAllowedOrigin(req);

    if (origin) {
        return new NextResponse(null, {
            status: 204,
            headers: corsHeaders(origin),
        });
    }

    // Unknown origin — return 204 but without CORS headers.
    // The browser will block the real request automatically.
    return new NextResponse(null, { status: 204 });
}
