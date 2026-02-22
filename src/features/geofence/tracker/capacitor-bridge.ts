// ─────────────────────────────────────────────────────────────
// LockPoint — Capacitor GPS Bridge
// ─────────────────────────────────────────────────────────────
// Wraps @capacitor/geolocation for foreground tracking.
// Battery-optimized using "Significant Location Changes" logic.
// ─────────────────────────────────────────────────────────────

import type { LatLng } from '../types';
import { GEOFENCE } from '@/lib/constants';

export type LocationCallback = (location: LatLng, accuracy: number) => void;

interface CapacitorGeolocation {
    getCurrentPosition(options?: {
        enableHighAccuracy?: boolean;
        timeout?: number;
    }): Promise<{ coords: { latitude: number; longitude: number; accuracy: number } }>;
    watchPosition(
        options: { enableHighAccuracy?: boolean; timeout?: number; maximumAge?: number },
        callback: (position: { coords: { latitude: number; longitude: number; accuracy: number } } | null, err?: unknown) => void
    ): Promise<string>;
    clearWatch(options: { id: string }): Promise<void>;
}

/**
 * Capacitor native GPS bridge with significant-location-change filtering.
 * Falls back to Web Geolocation API when Capacitor is not available.
 */
export class CapacitorGPSBridge {
    private watchId: string | null = null;
    private webWatchId: number | null = null;
    private lastReported: LatLng | null = null;
    private listeners: LocationCallback[] = [];
    private distanceFilter: number;

    constructor(distanceFilter = GEOFENCE.DISTANCE_FILTER) {
        this.distanceFilter = distanceFilter;
    }

    /** Check if running inside Capacitor native shell */
    private isCapacitor(): boolean {
        return typeof window !== 'undefined' && !!(window as unknown as Record<string, unknown>).Capacitor;
    }

    /** Get the Capacitor Geolocation plugin */
    private async getPlugin(): Promise<CapacitorGeolocation | null> {
        if (!this.isCapacitor()) return null;
        try {
            const { Geolocation } = await import('@capacitor/geolocation');
            return Geolocation as unknown as CapacitorGeolocation;
        } catch {
            return null;
        }
    }

    /** Register a location listener */
    onLocation(cb: LocationCallback): () => void {
        this.listeners.push(cb);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== cb);
        };
    }

    /** Calculate distance between two points (simple) */
    private shouldReport(newLocation: LatLng): boolean {
        if (!this.lastReported) return true;

        const dLat = newLocation.lat - this.lastReported.lat;
        const dLng = newLocation.lng - this.lastReported.lng;
        // Rough meter estimate (1 degree ≈ 111km)
        const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111_000;
        return dist >= this.distanceFilter;
    }

    /** Emit to all listeners (with significant-change filter) */
    private emit(lat: number, lng: number, accuracy: number) {
        const location: LatLng = { lat, lng };
        if (!this.shouldReport(location)) return;

        this.lastReported = location;
        this.listeners.forEach((cb) => cb(location, accuracy));
    }

    /** Start watching location */
    async start(): Promise<void> {
        const plugin = await this.getPlugin();

        if (plugin) {
            // Capacitor native path
            this.watchId = await plugin.watchPosition(
                {
                    enableHighAccuracy: false,
                    timeout: 30_000,
                    maximumAge: 10_000,
                },
                (position) => {
                    if (position) {
                        this.emit(position.coords.latitude, position.coords.longitude, position.coords.accuracy);
                    }
                }
            );
        } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
            // Web fallback
            this.webWatchId = navigator.geolocation.watchPosition(
                (pos) => {
                    this.emit(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
                },
                (err) => {
                    console.error('[LockPoint GPS] Web geolocation error:', err.message);
                },
                {
                    enableHighAccuracy: false,
                    timeout: 30_000,
                    maximumAge: 10_000,
                }
            );
        }
    }

    /** Stop watching location */
    async stop(): Promise<void> {
        const plugin = await this.getPlugin();

        if (plugin && this.watchId) {
            await plugin.clearWatch({ id: this.watchId });
            this.watchId = null;
        }
        if (this.webWatchId !== null) {
            navigator.geolocation.clearWatch(this.webWatchId);
            this.webWatchId = null;
        }
    }

    /** Get current position once */
    async getCurrentPosition(): Promise<LatLng | null> {
        const plugin = await this.getPlugin();

        if (plugin) {
            const pos = await plugin.getCurrentPosition({ enableHighAccuracy: true, timeout: 10_000 });
            return { lat: pos.coords.latitude, lng: pos.coords.longitude };
        }

        if (typeof navigator !== 'undefined' && navigator.geolocation) {
            return new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    () => resolve(null),
                    { enableHighAccuracy: true, timeout: 10_000 }
                );
            });
        }

        return null;
    }
}
