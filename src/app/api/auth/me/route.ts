// ─────────────────────────────────────────────────────────────
// LockPoint — Auth API: Get Current User
// GET /api/auth/me
// ─────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, successResponse } from '@/lib/auth/middleware';
import type { TokenPayload } from '@/lib/auth/jwt';

export const GET = withAuth(async (_req: NextRequest, user: TokenPayload) => {
    const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
            id: true,
            serviceNumber: true,
            firstName: true,
            lastName: true,
            role: true,
            rankCode: true,
            rankLabel: true,
            rankLevel: true,
            unitId: true,
            currentStatus: true,
            lastKnownLat: true,
            lastKnownLng: true,
            lastLocationUpdate: true,
        },
    });

    if (!dbUser) {
        return successResponse(null, 404);
    }

    return successResponse({
        ...dbUser,
        rank: { code: dbUser.rankCode, label: dbUser.rankLabel, level: dbUser.rankLevel },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
});
