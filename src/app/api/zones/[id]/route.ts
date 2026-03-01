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
    shapeType: z.enum(['circle', 'polygon']).optional(),
    centerLat: z.number().optional(),
    centerLng: z.number().optional(),
    radiusMeters: z.number().positive().optional(),
    vertices: z.string().optional(), // JSON-encoded [{lat,lng},...]
    isActive: z.boolean().optional(),
});

// ── BOLA Remediation: Ownership Check ────────────────────────
// Ensure the zone exists and belongs to the commander's unit hierarchy.

async function verifyZoneScope(zoneId: string, userId: string) {
    const zone = await prisma.geofenceZone.findUnique({ where: { id: zoneId } });
    if (!zone) return { error: 'אזור לא נמצא', status: 404 };

    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { unitId: true } });
    if (!currentUser) return { error: 'משתמש לא נמצא', status: 404 };

    const allowedUnitIds = await getAllChildUnitIds(currentUser.unitId);
    if (!allowedUnitIds.includes(zone.unitId)) {
        return { error: 'אין הרשאה: האזור מחוץ לתחום הפיקוד שלך', status: 403 };
    }

    return { zone };
}

async function getAllChildUnitIds(unitId: string): Promise<string[]> {
    const ids = [unitId];
    const children = await prisma.unit.findMany({
        where: { parentId: unitId },
        select: { id: true },
    });
    for (const child of children) {
        ids.push(...await getAllChildUnitIds(child.id));
    }
    return ids;
}

// ── PUT: Update zone ─────────────────────────────────────────

export const PUT = withRole(['senior_commander'], async (
    req: NextRequest, user: TokenPayload
) => {
    const id = req.nextUrl.pathname.split('/').pop()!;

    // BOLA Check: Validate existence and ownership
    const scopeCheck = await verifyZoneScope(id, user.userId);
    if (scopeCheck.error) {
        return successResponse({ error: scopeCheck.error }, scopeCheck.status);
    }

    const body = await req.json();
    const parsed = updateZoneSchema.safeParse(body);

    if (!parsed.success) {
        return successResponse({ error: parsed.error.flatten() }, 400);
    }

    const updatedZone = await prisma.geofenceZone.update({
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

    return successResponse(updatedZone);
});

// ── DELETE: Delete zone ──────────────────────────────────────

export const DELETE = withRole(['senior_commander'], async (
    req: NextRequest, user: TokenPayload
) => {
    const id = req.nextUrl.pathname.split('/').pop()!;

    // BOLA Check: Validate existence and ownership
    const scopeCheck = await verifyZoneScope(id, user.userId);
    if (scopeCheck.error) {
        return successResponse({ error: scopeCheck.error }, scopeCheck.status);
    }

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
