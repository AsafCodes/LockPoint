// ─────────────────────────────────────────────────────────────
// LockPoint — Dashboard API: Commander View
// GET /api/dashboard/commander — aggregated stats + soldiers
// ─────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withRole, successResponse } from '@/lib/auth/middleware';
import { logAudit, getClientInfo } from '@/lib/auth/audit';
import type { TokenPayload } from '@/lib/auth/jwt';
import { getAllChildUnitIds, getVisibleCommanderIds } from '@/lib/auth/commander-visibility';

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

    // Get visible commander locations (encrypted)
    const visibleCommanderIds = await getVisibleCommanderIds(user.userId, user.role);
    const commanderLocations = await prisma.user.findMany({
        where: { id: { in: visibleCommanderIds }, encryptedLat: { not: null } },
        select: {
            id: true, firstName: true, lastName: true,
            rankCode: true, unitId: true, currentStatus: true,
            encryptedLat: true, encryptedLng: true, encryptedLocNonce: true,
            lastLocationUpdate: true,
            unit: { select: { name: true } },
        },
    });

    // Map Buffer to base64 for JSON serialization
    const serializedCommanders = commanderLocations.map((c: any) => ({
        ...c,
        encryptedLat: c.encryptedLat ? Buffer.from(c.encryptedLat).toString('base64') : null,
        encryptedLng: c.encryptedLng ? Buffer.from(c.encryptedLng).toString('base64') : null,
        isCommander: true,
    }));

    return successResponse({
        stats: { total: soldiers.length, inBase, outOfBase, unknown },
        commanderLocations: serializedCommanders,
        soldiers: soldiers.map((s: any) => ({
            ...s,
            rank: { code: s.rankCode, label: s.rankLabel, level: s.rankLevel },
            unitName: s.unit.name,
        })),
        units: buildUnitTree(units.map((u: any) => ({ ...u, stats: null }))),
        flatUnits: units.map((u: any) => ({ ...u, stats: null })),
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

// Helper to build recursive tree from flat array for OrgTree
function buildUnitTree(flatUnits: any[]): any[] {
    const unitMap = new Map<string, any>();
    const roots: any[] = [];

    // Initialize map
    for (const unit of flatUnits) {
        unitMap.set(unit.id, { ...unit, children: [] });
    }

    // Build tree
    for (const unit of flatUnits) {
        const node = unitMap.get(unit.id);
        if (unit.parentId && unitMap.has(unit.parentId)) {
            unitMap.get(unit.parentId).children.push(node);
        } else {
            roots.push(node);
        }
    }

    return roots;
}
