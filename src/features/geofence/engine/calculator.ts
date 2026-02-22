// ─────────────────────────────────────────────────────────────
// LockPoint — Geofence Calculation Engine (Pure Functions)
// ─────────────────────────────────────────────────────────────

import type { LatLng, GeofenceZone, GeofenceShape, GeofenceTransition } from '../types';

/** Earth radius in meters */
const EARTH_RADIUS = 6_371_000;

/** Convert degrees to radians */
function toRad(deg: number): number {
    return (deg * Math.PI) / 180;
}

/**
 * Haversine distance between two points in meters
 */
export function haversineDistance(a: LatLng, b: LatLng): number {
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const sinLat = Math.sin(dLat / 2);
    const sinLng = Math.sin(dLng / 2);
    const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
    return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(h));
}

/**
 * Ray-casting algorithm — checks if a point is inside a polygon
 */
export function isPointInPolygon(point: LatLng, vertices: LatLng[]): boolean {
    let inside = false;
    const n = vertices.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
        const vi = vertices[i];
        const vj = vertices[j];

        if (
            vi.lng > point.lng !== vj.lng > point.lng &&
            point.lat < ((vj.lat - vi.lat) * (point.lng - vi.lng)) / (vj.lng - vi.lng) + vi.lat
        ) {
            inside = !inside;
        }
    }

    return inside;
}

/**
 * Check if a point is inside a geofence zone
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
    const wasinside = isInsideGeofence(prevLocation, zone.shape);
    const isInside = isInsideGeofence(currentLocation, zone.shape);

    if (!wasinside && isInside) return 'ENTER';
    if (wasinside && !isInside) return 'EXIT';
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

/**
 * Calculate centroid of a polygon
 */
function getPolygonCentroid(vertices: LatLng[]): LatLng {
    const n = vertices.length;
    const sum = vertices.reduce(
        (acc, v) => ({ lat: acc.lat + v.lat, lng: acc.lng + v.lng }),
        { lat: 0, lng: 0 }
    );
    return { lat: sum.lat / n, lng: sum.lng / n };
}
