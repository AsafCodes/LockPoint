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
    events: any[];
}

export interface SeniorDashboardResponse {
    globalStats: DashboardStats;
    units: OrgNode[];
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
