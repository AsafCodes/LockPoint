// ─────────────────────────────────────────────────────────────
// LockPoint — Cron Alert Checker
// GET /api/cron/check-alerts — Polls for notification triggers
// ─────────────────────────────────────────────────────────────
// This endpoint is called periodically (e.g., every 5 minutes)
// by an external cron service (Render Cron, Vercel Cron, etc.)
// or manually via fetch. It implements three alert rules:
//
//   Rule A: Handled client-side (exit report prompt)
//   Rule B: Soldier exited geofence >10min ago without report → alert commander
//   Rule C: Soldier status "unknown" >15min → alert commander (with cooldown)
//
// It also captures StatusSnapshots for the BI data layer.
// ─────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse } from '@/lib/auth/middleware';
import { NOTIFICATIONS } from '@/lib/constants';
import { isInsideZone } from '@/lib/geo/geofence-calc';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
    const now = new Date();
    let ruleB_count = 0;
    let ruleC_count = 0;
    let ruleD_count = 0;
    let snapshot_count = 0;

    // ── Rule B: EXIT without report ──────────────────────────
    // Find EXIT events older than threshold with no linked ExitReport
    const exitThreshold = new Date(now.getTime() - NOTIFICATIONS.EXIT_NO_REPORT_MINUTES * 60_000);

    const unreportedExits = await prisma.geofenceEvent.findMany({
        where: {
            transition: 'EXIT',
            timestamp: { lt: exitThreshold },
            exitReport: null, // no report submitted
        },
        include: {
            soldier: {
                select: {
                    id: true, firstName: true, lastName: true,
                    rankCode: true, unitId: true,
                },
            },
            zone: { select: { name: true } },
        },
    });

    for (const event of unreportedExits) {
        // Find the commanders for this soldier's unit (walk up the tree)
        const commanders = await findCommandersForUnit(event.soldier.unitId);

        for (const cmdId of commanders) {
            // Check if we already alerted about this specific event
            const existing = await prisma.notification.findFirst({
                where: {
                    userId: cmdId,
                    type: 'EXIT_NO_REPORT',
                    relatedId: event.id,
                },
            });

            if (!existing) {
                await prisma.notification.create({
                    data: {
                        userId: cmdId,
                        type: 'EXIT_NO_REPORT',
                        title: `${event.soldier.rankCode} ${event.soldier.lastName} — יציאה ללא דיווח`,
                        body: `יצא מ${event.zone.name} לפני ${NOTIFICATIONS.EXIT_NO_REPORT_MINUTES} דק\' ללא דוח יציאה.`,
                        relatedId: event.id,
                    },
                });
                ruleB_count++;
            }
        }
    }

    // ── Rule C: Unknown status for too long ──────────────────
    const unknownThreshold = new Date(now.getTime() - NOTIFICATIONS.UNKNOWN_STATUS_FIRST_ALERT_MINUTES * 60_000);
    const repeatCooldown = new Date(now.getTime() - NOTIFICATIONS.UNKNOWN_STATUS_REPEAT_MINUTES * 60_000);

    const unknownSoldiers = await prisma.user.findMany({
        where: {
            role: 'soldier',
            currentStatus: 'unknown',
            OR: [
                { lastLocationUpdate: { lt: unknownThreshold } },
                { lastLocationUpdate: null },
            ],
        },
        select: {
            id: true, firstName: true, lastName: true,
            rankCode: true, unitId: true, lastLocationUpdate: true,
        },
    });

    for (const soldier of unknownSoldiers) {
        const commanders = await findCommandersForUnit(soldier.unitId);

        for (const cmdId of commanders) {
            // Check cooldown — don't spam commanders
            const lastAlert = await prisma.notification.findFirst({
                where: {
                    userId: cmdId,
                    type: 'UNKNOWN_STATUS',
                    relatedId: soldier.id,
                    createdAt: { gt: repeatCooldown },
                },
            });

            if (!lastAlert) {
                const minutesAgo = soldier.lastLocationUpdate
                    ? Math.round((now.getTime() - soldier.lastLocationUpdate.getTime()) / 60_000)
                    : null;

                await prisma.notification.create({
                    data: {
                        userId: cmdId,
                        type: 'UNKNOWN_STATUS',
                        title: `${soldier.rankCode} ${soldier.lastName} — מיקום לא ידוע`,
                        body: minutesAgo
                            ? `לא דיווח מיקום כבר ${minutesAgo} דקות. יש לבדוק.`
                            : `לא דיווח מיקום מעולם. יש לבדוק.`,
                        relatedId: soldier.id,
                    },
                });
                ruleC_count++;
            }
        }
    }

    // ── Rule D: Spatial Re-evaluation ─────────────────────────
    // Check if each soldier's last known position matches their
    // current status. Auto-correct stale statuses.
    const activeZones = await prisma.geofenceZone.findMany({
        where: { isActive: true },
        select: {
            id: true, name: true, shapeType: true,
            centerLat: true, centerLng: true, radiusMeters: true,
            vertices: true,
        },
    });

    if (activeZones.length > 0) {
        const soldiersWithLocation = await prisma.user.findMany({
            where: {
                role: 'soldier',
                lastKnownLat: { not: null },
                lastKnownLng: { not: null },
            },
            select: {
                id: true, firstName: true, lastName: true,
                rankCode: true, unitId: true,
                currentStatus: true,
                lastKnownLat: true, lastKnownLng: true,
            },
        });

        for (const soldier of soldiersWithLocation) {
            const lat = soldier.lastKnownLat!;
            const lng = soldier.lastKnownLng!;

            // Check if inside ANY active zone
            let insideZone: { id: string; name: string } | null = null;
            for (const zone of activeZones) {
                if (isInsideZone(lat, lng, zone)) {
                    insideZone = { id: zone.id, name: zone.name };
                    break;
                }
            }

            const spatialStatus = insideZone ? 'in_base' : 'out_of_base';
            const currentStatus = soldier.currentStatus;

            // Only correct if there's a mismatch (and status isn't 'unknown')
            if (currentStatus !== 'unknown' && currentStatus !== spatialStatus) {
                // Auto-correct status
                await prisma.user.update({
                    where: { id: soldier.id },
                    data: { currentStatus: spatialStatus },
                });

                // Create audit event
                const transition = spatialStatus === 'in_base' ? 'ENTER' : 'EXIT';
                await prisma.geofenceEvent.create({
                    data: {
                        soldierId: soldier.id,
                        zoneId: insideZone?.id || activeZones[0].id,
                        transition,
                        lat,
                        lng,
                        accuracy: 0, // server-side correction
                    },
                });

                // Notify commanders
                const commanders = await findCommandersForUnit(soldier.unitId);
                for (const cmdId of commanders) {
                    await prisma.notification.create({
                        data: {
                            userId: cmdId,
                            type: 'STATUS_CORRECTION',
                            title: `${soldier.rankCode} ${soldier.lastName} — תיקון סטטוס אוטומטי`,
                            body: spatialStatus === 'in_base'
                                ? `נמצא בתוך ${insideZone!.name} — סטטוס עודכן ל"בבסיס".`
                                : `לא נמצא בתוך אף אזור — סטטוס עודכן ל"מחוץ לבסיס".`,
                            relatedId: soldier.id,
                        },
                    });
                }

                ruleD_count++;
            }
        }
    }

    // ── BI: Capture StatusSnapshots ──────────────────────────
    const allSoldiers = await prisma.user.findMany({
        where: { role: 'soldier' },
        select: {
            id: true, unitId: true, currentStatus: true,
            lastKnownLat: true, lastKnownLng: true,
        },
    });

    if (allSoldiers.length > 0) {
        await prisma.statusSnapshot.createMany({
            data: allSoldiers.map((s: { id: string; unitId: string; currentStatus: string; lastKnownLat: number | null; lastKnownLng: number | null }) => ({
                soldierId: s.id,
                unitId: s.unitId,
                status: s.currentStatus,
                lat: s.lastKnownLat,
                lng: s.lastKnownLng,
            })),
        });
        snapshot_count = allSoldiers.length;
    }

    return successResponse({
        ok: true,
        timestamp: now.toISOString(),
        alerts: { ruleB: ruleB_count, ruleC: ruleC_count, ruleD: ruleD_count },
        snapshots: snapshot_count,
    });
}

// ── Helper: Find commanders up the unit hierarchy ────────────

async function findCommandersForUnit(unitId: string): Promise<string[]> {
    const commanderIds: string[] = [];
    let currentUnitId: string | null = unitId;

    // Walk up to 6 levels to find commanders
    for (let i = 0; i < 6 && currentUnitId; i++) {
        const unit: { commanderId: string | null; parentId: string | null } | null = await prisma.unit.findUnique({
            where: { id: currentUnitId },
            select: { commanderId: true, parentId: true },
        });

        if (!unit) break;
        if (unit.commanderId) commanderIds.push(unit.commanderId);
        currentUnitId = unit.parentId;
    }

    return commanderIds;
}
