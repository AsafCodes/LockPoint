// ─────────────────────────────────────────────────────────────
// LockPoint — Geofence Calculation Engine (Client-Side)
// ─────────────────────────────────────────────────────────────
// Re-exports core math from the shared server-safe module,
// and adds higher-level functions (transition detection, etc.)
// ─────────────────────────────────────────────────────────────

import type { LatLng, GeofenceZone, GeofenceShape, GeofenceTransition } from '../types';

// Re-export core math from shared module
export { haversineDistance, isPointInPolygon, getPolygonCentroid } from '@/lib/geo/geofence-calc';
import { haversineDistance, isPointInPolygon, getPolygonCentroid } from '@/lib/geo/geofence-calc';

/**
 * Check if a point is inside a geofence zone (using typed GeofenceShape)
 */
export function isInsideGeofence(point: LatLng, shape: GeofenceShape): boolean {
    switch (shape.type) {
        case 'circle':
            return haversineDistance(point, shape.center) <= shape.radiusMeters;
        case 'polygon':
            return isPointInPolygon(point, shape.vertices);
    }
}

/**
 * Detect geofence transition between two positions
 */
export function checkGeofenceTransition(
    prevLocation: LatLng,
    currentLocation: LatLng,
    zone: GeofenceZone
): GeofenceTransition {
    const wasInside = isInsideGeofence(prevLocation, zone.shape);
    const isInside = isInsideGeofence(currentLocation, zone.shape);

    if (!wasInside && isInside) return 'ENTER';
    if (wasInside && !isInside) return 'EXIT';
    return 'STAY';
}

/**
 * Find the nearest active zone to a given point
 */
export function findNearestZone(
    point: LatLng,
    zones: GeofenceZone[]
): { zone: GeofenceZone; distance: number } | null {
    let nearest: { zone: GeofenceZone; distance: number } | null = null;

    for (const zone of zones.filter((z) => z.isActive)) {
        let distance: number;

        if (zone.shape.type === 'circle') {
            distance = Math.max(0, haversineDistance(point, zone.shape.center) - zone.shape.radiusMeters);
        } else {
            // For polygons, approximate distance to centroid
            const centroid = getPolygonCentroid(zone.shape.vertices);
            distance = haversineDistance(point, centroid);
        }

        if (!nearest || distance < nearest.distance) {
            nearest = { zone, distance };
        }
    }

    return nearest;
}
