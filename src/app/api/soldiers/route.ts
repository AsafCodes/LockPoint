// ─────────────────────────────────────────────────────────────
// LockPoint — Soldiers API
// GET  /api/soldiers      — list soldiers (commander+ only, scoped)
// ─────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withRole, successResponse } from '@/lib/auth/middleware';
import { logAudit, getClientInfo } from '@/lib/auth/audit';
import type { TokenPayload } from '@/lib/auth/jwt';

export const GET = withRole(['commander', 'senior_commander'], async (req: NextRequest, user: TokenPayload) => {
    // Get the commander's unit to determine scope
    const currentUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!currentUser) return successResponse([], 200);

    // Recursively get all unit IDs under this commander
    const unitIds = await getUnitScope(currentUser.unitId, user.role);

    const soldiers = await prisma.user.findMany({
        where: {
            role: 'soldier',
            unitId: { in: unitIds },
        },
        select: {
            id: true,
            serviceNumber: true,
            firstName: true,
            lastName: true,
            role: true,
            rankCode: true,
            rankLabel: true,
            rankLevel: true,
            unitId: true,
            currentStatus: true,
            lastKnownLat: true,
            lastKnownLng: true,
            lastLocationUpdate: true,
            unit: { select: { name: true } },
        },
        orderBy: { lastName: 'asc' },
    });

    await logAudit({
        userId: user.userId,
        action: 'VIEW_SOLDIERS',
        detail: { count: soldiers.length },
        ...getClientInfo(req),
    });

    return successResponse(soldiers.map((s: any) => ({
        ...s,
        rank: { code: s.rankCode, label: s.rankLabel, level: s.rankLevel },
        unitName: s.unit.name,
    })));
});

/** Recursively get all unit IDs under a given unit */
async function getUnitScope(unitId: string, role: string): Promise<string[]> {
    if (role === 'senior_commander') {
        // Senior commanders see ALL units
        const allUnits = await prisma.unit.findMany({ select: { id: true } });
        return allUnits.map((u: any) => u.id);
    }

    // Commanders see their unit and all children
    const ids = [unitId];
    const children = await prisma.unit.findMany({
        where: { parentId: unitId },
        select: { id: true },
    });

    for (const child of children) {
        const childIds = await getUnitScope(child.id, 'commander');
        ids.push(...childIds);
    }

    return ids;
}
