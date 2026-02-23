'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — Geofence Provider
// ─────────────────────────────────────────────────────────────
// App-level context that activates GPS monitoring for soldiers.
// Commanders don't need GPS tracking — this only mounts for
// the soldier role.
// ─────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useGeofenceMonitor, type GeofenceMonitorState } from '@/features/geofence/hooks/useGeofenceMonitor';

const GeofenceContext = createContext<GeofenceMonitorState | null>(null);

export function GeofenceProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();

    // Only create the monitor for soldiers
    const soldierId = user?.role === 'soldier' ? user.id : null;
    const monitor = useGeofenceMonitor(soldierId);

    // Auto-start monitoring when a soldier is logged in
    useEffect(() => {
        if (soldierId && !monitor.isMonitoring && monitor.gpsStatus === 'idle') {
            monitor.startMonitoring();
        }
    }, [soldierId, monitor.isMonitoring, monitor.gpsStatus]);

    return (
        <GeofenceContext.Provider value={monitor}>
            {children}
        </GeofenceContext.Provider>
    );
}

export function useGeofence(): GeofenceMonitorState {
    const ctx = useContext(GeofenceContext);
    if (!ctx) {
        throw new Error('useGeofence must be used within a GeofenceProvider');
    }
    return ctx;
}
