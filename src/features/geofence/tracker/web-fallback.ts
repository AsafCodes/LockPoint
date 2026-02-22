// ─────────────────────────────────────────────────────────────
// LockPoint — Web Fallback Location Tracker
// ─────────────────────────────────────────────────────────────
// Service worker-compatible fallback for browsers without
// Capacitor native layer. Note: only works while tab is active.
// ─────────────────────────────────────────────────────────────

import type { LatLng } from '../types';

export type WebLocationCallback = (location: LatLng, accuracy: number) => void;

/**
 * Web-only location tracker using the browser Geolocation API.
 * Used as fallback when Capacitor is not available.
 */
export class WebLocationTracker {
    private watchId: number | null = null;
    private listeners: WebLocationCallback[] = [];

    onLocation(cb: WebLocationCallback): () => void {
        this.listeners.push(cb);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== cb);
        };
    }

    start(): void {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            console.warn('[LockPoint] Geolocation API not available in this environment.');
            return;
        }

        this.watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const location: LatLng = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                };
                this.listeners.forEach((cb) => cb(location, pos.coords.accuracy));
            },
            (err) => {
                console.error('[LockPoint Web Tracker] Error:', err.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 30_000,
                maximumAge: 5_000,
            }
        );
    }

    stop(): void {
        if (this.watchId !== null && typeof navigator !== 'undefined') {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    async getCurrentPosition(): Promise<LatLng | null> {
        if (typeof navigator === 'undefined' || !navigator.geolocation) return null;

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => resolve(null),
                { enableHighAccuracy: true, timeout: 10_000 }
            );
        });
    }
}
