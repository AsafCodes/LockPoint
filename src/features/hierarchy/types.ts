// ─────────────────────────────────────────────────────────────
// LockPoint — Hierarchical User & Organization Model
// ─────────────────────────────────────────────────────────────

/** User roles within the system */
export type UserRole = 'soldier' | 'commander' | 'senior_commander';

/** Military rank descriptor */
export interface Rank {
    code: string;      // e.g. "CPL", "SGT", "LT"
    label: string;     // e.g. "Corporal", "Sergeant", "Lieutenant"
    level: number;     // numeric for sorting (higher = more senior)
}

/** Base user profile */
export interface User {
    id: string;
    serviceNumber: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    rank: Rank;
    unitId: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    createdAt: string;  // ISO-8601
    updatedAt: string;
}

/** Soldier — extends base user with location-specific data */
export interface Soldier extends User {
    role: 'soldier';
    currentStatus: 'in_base' | 'out_of_base' | 'unknown';
    lastKnownLat?: number;
    lastKnownLng?: number;
    lastLocationUpdate?: string;
}

/** Commander — direct command over a unit */
export interface Commander extends User {
    role: 'commander';
    directUnitId: string;
}

/** Senior Commander — oversight across multiple units */
export interface SeniorCommander extends User {
    role: 'senior_commander';
    oversightUnitIds: string[];
}

// ─────────────────────────────────────────────────────────────
// Recursive Organizational Tree
// ─────────────────────────────────────────────────────────────

export type OrgNodeType = 'command' | 'brigade' | 'battalion' | 'company' | 'platoon' | 'squad';

/** A single node in the org hierarchy */
export interface OrgNode {
    id: string;
    name: string;
    type: OrgNodeType;
    parentId: string | null;
    commanderId: string;
    children: OrgNode[];
    /** Aggregated attendance stats for this node and all descendants */
    stats?: {
        totalPersonnel: number;
        inBase: number;
        outOfBase: number;
        unknown: number;
    };
}

/** Flattened view for list rendering */
export interface OrgNodeFlat {
    id: string;
    name: string;
    type: OrgNodeType;
    parentId: string | null;
    depth: number;
    commanderId: string;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Build a nested tree from a flat list */
export function buildOrgTree(nodes: OrgNodeFlat[]): OrgNode[] {
    const map = new Map<string, OrgNode>();
    const roots: OrgNode[] = [];

    for (const node of nodes) {
        map.set(node.id, { ...node, children: [] });
    }

    for (const node of nodes) {
        const current = map.get(node.id)!;
        if (node.parentId && map.has(node.parentId)) {
            map.get(node.parentId)!.children.push(current);
        } else {
            roots.push(current);
        }
    }

    return roots;
}

/** Get all descendant node IDs (recursive) */
export function getDescendantIds(node: OrgNode): string[] {
    const ids: string[] = [];
    for (const child of node.children) {
        ids.push(child.id);
        ids.push(...getDescendantIds(child));
    }
    return ids;
}
