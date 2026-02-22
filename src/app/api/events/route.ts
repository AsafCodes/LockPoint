// ─────────────────────────────────────────────────────────────
// LockPoint — Events API
// GET  /api/events — list geofence events (commander+)
// POST /api/events — record a transition (soldier)
// ─────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, withRole, successResponse } from '@/lib/auth/middleware';
import { logAudit, getClientInfo } from '@/lib/auth/audit';
import type { TokenPayload } from '@/lib/auth/jwt';

// ── GET: List recent events ──────────────────────────────────

export const GET = withRole(['commander', 'senior_commander'], async (_req: NextRequest, _user: TokenPayload) => {
    const events = await prisma.geofenceEvent.findMany({
        include: {
            soldier: { select: { firstName: true, lastName: true, rankCode: true, serviceNumber: true } },
            zone: { select: { name: true } },
        },
        orderBy: { timestamp: 'desc' },
        take: 50,
    });

    return successResponse(events.map((e: any) => ({
        id: e.id,
        soldierId: e.soldierId,
        soldierName: `${e.soldier.rankCode} ${e.soldier.lastName}`,
        zoneId: e.zoneId,
        zoneName: e.zone.name,
        transition: e.transition,
        location: { lat: e.lat, lng: e.lng },
        accuracy: e.accuracy,
        timestamp: e.timestamp.toISOString(),
    })));
});

// ── POST: Record a geofence transition ───────────────────────

const createEventSchema = z.object({
    zoneId: z.string().min(1),
    transition: z.enum(['ENTER', 'EXIT', 'STAY']),
    lat: z.number(),
    lng: z.number(),
    accuracy: z.number(),
    batteryLevel: z.number().int().min(0).max(100).optional(),
});

export const POST = withAuth(async (req: NextRequest, user: TokenPayload) => {
    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
        return successResponse({ error: parsed.error.flatten() }, 400);
    }

    const event = await prisma.geofenceEvent.create({
        data: {
            soldierId: user.userId,
            ...parsed.data,
        },
    });

    // Also update the soldier's status
    const newStatus = parsed.data.transition === 'ENTER' ? 'in_base' : 'out_of_base';
    await prisma.user.update({
        where: { id: user.userId },
        data: {
            currentStatus: newStatus,
            lastKnownLat: parsed.data.lat,
            lastKnownLng: parsed.data.lng,
            lastLocationUpdate: new Date(),
        },
    });

    await logAudit({
        userId: user.userId,
        action: 'GEOFENCE_EVENT',
        resource: 'GeofenceEvent',
        resourceId: event.id,
        detail: { transition: parsed.data.transition, zoneId: parsed.data.zoneId },
        ...getClientInfo(req),
    });

    return successResponse(event, 201);
});
