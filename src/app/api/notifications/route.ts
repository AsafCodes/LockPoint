// ─────────────────────────────────────────────────────────────
// LockPoint — Notifications API
// GET  /api/notifications — list my notifications
// PATCH /api/notifications — mark notifications as read
// ─────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, successResponse } from '@/lib/auth/middleware';
import { withCors, handlePreflight } from '@/lib/api/cors';
import type { TokenPayload } from '@/lib/auth/jwt';

export async function OPTIONS(req: NextRequest) {
    return handlePreflight(req);
}

// ── GET: List my notifications ───────────────────────────────

export const GET = withAuth(async (req: NextRequest, user: TokenPayload) => {
    const url = new URL(req.url);
    const unreadOnly = url.searchParams.get('unread') === 'true';

    const notifications = await prisma.notification.findMany({
        where: {
            userId: user.userId,
            ...(unreadOnly ? { isRead: false } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    const unreadCount = await prisma.notification.count({
        where: { userId: user.userId, isRead: false },
    });

    return withCors(successResponse({ notifications, unreadCount }), req);
});

// ── PATCH: Mark notifications as read ────────────────────────

const markReadSchema = z.object({
    ids: z.array(z.string()).min(1).optional(),
    markAllRead: z.boolean().optional(),
});

export const PATCH = withAuth(async (req: NextRequest, user: TokenPayload) => {
    const body = await req.json();
    const parsed = markReadSchema.safeParse(body);

    if (!parsed.success) {
        return withCors(successResponse({ error: parsed.error.flatten() }, 400), req);
    }

    const { ids, markAllRead } = parsed.data;

    if (markAllRead) {
        await prisma.notification.updateMany({
            where: { userId: user.userId, isRead: false },
            data: { isRead: true },
        });
    } else if (ids) {
        await prisma.notification.updateMany({
            where: { id: { in: ids }, userId: user.userId },
            data: { isRead: true },
        });
    }

    return withCors(successResponse({ ok: true }), req);
});
