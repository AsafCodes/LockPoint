// ─────────────────────────────────────────────────────────────
// LockPoint — RBAC Permission Lifecycle Manager
// Handles granting and revoking permissions with full audit
// trail and separation of duties enforcement.
// ─────────────────────────────────────────────────────────────

import { prisma } from '@/lib/db';
import { logAudit } from './audit';

export interface PermissionResult {
    success: boolean;
    error?: string;
    code?: 'INVALID_PERMISSION' | 'SELF_GRANT' | 'DUPLICATE' | 'NOT_FOUND' | 'EXPIRED';
}

// ─────────────────────────────────────────────────────────────
// Grant a permission to a user
// ─────────────────────────────────────────────────────────────

/**
 * Assigns a specific permission to a user.
 *
 * Security constraints:
 * 1. Permission code must exist in the Permission table.
 * 2. Separation of duties — grantedById !== userId (cannot self-assign).
 * 3. No duplicate assignments (same user + permission).
 * 4. Full audit trail — every grant is logged immutably.
 *
 * @param grantedById    - Who is granting the permission (from JWT, verified)
 * @param userId         - Who receives the permission
 * @param permissionCode - Which permission to assign
 * @param scopeUnitId    - Optional unit scope (null = global)
 * @param reason         - Documented justification
 * @param expiresAt      - Optional auto-expiry date
 */
export async function grantPermission(
    grantedById: string,
    userId: string,
    permissionCode: string,
    scopeUnitId: string | null = null,
    reason?: string,
    expiresAt?: Date
): Promise<PermissionResult> {
    // 1. Separation of duties — cannot grant to yourself
    if (grantedById === userId) {
        await logAudit({
            userId: grantedById,
            action: 'PERMISSION_DENIED',
            resource: 'UserPermission',
            detail: { permissionCode, targetUserId: userId, reason: 'SELF_GRANT' },
        });
        return {
            success: false,
            error: 'לא ניתן להעניק הרשאה לעצמך (הפרדת רשויות).',
            code: 'SELF_GRANT',
        };
    }

    // 2. Verify permission code exists
    const permDef = await prisma.permission.findUnique({
        where: { code: permissionCode },
    });
    if (!permDef) {
        return {
            success: false,
            error: `קוד הרשאה '${permissionCode}' לא קיים במערכת.`,
            code: 'INVALID_PERMISSION',
        };
    }

    // 3. Check for duplicate
    const existing = await prisma.userPermission.findUnique({
        where: {
            userId_permissionCode: { userId, permissionCode },
        },
    });
    if (existing) {
        return {
            success: false,
            error: `למשתמש כבר יש הרשאת ${permDef.label}.`,
            code: 'DUPLICATE',
        };
    }

    // 4. Create the assignment
    await prisma.userPermission.create({
        data: {
            userId,
            permissionCode,
            grantedById,
            scopeUnitId,
            reason: reason ?? null,
            expiresAt: expiresAt ?? null,
        },
    });

    // 5. Audit log — immutable record
    await logAudit({
        userId: grantedById,
        action: 'PERMISSION_GRANTED',
        resource: 'UserPermission',
        resourceId: userId,
        detail: {
            permissionCode,
            permissionLabel: permDef.label,
            targetUserId: userId,
            scopeUnitId,
            reason,
            expiresAt: expiresAt?.toISOString() ?? null,
        },
    });

    return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Revoke a permission from a user
// ─────────────────────────────────────────────────────────────

/**
 * Removes a specific permission from a user.
 *
 * Security constraints:
 * 1. The assignment must exist.
 * 2. Separation of duties — revokedById !== userId (cannot self-revoke
 *    to avoid accountability evasion).
 * 3. Full audit trail — every revocation is logged immutably.
 *
 * @param revokedById    - Who is revoking the permission (from JWT, verified)
 * @param userId         - Whose permission is being revoked
 * @param permissionCode - Which permission to revoke
 * @param reason         - Documented justification for revocation
 */
export async function revokePermission(
    revokedById: string,
    userId: string,
    permissionCode: string,
    reason?: string
): Promise<PermissionResult> {
    // 1. Separation of duties — cannot revoke from yourself
    if (revokedById === userId) {
        await logAudit({
            userId: revokedById,
            action: 'PERMISSION_DENIED',
            resource: 'UserPermission',
            detail: { permissionCode, targetUserId: userId, reason: 'SELF_REVOKE' },
        });
        return {
            success: false,
            error: 'לא ניתן לבטל הרשאה מעצמך (הפרדת רשויות).',
            code: 'SELF_GRANT',
        };
    }

    // 2. Find the existing assignment
    const existing = await prisma.userPermission.findUnique({
        where: {
            userId_permissionCode: { userId, permissionCode },
        },
    });
    if (!existing) {
        return {
            success: false,
            error: 'הרשאה זו אינה קיימת למשתמש.',
            code: 'NOT_FOUND',
        };
    }

    // 3. Fetch label for audit clarity
    const permDef = await prisma.permission.findUnique({
        where: { code: permissionCode },
        select: { label: true },
    });

    // 4. Delete the assignment
    await prisma.userPermission.delete({
        where: {
            userId_permissionCode: { userId, permissionCode },
        },
    });

    // 5. Audit log — immutable record
    await logAudit({
        userId: revokedById,
        action: 'PERMISSION_REVOKED',
        resource: 'UserPermission',
        resourceId: userId,
        detail: {
            permissionCode,
            permissionLabel: permDef?.label ?? permissionCode,
            targetUserId: userId,
            revokedReason: reason,
            originalGrantedById: existing.grantedById,
            originalGrantedAt: existing.grantedAt.toISOString(),
        },
    });

    return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Query: list active permissions for a user
// ─────────────────────────────────────────────────────────────

/**
 * Returns all active (non-expired) permissions for a user.
 * Used by admin dashboards and audit views.
 */
export async function getUserPermissions(userId: string) {
    const now = new Date();
    return prisma.userPermission.findMany({
        where: {
            userId,
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: now } },
            ],
        },
        include: {
            permission: { select: { code: true, label: true, category: true } },
        },
        orderBy: { grantedAt: 'desc' },
    });
}
