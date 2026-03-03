// ─────────────────────────────────────────────────────────────
// LockPoint — Commander Visibility Logic
// Determines which commanders a given user is permitted to see.
//
// Rules:
// 1. soldier        → sees NO commander locations
// 2. senior_commander → sees ALL commander locations
// 3. commander      → sees commanders in child units (subtree)
//                     + specific commanders via CommanderVisibilityGrant
// ─────────────────────────────────────────────────────────────

import { prisma } from '@/lib/db';

/**
 * Recursively resolves all unit IDs in the subtree rooted at `unitId`.
 * Returns an array that includes `unitId` itself plus every descendant.
 */
export async function getAllChildUnitIds(unitId: string): Promise<string[]> {
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

/**
 * Returns the list of commander user IDs whose location
 * the requesting user is permitted to view.
 *
 * This is the **single source of truth** for commander visibility.
 * All dashboard APIs must use this function — never inline the logic.
 *
 * @param userId - The requesting user's ID (from JWT, verified)
 * @param role   - The requesting user's role (from DB, real-time)
 * @returns Array of commander user IDs whose location is visible
 */
export async function getVisibleCommanderIds(
    userId: string,
    role: string
): Promise<string[]> {
    // ── Rule 1: Soldiers see NO commander locations ──────────
    if (role === 'soldier') {
        return [];
    }

    // ── Rule 2: Senior commanders see ALL commanders ─────────
    if (role === 'senior_commander') {
        const allCommanders = await prisma.user.findMany({
            where: { role: 'commander' },
            select: { id: true },
        });
        return allCommanders.map((c: { id: string }) => c.id);
    }

    // ── Rule 3: Commanders — subtree + explicit grants ───────
    if (role === 'commander') {
        // 3a. Fetch the commander's own unit (real-time from DB, not JWT)
        const self = await prisma.user.findUnique({
            where: { id: userId },
            select: { unitId: true },
        });

        if (!self) {
            return [];
        }

        // 3b. Resolve all child unit IDs (subtree below this commander)
        const subtreeUnitIds = await getAllChildUnitIds(self.unitId);

        // Remove the commander's own unit — they should only see
        // commanders in CHILD units, not parallel commanders at their level.
        const childOnlyUnitIds = subtreeUnitIds.filter((id) => id !== self.unitId);

        // 3c. Fetch commanders in child units (excluding self)
        const subtreeCommanders = await prisma.user.findMany({
            where: {
                role: 'commander',
                unitId: { in: childOnlyUnitIds },
                id: { not: userId }, // Never include self
            },
            select: { id: true },
        });

        // 3d. Fetch explicit cross-unit grants (parallel visibility)
        const now = new Date();
        const grants = await prisma.commanderVisibilityGrant.findMany({
            where: {
                grantedToId: userId,
                OR: [
                    { expiresAt: null },        // No expiry — permanent grant
                    { expiresAt: { gt: now } },  // Not yet expired
                ],
            },
            select: { targetCommanderId: true },
        });

        // 3e. Merge and deduplicate
        const visibleIds = new Set<string>();
        for (const c of subtreeCommanders) {
            visibleIds.add(c.id);
        }
        for (const g of grants) {
            visibleIds.add(g.targetCommanderId);
        }

        // Safety: never include self
        visibleIds.delete(userId);

        return Array.from(visibleIds);
    }

    // Unknown role — deny by default
    return [];
}

// ─────────────────────────────────────────────────────────────
// OpSec — Grant Authorization (Hierarchy Enforcement)
// ─────────────────────────────────────────────────────────────

export interface GrantValidationResult {
    allowed: boolean;
    error?: string;
    code?: 'UNAUTHORIZED_ROLE' | 'INVALID_TARGET' | 'INVALID_GRANTEE'
    | 'SELF_GRANT' | 'OUTSIDE_HIERARCHY' | 'DUPLICATE_GRANT' | 'NOT_FOUND';
}

/**
 * Validates whether a user is authorized to create (or revoke)
 * a visibility grant between two commanders.
 *
 * Security constraints enforced (RBAC + Zero Trust):
 * 1. User must have `MANAGE_VISIBILITY_GRANTS` permission (not expired).
 * 2. Both grantee and target must have role === 'commander'.
 * 3. If permission is scope-limited (scopeUnitId), both grantee
 *    and target must be within that unit's subtree.
 * 4. Grantee and target cannot be the same person.
 * 5. No duplicate grants (same grantee → target pair).
 *
 * @param granterId          - The user attempting to create the grant (from JWT)
 * @param grantedToId        - The commander who will RECEIVE visibility
 * @param targetCommanderId  - The commander whose location becomes VISIBLE
 * @param checkDuplicate     - If true, checks for existing grant (set false for revoke)
 */
export async function validateGrantAuthorization(
    granterId: string,
    grantedToId: string,
    targetCommanderId: string,
    checkDuplicate: boolean = true
): Promise<GrantValidationResult> {
    // ── 1. Permission gate: MANAGE_VISIBILITY_GRANTS required ─
    const permission = await prisma.userPermission.findUnique({
        where: {
            userId_permissionCode: {
                userId: granterId,
                permissionCode: 'MANAGE_VISIBILITY_GRANTS',
            },
        },
    });

    if (!permission) {
        return {
            allowed: false,
            error: 'אין לך הרשאת ניהול נראות מפקדים (MANAGE_VISIBILITY_GRANTS).',
            code: 'UNAUTHORIZED_ROLE',
        };
    }

    // Check permission expiry
    if (permission.expiresAt && permission.expiresAt < new Date()) {
        return {
            allowed: false,
            error: 'הרשאת ניהול נראות פגה. פנה לגורם מוסמך לחידוש.',
            code: 'UNAUTHORIZED_ROLE',
        };
    }

    // Resolve the scope — if permission has a scopeUnitId, use it; otherwise global
    const scopeUnitId = permission.scopeUnitId;

    // ── 2. Self-grant prevention ─────────────────────────────
    if (grantedToId === targetCommanderId) {
        return {
            allowed: false,
            error: 'לא ניתן להעניק הרשאת נראות למפקד על עצמו.',
            code: 'SELF_GRANT',
        };
    }

    // ── 3. Both users must exist and be commanders ───────────
    const [grantee, target] = await Promise.all([
        prisma.user.findUnique({
            where: { id: grantedToId },
            select: { id: true, role: true, unitId: true, firstName: true, lastName: true },
        }),
        prisma.user.findUnique({
            where: { id: targetCommanderId },
            select: { id: true, role: true, unitId: true, firstName: true, lastName: true },
        }),
    ]);

    if (!grantee || !target) {
        return {
            allowed: false,
            error: 'אחד המפקדים (המעניק או המקבל) לא נמצא במערכת.',
            code: 'NOT_FOUND',
        };
    }

    if (grantee.role !== 'commander') {
        return {
            allowed: false,
            error: 'מקבל ההרשאה חייב להיות משתמש מסוג מפקד (C-001).',
            code: 'INVALID_GRANTEE',
        };
    }

    if (target.role !== 'commander') {
        return {
            allowed: false,
            error: 'המפקד הנצפה חייב להיות משתמש מסוג מפקד (C-001).',
            code: 'INVALID_TARGET',
        };
    }

    // ── 4. Hierarchy enforcement (scope-based) ────────────────
    // If the permission has a scopeUnitId, both grantee and target
    // must be within that unit's subtree. If scope is null (global),
    // hierarchy enforcement is not required (the user has full access).
    if (scopeUnitId) {
        const scopeSubtree = await getAllChildUnitIds(scopeUnitId);
        const scopeSubtreeSet = new Set(scopeSubtree);

        if (!scopeSubtreeSet.has(grantee.unitId)) {
            return {
                allowed: false,
                error: `מקבל ההרשאה (${grantee.firstName} ${grantee.lastName}) אינו תחת טווח ההרשאה שלך.`,
                code: 'OUTSIDE_HIERARCHY',
            };
        }

        if (!scopeSubtreeSet.has(target.unitId)) {
            return {
                allowed: false,
                error: `המפקד הנצפה (${target.firstName} ${target.lastName}) אינו תחת טווח ההרשאה שלך.`,
                code: 'OUTSIDE_HIERARCHY',
            };
        }
    }

    if (checkDuplicate) {
        const existing = await prisma.commanderVisibilityGrant.findFirst({
            where: {
                grantedToId,
                targetCommanderId,
                isActive: true,
            },
        });

        if (existing) {
            return {
                allowed: false,
                error: 'הרשאה זהה כבר קיימת במערכת.',
                code: 'DUPLICATE_GRANT',
            };
        }
    }

    // ── All checks passed ────────────────────────────────────
    return { allowed: true };
}
