// ─────────────────────────────────────────────────────────────
// LockPoint — useGeofenceMonitor Hook
// ─────────────────────────────────────────────────────────────
// Orchestrates: GPS Bridge → TransitionManager → API Events
// ─────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CapacitorGPSBridge } from '../tracker/capacitor-bridge';
import { TransitionManager } from '../engine/transition';
import { isInsideGeofence } from '../engine/calculator';
import { apiClient } from '@/lib/api/client';
import type { LatLng, GeofenceZone, GeofenceShape } from '../types';

// ── Types ───────────────────────────────────────────────────

export type GpsStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'unavailable' | 'error';

export interface GeofenceMonitorState {
    /** Is the GPS actively tracking */
    isMonitoring: boolean;
    /** Current GPS status */
    gpsStatus: GpsStatus;
    /** Last known position */
    lastPosition: LatLng | null;
    /** GPS accuracy in meters */
    accuracy: number | null;
    /** Name of the current zone the soldier is inside (null = outside all zones) */
    currentZoneName: string | null;
    /** Whether we are currently inside any zone */
    isInsideZone: boolean;
    /** Start monitoring */
    startMonitoring: () => Promise<void>;
    /** Stop monitoring */
    stopMonitoring: () => void;
}

// ── DB Zone → Engine Zone Converter ─────────────────────────

