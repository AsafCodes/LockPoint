// ─────────────────────────────────────────────────────────────
// LockPoint — Reports API
// POST /api/reports — submit an exit report (soldier)
// ─────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, successResponse } from '@/lib/auth/middleware';
import { logAudit, getClientInfo } from '@/lib/auth/audit';
import type { TokenPayload } from '@/lib/auth/jwt';

const reportSchema = z.object({
    eventId: z.string().min(1),
    destination: z.string().min(1),
    reason: z.enum(['personal_leave', 'medical', 'official_duty', 'training', 'emergency', 'other']),
    freeText: z.string().optional(),
    estimatedReturn: z.string().optional(), // ISO-8601
});

export const POST = withAuth(async (req: NextRequest, user: TokenPayload) => {
    const body = await req.json();
    const parsed = reportSchema.safeParse(body);

    if (!parsed.success) {
        return successResponse({ error: parsed.error.flatten() }, 400);
    }

    // ── BOLA Remediation: Ownership Check ────────────────────────
    // Verify the event exists and belongs to the requesting soldier
    const event = await prisma.geofenceEvent.findUnique({
        where: { id: parsed.data.eventId },
        select: { soldierId: true }
    });

    if (!event) {
        return successResponse({ error: 'האירוע לא נמצא' }, 404);
    }

    if (event.soldierId !== user.userId) {
        return successResponse({ error: 'אין הרשאה: לא ניתן לדווח על אירוע של חייל אחר' }, 403);
    }

    const report = await prisma.exitReport.create({
        data: {
            soldierId: user.userId,
            eventId: parsed.data.eventId,
            destination: parsed.data.destination,
            reason: parsed.data.reason,
            freeText: parsed.data.freeText ?? null,
            estimatedReturn: parsed.data.estimatedReturn ? new Date(parsed.data.estimatedReturn) : null,
        },
    });

    await logAudit({
        userId: user.userId,
        action: 'SUBMIT_REPORT',
        resource: 'ExitReport',
        resourceId: report.id,
        detail: { destination: parsed.data.destination, reason: parsed.data.reason },
        ...getClientInfo(req),
    });

    return successResponse(report, 201);
});
