// ─────────────────────────────────────────────────────────────
// LockPoint — Geofence Transition Manager
// ─────────────────────────────────────────────────────────────

import type { LatLng, GeofenceZone, GeofenceEvent, GeofenceTransition } from '../types';
import { checkGeofenceTransition } from './calculator';

export type TransitionCallback = (event: Omit<GeofenceEvent, 'id' | 'soldierName'>) => void;

/**
 * Manages geofence state and fires callbacks on transitions.
 * Framework-agnostic — can be used in React, service workers, or Capacitor.
 */
export class TransitionManager {
    private lastLocation: LatLng | null = null;
    private zones: GeofenceZone[] = [];
    private listeners: TransitionCallback[] = [];
    private soldierId: string;

    constructor(soldierId: string) {
        this.soldierId = soldierId;
    }

    /** Update active geofence zones */
    setZones(zones: GeofenceZone[]) {
        this.zones = zones.filter((z) => z.isActive);
    }

    /** Register a transition listener */
    onTransition(cb: TransitionCallback): () => void {
        this.listeners.push(cb);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== cb);
        };
    }

    /** Process a new location update */
    processLocation(location: LatLng, accuracy: number, batteryLevel?: number): GeofenceTransition[] {
        const transitions: GeofenceTransition[] = [];

        if (this.lastLocation) {
            for (const zone of this.zones) {
                const transition = checkGeofenceTransition(this.lastLocation, location, zone);

                if (transition !== 'STAY') {
                    transitions.push(transition);

                    const event: Omit<GeofenceEvent, 'id' | 'soldierName'> = {
                        soldierId: this.soldierId,
                        zoneId: zone.id,
                        zoneName: zone.name,
                        transition,
                        location,
                        accuracy,
                        timestamp: new Date().toISOString(),
                        batteryLevel,
                    };

                    this.listeners.forEach((cb) => cb(event));
                }
            }
        }

        this.lastLocation = location;
        return transitions;
    }

    /** Reset state */
    reset() {
        this.lastLocation = null;
    }
}