interface DbZone {
    id: string;
    name: string;
    shapeType: string;
    centerLat: number | null;
    centerLng: number | null;
    radiusMeters: number | null;
    vertices: string | null;
    isActive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

function dbZoneToEngineZone(z: DbZone): GeofenceZone {
    let shape: GeofenceShape;

    if (z.shapeType === 'polygon' && z.vertices) {
        const verts = typeof z.vertices === 'string' ? JSON.parse(z.vertices) : z.vertices;
        shape = { type: 'polygon', vertices: verts };
    } else {
        shape = {
            type: 'circle',
            center: { lat: z.centerLat || 0, lng: z.centerLng || 0 },
            radiusMeters: z.radiusMeters || 500,
        };
    }

    return {
        id: z.id,
        name: z.name,
        description: undefined,
        shape,
        isActive: z.isActive,
        createdBy: z.createdBy,
        createdAt: z.createdAt,
        updatedAt: z.updatedAt,
    };
}

// ── Hook Implementation ─────────────────────────────────────

export function useGeofenceMonitor(soldierId: string | null): GeofenceMonitorState {
    const queryClient = useQueryClient();
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
    const [lastPosition, setLastPosition] = useState<LatLng | null>(null);
    const [accuracy, setAccuracy] = useState<number | null>(null);
    const [currentZoneName, setCurrentZoneName] = useState<string | null>(null);
    const [isInsideZone, setIsInsideZone] = useState(false);

    const gpsRef = useRef<CapacitorGPSBridge | null>(null);
    const transitionRef = useRef<TransitionManager | null>(null);
    const zonesRef = useRef<GeofenceZone[]>([]);
    const unsubGpsRef = useRef<(() => void) | null>(null);
    const unsubTransitionRef = useRef<(() => void) | null>(null);
    const hasSyncedInitialLocationRef = useRef<boolean>(false);

    // ── Fetch zones from API ────────────────────────────────

    const loadZones = useCallback(async (): Promise<GeofenceZone[]> => {
        try {
            const dbZones = await apiClient.get<DbZone[]>('/zones');
            return (dbZones || [])
                .filter((z) => z.isActive)
                .map(dbZoneToEngineZone);
        } catch (err) {
            console.error('[Geofence] Failed to load zones:', err);
            return [];
        }
    }, []);

    // ── Send transition event to API ────────────────────────

    const reportTransition = useCallback(async (
        zoneId: string,
        transition: 'ENTER' | 'EXIT',
        location: LatLng,
        acc: number,
    ) => {
        try {
            await apiClient.post('/events', {
                zoneId,
                transition,
                lat: location.lat,
                lng: location.lng,
                accuracy: acc,
            });
            console.log(`[Geofence] Reported ${transition} for zone ${zoneId}`);
            queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        } catch (err) {
            console.error('[Geofence] Failed to report transition:', err);
        }
    }, [queryClient]);

    // ── Start monitoring ────────────────────────────────────

    const startMonitoring = useCallback(async () => {
        if (!soldierId || isMonitoring) return;

        setGpsStatus('requesting');

        // 1. Load zones
        const zones = await loadZones();
        if (zones.length === 0) {
            console.warn('[Geofence] No active zones found');
            setGpsStatus('error');
            return;
        }
        zonesRef.current = zones;

        // 2. Create TransitionManager
        const tm = new TransitionManager(soldierId);
        tm.setZones(zones);
        transitionRef.current = tm;

        // 3. Listen for transitions
        unsubTransitionRef.current = tm.onTransition((event) => {
            const zoneName = event.zoneName;
            const transition = event.transition;

            if (transition === 'EXIT') {
                setIsInsideZone(false);
                setCurrentZoneName(null);
            } else if (transition === 'ENTER') {
                setIsInsideZone(true);
                setCurrentZoneName(zoneName);
            }

            // Report to server
            reportTransition(
                event.zoneId,
                transition as 'ENTER' | 'EXIT',
                event.location,
                event.accuracy,
            );
        });

        // 4. Create GPS bridge and listen for location updates
        const gps = new CapacitorGPSBridge();
        gpsRef.current = gps;

        unsubGpsRef.current = gps.onLocation((location, acc) => {
            setLastPosition(location);
            setAccuracy(Math.round(acc));

            // Feed into transition manager
            tm.processLocation(location, acc);

            // Check if currently inside any zone (for initial state)
            let isInside = false;
            let currentZone = null;

            for (const zone of zonesRef.current) {
                if (isInsideGeofence(location, zone.shape)) {
                    isInside = true;
                    currentZone = zone.name;
                    break;
                }
            }

            setIsInsideZone(isInside);
            setCurrentZoneName(currentZone);

            // Forcefully sync the very first location with the backend to fix initial state discrepancies
            if (!hasSyncedInitialLocationRef.current) {
                hasSyncedInitialLocationRef.current = true;
                apiClient.post('/events/sync', {
                    lat: location.lat,
                    lng: location.lng,
                    accuracy: acc,
                    isInsideZone: isInside
                })
                    .then(() => queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }))
                    .catch(err => console.error('[Geofence] Initial sync failed:', err));
            }
        });

        try {
            await gps.start();
            setGpsStatus('active');
            setIsMonitoring(true);
        } catch (err) {
            console.error('[Geofence] GPS start failed:', err);
            setGpsStatus('denied');
        }
    }, [soldierId, isMonitoring, loadZones, reportTransition]);

    // ── Stop monitoring ─────────────────────────────────────

    const stopMonitoring = useCallback(() => {
        if (unsubGpsRef.current) {
            unsubGpsRef.current();
            unsubGpsRef.current = null;
        }
        if (unsubTransitionRef.current) {
            unsubTransitionRef.current();
            unsubTransitionRef.current = null;
        }
        if (gpsRef.current) {
            gpsRef.current.stop();
            gpsRef.current = null;
        }
        if (transitionRef.current) {
            transitionRef.current.reset();
            transitionRef.current = null;
        }
        hasSyncedInitialLocationRef.current = false;
        setIsMonitoring(false);
        setGpsStatus('idle');
    }, []);

    // ── Cleanup on unmount ──────────────────────────────────

    useEffect(() => {
        return () => {
            stopMonitoring();
        };
    }, [stopMonitoring]);

    return {
        isMonitoring,
        gpsStatus,
        lastPosition,
        accuracy,
        currentZoneName,
        isInsideZone,
        startMonitoring,
        stopMonitoring,
    };
}
