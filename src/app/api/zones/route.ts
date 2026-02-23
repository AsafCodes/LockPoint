// ─────────────────────────────────────────────────────────────
// LockPoint — Zones API
// GET  /api/zones — list geofence zones
// POST /api/zones — create a new zone (senior_commander only)
// ─────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, withRole, successResponse } from '@/lib/auth/middleware';
import { logAudit, getClientInfo } from '@/lib/auth/audit';
import type { TokenPayload } from '@/lib/auth/jwt';

// ── GET: List zones (all authenticated users can read) ───────

export const GET = withAuth(async (_req: NextRequest, _user: TokenPayload) => {
    const zones = await prisma.geofenceZone.findMany({
        include: { unit: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
    });

    return successResponse(zones);
});

// ── POST: Create zone ────────────────────────────────────────

const createZoneSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    shapeType: z.enum(['circle', 'polygon']),
    centerLat: z.number().optional(),
    centerLng: z.number().optional(),
    radiusMeters: z.number().positive().optional(),
    vertices: z.array(z.object({ lat: z.number(), lng: z.number() })).optional(),
    isActive: z.boolean().default(true),
    unitId: z.string().min(1),
});

export const POST = withRole(['senior_commander'], async (req: NextRequest, user: TokenPayload) => {
    const body = await req.json();
    const parsed = createZoneSchema.safeParse(body);

    if (!parsed.success) {
        return successResponse({ error: parsed.error.flatten() }, 400);
    }

    const zone = await prisma.geofenceZone.create({
        data: {
            ...parsed.data,
            vertices: parsed.data.vertices ? JSON.stringify(parsed.data.vertices) : null,
            createdBy: user.userId,
        },
    });

    await logAudit({
        userId: user.userId,
        action: 'CREATE_ZONE',
        resource: 'GeofenceZone',
        resourceId: zone.id,
        detail: { name: zone.name },
        ...getClientInfo(req),
    });

    return successResponse(zone, 201);
});
