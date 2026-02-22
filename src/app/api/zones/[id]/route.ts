// ─────────────────────────────────────────────────────────────
// LockPoint — Individual Zone API
// PUT    /api/zones/[id] — update a zone (senior_commander only)
// DELETE /api/zones/[id] — delete a zone (senior_commander only)
// ─────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withRole, successResponse } from '@/lib/auth/middleware';
import { logAudit, getClientInfo } from '@/lib/auth/audit';
import type { TokenPayload } from '@/lib/auth/jwt';

const updateZoneSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    centerLat: z.number().optional(),
    centerLng: z.number().optional(),
    radiusMeters: z.number().positive().optional(),
    isActive: z.boolean().optional(),
});

// ── PUT: Update zone ─────────────────────────────────────────

export const PUT = withRole(['senior_commander'], async (
    req: NextRequest, user: TokenPayload
) => {
    const id = req.nextUrl.pathname.split('/').pop()!;
    const body = await req.json();
    const parsed = updateZoneSchema.safeParse(body);

    if (!parsed.success) {
        return successResponse({ error: parsed.error.flatten() }, 400);
    }

    const zone = await prisma.geofenceZone.update({
        where: { id },
        data: parsed.data,
    });

    await logAudit({
        userId: user.userId,
        action: 'UPDATE_ZONE',
        resource: 'GeofenceZone',
        resourceId: id,
        detail: parsed.data,
        ...getClientInfo(req),
    });

    return successResponse(zone);
});

// ── DELETE: Delete zone ──────────────────────────────────────

export const DELETE = withRole(['senior_commander'], async (
    req: NextRequest, user: TokenPayload
) => {
    const id = req.nextUrl.pathname.split('/').pop()!;

    await prisma.geofenceZone.delete({ where: { id } });

    await logAudit({
        userId: user.userId,
        action: 'DELETE_ZONE',
        resource: 'GeofenceZone',
        resourceId: id,
        ...getClientInfo(req),
    });

    return successResponse({ deleted: true });
});
