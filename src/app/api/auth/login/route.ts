// ─────────────────────────────────────────────────────────────
// LockPoint — Auth API: Login
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { logAudit, getClientInfo } from '@/lib/auth/audit';

const loginSchema = z.object({
    serviceNumber: z.string().min(1),
    password: z.string().min(1),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = loginSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION', message: 'נתונים לא תקינים.' } },
                { status: 400 }
            );
        }

        const { serviceNumber, password } = parsed.data;

        // Find user by service number
        const user = await prisma.user.findUnique({
            where: { serviceNumber },
            include: { unit: true },
        });

        if (!user) {
            await logAudit({
                action: 'LOGIN_FAILED',
                detail: { serviceNumber, reason: 'user_not_found' },
                ...getClientInfo(req),
            });
            return NextResponse.json(
                { success: false, error: { code: 'AUTH', message: 'מספר אישי או סיסמה שגויים.' } },
                { status: 401 }
            );
        }

        // Verify password
        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
            await logAudit({
                userId: user.id,
                action: 'LOGIN_FAILED',
                detail: { reason: 'invalid_password' },
                ...getClientInfo(req),
            });
            return NextResponse.json(
                { success: false, error: { code: 'AUTH', message: 'מספר אישי או סיסמה שגויים.' } },
                { status: 401 }
            );
        }

        // Generate tokens
        const payload = { userId: user.id, serviceNumber: user.serviceNumber, role: user.role };
        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken(payload);

        // Store refresh token in DB
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        // Audit log
        await logAudit({
            userId: user.id,
            action: 'LOGIN',
            ...getClientInfo(req),
        });

        // Return user profile + tokens
        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    serviceNumber: user.serviceNumber,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    rank: { code: user.rankCode, label: user.rankLabel, level: user.rankLevel },
                    unitId: user.unitId,
                    currentStatus: user.currentStatus,
                },
                tokens: {
                    accessToken,
                    refreshToken,
                    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                },
            },
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error('[LOGIN]', err);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL', message: 'שגיאת מערכת.' } },
            { status: 500 }
        );
    }
}
