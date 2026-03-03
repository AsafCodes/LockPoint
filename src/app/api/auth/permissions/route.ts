// ─────────────────────────────────────────────────────────────
// LockPoint — My Permissions API
// GET /api/auth/permissions — returns the calling user's active permissions
// Used by the frontend to gate UI elements (buttons, panels, tabs)
// ─────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server';
import { withAuth, successResponse } from '@/lib/auth/middleware';
import type { TokenPayload } from '@/lib/auth/jwt';
import { getUserPermissions } from '@/lib/auth/permission-manager';

export const GET = withAuth(async (_req: NextRequest, user: TokenPayload) => {
    const permissions = await getUserPermissions(user.userId);

    return successResponse({
        permissions: permissions.map((p: any) => ({
            code: p.permission.code,
            label: p.permission.label,
            category: p.permission.category,
            scopeUnitId: p.scopeUnitId,
            expiresAt: p.expiresAt?.toISOString() || null,
        })),
    });
});
