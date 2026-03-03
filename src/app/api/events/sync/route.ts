// ─────────────────────────────────────────────────────────────
// LockPoint — Geofence Sync API
// POST /api/events/sync — forceful sync of location & status
// ─────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, successResponse } from '@/lib/auth/middleware';
import { logAudit, getClientInfo } from '@/lib/auth/audit';
import type { TokenPayload } from '@/lib/auth/jwt';
import { enforceCommanderAttestation, type LocationProof } from '@/lib/auth/attestation-guard';

const syncEventSchema = z.object({
    lat: z.number(),
    lng: z.number(),
    accuracy: z.number(),
    isInsideZone: z.boolean(),
    proof: z.any().optional(), // Expected to be LocationProof if commander
});

export const POST = withAuth(async (req: NextRequest, user: TokenPayload) => {
    const body = await req.json();
    const parsed = syncEventSchema.safeParse(body);

    if (!parsed.success) {
        return successResponse({ error: parsed.error.flatten() }, 400);
    }

    const { lat, lng, accuracy, isInsideZone, proof } = parsed.data;

    const newStatus = isInsideZone ? 'in_base' : 'out_of_base';

    // Fetch the user to see if the status actually changed to emit an audit log
    const currentUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { currentStatus: true, role: true, locationEncPubKey: true }
    });

    const wasStatusChanged = currentUser?.currentStatus !== newStatus;

    if (currentUser?.role === 'commander' || currentUser?.role === 'senior_commander') {
        const attestation = await enforceCommanderAttestation(user.userId, proof as LocationProof);
        if (!attestation.allowed) {
            return successResponse({ error: attestation.error }, 403);
        }

        // Future: Complete ECIES encryption will occur here once §9.10 keys align on mobile
        // For now, we nullify the plaintext location fields but update the timestamp
        // so they don't leak "live" unencrypted coordinates inside the DB.
        await prisma.user.update({
            where: { id: user.userId },
            data: {
                currentStatus: newStatus,
                lastKnownLat: null, // 🔥 Never store plaintext for commanders
                lastKnownLng: null, // 🔥 Never store plaintext for commanders
                lastLocationUpdate: new Date(),
            },
        });
    } else {
        // Soldier Sync — Normal Plaintext Path
        await prisma.user.update({
            where: { id: user.userId },
            data: {
                currentStatus: newStatus,
                lastKnownLat: lat,
                lastKnownLng: lng,
                lastLocationUpdate: new Date(),
            },
        });
    }

    if (wasStatusChanged) {
        await logAudit({
            userId: user.userId,
            action: 'GEOFENCE_SYNC',
            resource: 'User',
            resourceId: user.userId,
            detail: {
                previousStatus: currentUser?.currentStatus,
                newStatus,
                lat,
                lng,
                accuracy
            },
            ...getClientInfo(req),
        });
    }

    return successResponse({
        message: 'Status logically synced',
        status: newStatus
    }, 200);
});
