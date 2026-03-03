// ─────────────────────────────────────────────────────────────
// LockPoint — Auth Middleware (RBAC + Permission System)
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, type TokenPayload } from './jwt';
import { prisma } from '@/lib/db';
import { logAudit } from './audit';

export type AuthenticatedRequest = NextRequest & {
    user: TokenPayload;
};

/** Standard JSON error response */
function errorResponse(message: string, status: number) {
    return NextResponse.json(
        { success: false, error: { code: status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN', message } },
        { status }
    );
}

/** Standard JSON success response */
export function successResponse<T>(data: T, status = 200) {
    return NextResponse.json(
        { success: true, data, timestamp: new Date().toISOString() },
        { status }
    );
}

/**
 * Extract and verify JWT from the Authorization header.
 * Returns the token payload or null.
 */
export function extractUser(req: NextRequest): TokenPayload | null {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    try {
        const token = authHeader.slice(7);
        return verifyAccessToken(token);
    } catch {
        return null;
    }
}

/**
 * Protect an API route — requires a valid JWT.
 * Injects `user` into the handler context.
 */
export function withAuth(
    handler: (req: NextRequest, user: TokenPayload) => Promise<NextResponse>
) {
    return async (req: NextRequest) => {
        const user = extractUser(req);
        if (!user) {
            return errorResponse('אימות נדרש. יש להתחבר מחדש.', 401);
        }
        return handler(req, user);
    };
}

/**
 * Protect an API route — requires a valid JWT AND one of the specified roles.
 */
export function withRole(
    roles: string[],
    handler: (req: NextRequest, user: TokenPayload) => Promise<NextResponse>
) {
    return withAuth(async (req, user) => {
        if (!roles.includes(user.role)) {
            return errorResponse('אין הרשאה לביצוע פעולה זו.', 403);
        }
        return handler(req, user);
    });
}

/**
 * Protect an API route — requires a valid JWT AND a specific granular permission.
 *
 * This is the RBAC layer that sits ON TOP of withAuth.
 * It checks the `UserPermission` table for an active, non-expired assignment.
 *
 * The handler receives an additional `scopeUnitId` parameter:
 *   - `null`   → global scope (no unit restriction)
 *   - `string` → the user's permission is limited to this unit's subtree
 *
 * Failed checks are audit-logged with PERMISSION_DENIED.
 */
export function withPermission(
    permissionCode: string,
    handler: (req: NextRequest, user: TokenPayload, scopeUnitId: string | null) => Promise<NextResponse>
) {
    return withAuth(async (req, user) => {
        const assignment = await prisma.userPermission.findUnique({
            where: {
                userId_permissionCode: {
                    userId: user.userId,
                    permissionCode,
                },
            },
        });

        // No assignment at all
        if (!assignment) {
            await logAudit({
                userId: user.userId,
                action: 'PERMISSION_DENIED',
                detail: { required: permissionCode, reason: 'NO_ASSIGNMENT' },
            });
            return errorResponse('אין הרשאה לביצוע פעולה זו.', 403);
        }

        // Assignment exists but expired
        if (assignment.expiresAt && assignment.expiresAt < new Date()) {
            await logAudit({
                userId: user.userId,
                action: 'PERMISSION_DENIED',
                detail: { required: permissionCode, reason: 'EXPIRED' },
            });
            return errorResponse('ההרשאה פגה. פנה לגורם מוסמך לחידוש.', 403);
        }

        return handler(req, user, assignment.scopeUnitId);
    });
}
