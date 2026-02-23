// ─────────────────────────────────────────────────────────────
// LockPoint — Dashboard API: Commander View
// GET /api/dashboard/commander — aggregated stats + soldiers
// ─────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withRole, successResponse } from '@/lib/auth/middleware';
import { logAudit, getClientInfo } from '@/lib/auth/audit';
import type { TokenPayload } from '@/lib/auth/jwt';

export const GET = withRole(['commander', 'senior_commander'], async (req: NextRequest, user: TokenPayload) => {
    const currentUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!currentUser) return successResponse(null, 404);

    // Get all units in scope
    const unitIds = await getAllChildUnitIds(currentUser.unitId);

    // Get all soldiers in scope
    const soldiers = await prisma.user.findMany({
        where: { role: 'soldier', unitId: { in: unitIds } },
        select: {
            id: true, serviceNumber: true, firstName: true, lastName: true,
            rankCode: true, rankLabel: true, rankLevel: true,
            unitId: true, currentStatus: true,
            lastKnownLat: true, lastKnownLng: true, lastLocationUpdate: true,
            unit: { select: { id: true, name: true } },
        },
        orderBy: { lastName: 'asc' },
    });

    // Get org tree
    const units = await prisma.unit.findMany({
        where: { id: { in: unitIds } },
        select: { id: true, name: true, type: true, parentId: true, commanderId: true },
    });

    // Get recent events
    const events = await prisma.geofenceEvent.findMany({
        where: { soldierId: { in: soldiers.map((s: any) => s.id) } },
        include: {
            soldier: { select: { firstName: true, lastName: true, rankCode: true } },
            zone: { select: { name: true } },
        },
        orderBy: { timestamp: 'desc' },
        take: 20,
    });

    // Get active geofence zones for the map
    const zones = await prisma.geofenceZone.findMany({
        where: { unitId: { in: unitIds } },
        select: {
            id: true, name: true, shapeType: true,
            centerLat: true, centerLng: true, radiusMeters: true,
            isActive: true,
        },
    });

    // Aggregation
    const inBase = soldiers.filter((s: any) => s.currentStatus === 'in_base').length;
    const outOfBase = soldiers.filter((s: any) => s.currentStatus === 'out_of_base').length;
    const unknown = soldiers.filter((s: any) => s.currentStatus === 'unknown').length;

    await logAudit({
        userId: user.userId,
        action: 'VIEW_DASHBOARD',
        detail: { scope: 'commander' },
        ...getClientInfo(req),
    });

    return successResponse({
        stats: { total: soldiers.length, inBase, outOfBase, unknown },
        soldiers: soldiers.map((s: any) => ({
            ...s,
            rank: { code: s.rankCode, label: s.rankLabel, level: s.rankLevel },
            unitName: s.unit.name,
        })),
        units: units.map((u: any) => ({ ...u, children: [], stats: null })),
        zones,
        events: events.map((e: any) => ({
            id: e.id,
            soldierId: e.soldierId,
            soldierName: `${e.soldier.rankCode} ${e.soldier.lastName}`,
            zoneId: e.zoneId,
            zoneName: e.zone.name,
            transition: e.transition,
            location: { lat: e.lat, lng: e.lng },
            accuracy: e.accuracy,
            timestamp: e.timestamp.toISOString(),
        })),
    });
});

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
