import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { Soldier, OrgNode } from '@/features/hierarchy/types';

// ── Types ───────────────────────────────────────────────────

export interface DashboardStats {
    total: number;
    inBase: number;
    outOfBase: number;
    unknown: number;
}

export interface CommanderDashboardResponse {
    stats: DashboardStats;
    soldiers: Soldier[];
    units: OrgNode[];
    flatUnits: OrgNode[];
    zones: any[];
    events: any[];
}

export interface SeniorDashboardResponse {
    globalStats: DashboardStats;
    commanderLocations: any[];
    units: OrgNode[];
    flatUnits: OrgNode[];
    events: any[];
}

// ── Queries ─────────────────────────────────────────────────

export function useAuthMe() {
    return useQuery({
        queryKey: ['auth', 'me'],
        queryFn: () => apiClient.get<any>('/auth/me'),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useCommanderDashboard() {
    return useQuery({
        queryKey: ['dashboard', 'commander'],
        queryFn: () => apiClient.get<CommanderDashboardResponse>('/dashboard/commander'),
        refetchInterval: 30000, // Auto-refresh every 30s
    });
}

export function useSeniorDashboard() {
    return useQuery({
        queryKey: ['dashboard', 'senior'],
        queryFn: () => apiClient.get<SeniorDashboardResponse>('/dashboard/senior'),
        refetchInterval: 30000,
    });
}

// ── RBAC Permission Hook ────────────────────────────────────

interface MyPermission {
    code: string;
    label: string;
    category: string;
    scopeUnitId: string | null;
    expiresAt: string | null;
}

interface MyPermissionsResponse {
    permissions: MyPermission[];
}

/**
 * Fetches the authenticated user's active permissions.
 * Used to conditionally render UI elements (buttons, panels, tabs).
 * The server is still the enforcer (403) — this is UX-only filtering.
 */
export function useMyPermissions() {
    const query = useQuery({
        queryKey: ['auth', 'permissions'],
        queryFn: () => apiClient.get<MyPermissionsResponse>('/auth/permissions'),
        staleTime: 5 * 60 * 1000, // 5 minutes — permissions change rarely
    });

    const permissionCodes = new Set(
        (query.data?.permissions || []).map((p) => p.code)
    );

    return {
        ...query,
        /** Check if the user has a specific permission */
        hasPermission: (code: string) => permissionCodes.has(code),
        /** All permission codes as a Set for batch checks */
        permissionCodes,
    };
}

// ── Mutations ───────────────────────────────────────────────

export function useRecordEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { zoneId: string; transition: 'ENTER' | 'EXIT'; lat: number; lng: number; accuracy: number }) =>
            apiClient.post<any>('/events', data),
        onSuccess: () => {
            // Invalidate queries so dashboards refresh automatically
            queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

export function useSubmitReport() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { eventId: string; destination: string; reason: string; estimatedReturn?: string }) =>
            apiClient.post<any>('/reports', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}
