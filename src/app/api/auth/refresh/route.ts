// ─────────────────────────────────────────────────────────────
// LockPoint — Auth API: Token Refresh
// POST /api/auth/refresh
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { logAudit, getClientInfo } from '@/lib/auth/audit';

const refreshSchema = z.object({
    refreshToken: z.string().min(1),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = refreshSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION', message: 'טוקן רענון חסר.' } },
                { status: 400 }
            );
        }

        const { refreshToken } = parsed.data;

        // Verify the token signature
        let payload;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch {
            return NextResponse.json(
                { success: false, error: { code: 'AUTH', message: 'טוקן רענון לא תקף.' } },
                { status: 401 }
            );
        }

        // Check that it exists in DB (not revoked)
        const stored = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
        });

        if (!stored || stored.expiresAt < new Date()) {
            // Clean up expired token
            if (stored) {
                await prisma.refreshToken.delete({ where: { id: stored.id } });
            }
            return NextResponse.json(
                { success: false, error: { code: 'AUTH', message: 'טוקן רענון פג תוקף.' } },
                { status: 401 }
            );
        }

        // Rotate: delete old token, create new pair
        await prisma.refreshToken.delete({ where: { id: stored.id } });

        const newPayload = { userId: payload.userId, serviceNumber: payload.serviceNumber, role: payload.role };
        const newAccessToken = signAccessToken(newPayload);
        const newRefreshToken = signRefreshToken(newPayload);

        await prisma.refreshToken.create({
            data: {
                token: newRefreshToken,
                userId: payload.userId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        await logAudit({
            userId: payload.userId,
            action: 'TOKEN_REFRESH',
            ...getClientInfo(req),
        });

        return NextResponse.json({
            success: true,
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            },
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error('[REFRESH]', err);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL', message: 'שגיאת מערכת.' } },
            { status: 500 }
        );
    }
}
