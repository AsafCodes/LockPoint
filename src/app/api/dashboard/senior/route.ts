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

    // Aggregate per unit
    const unitStats = units.map((unit: any) => {
        const unitSoldiers = soldiers.filter((s: any) => s.unitId === unit.id);
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

    // Roll up stats to parent units
    const statsMap = new Map<string, { totalPersonnel: number, inBase: number, outOfBase: number, unknown: number }>(
        unitStats.map((u: any) => [u.id, u.stats])
    );
    for (const unit of unitStats) {
        if (unit.parentId && statsMap.has(unit.parentId)) {
            const parent = statsMap.get(unit.parentId)!;
            parent.totalPersonnel += unit.stats.totalPersonnel;
            parent.inBase += unit.stats.inBase;
            parent.outOfBase += unit.stats.outOfBase;
            parent.unknown += unit.stats.unknown;
        }
    }

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
