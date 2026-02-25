// ─────────────────────────────────────────────────────────────
// LockPoint — Immutable Audit Logger
// ─────────────────────────────────────────────────────────────

import { prisma } from '@/lib/db';

export type AuditAction =
    | 'LOGIN'
    | 'LOGIN_FAILED'
    | 'LOGOUT'
    | 'TOKEN_REFRESH'
    | 'UPDATE_STATUS'
    | 'CREATE_ZONE'
    | 'UPDATE_ZONE'
    | 'DELETE_ZONE'
    | 'GEOFENCE_EVENT'
    | 'GEOFENCE_SYNC'
    | 'SUBMIT_REPORT'
    | 'VIEW_SOLDIERS'
    | 'VIEW_DASHBOARD';

interface AuditOptions {
    userId?: string;
    action: AuditAction;
    resource?: string;
    resourceId?: string;
    detail?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Write an immutable audit log entry.
 * This function never throws — audit failures are silently logged to console.
 */
export async function logAudit(opts: AuditOptions): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId: opts.userId ?? null,
                action: opts.action,
                resource: opts.resource ?? null,
                resourceId: opts.resourceId ?? null,
                detail: opts.detail ? JSON.stringify(opts.detail) : null,
                ipAddress: opts.ipAddress ?? null,
                userAgent: opts.userAgent ?? null,
            },
        });
    } catch (err) {
        // Audit logs should never crash the app
        console.error('[AUDIT] Failed to write audit log:', err);
    }
}

/** Extract client info from a Request for audit purposes */
export function getClientInfo(req: Request): { ipAddress?: string; userAgent?: string } {
    return {
        ipAddress: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined,
        userAgent: req.headers.get('user-agent') ?? undefined,
    };
}
