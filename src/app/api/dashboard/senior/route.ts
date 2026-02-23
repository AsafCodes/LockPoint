// ─────────────────────────────────────────────────────────────
// LockPoint — Dashboard API: Senior Commander (Global Overview)
// GET /api/dashboard/senior — global force overview
// ─────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withRole, successResponse } from '@/lib/auth/middleware';
import { logAudit, getClientInfo } from '@/lib/auth/audit';
import type { TokenPayload } from '@/lib/auth/jwt';

export const GET = withRole(['senior_commander'], async (req: NextRequest, user: TokenPayload) => {
    // Get ALL soldiers
    const soldiers = await prisma.user.findMany({
        where: { role: 'soldier' },
        select: {
            id: true,
            currentStatus: true,
            unitId: true,
        },
    });

    // Get ALL units (for org tree)
    const units = await prisma.unit.findMany({
        select: { id: true, name: true, type: true, parentId: true, commanderId: true },
        orderBy: { type: 'asc' },
    });

    // Build children map for fast topological traversal
    const childrenMap = new Map<string, string[]>();
    for (const u of units) {
        if (u.parentId) {
            if (!childrenMap.has(u.parentId)) childrenMap.set(u.parentId, []);
            childrenMap.get(u.parentId)!.push(u.id);
        }
    }

    // Recursively get all descendant unit IDs
    function getDescendants(id: string): string[] {
        const children = childrenMap.get(id) || [];
        let desc = [...children];
        for (const childId of children) {
            desc.push(...getDescendants(childId));
        }
        return desc;
    }

    // Aggregate per unit (including all descendants)
    const unitStats = units.map((unit: any) => {
        const allIds = new Set([unit.id, ...getDescendants(unit.id)]);
        const unitSoldiers = soldiers.filter((s: any) => allIds.has(s.unitId));

        return {
            ...unit,
            stats: {
                totalPersonnel: unitSoldiers.length,
                inBase: unitSoldiers.filter((s: any) => s.currentStatus === 'in_base').length,
                outOfBase: unitSoldiers.filter((s: any) => s.currentStatus === 'out_of_base').length,
                unknown: unitSoldiers.filter((s: any) => s.currentStatus === 'unknown').length,
            },
        };
    });

    // Global totals
    const total = soldiers.length;
    const inBase = soldiers.filter((s: any) => s.currentStatus === 'in_base').length;
    const outOfBase = soldiers.filter((s: any) => s.currentStatus === 'out_of_base').length;
    const unknown = soldiers.filter((s: any) => s.currentStatus === 'unknown').length;

    // Recent events
    const events = await prisma.geofenceEvent.findMany({
        include: {
            soldier: { select: { firstName: true, lastName: true, rankCode: true } },
            zone: { select: { name: true } },
        },
        orderBy: { timestamp: 'desc' },
        take: 30,
    });

    await logAudit({
        userId: user.userId,
        action: 'VIEW_DASHBOARD',
        detail: { scope: 'senior' },
        ...getClientInfo(req),
    });

    return successResponse({
        globalStats: { total, inBase, outOfBase, unknown },
        units: unitStats.map((u: any) => ({ ...u, children: [] })),
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
