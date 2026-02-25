// ─────────────────────────────────────────────────────────────
// LockPoint — Server-Safe Geofence Calculator (Pure Functions)
// ─────────────────────────────────────────────────────────────
// No React or client-side imports — safe for API routes, cron
// jobs, and server-side use. The client-side calculator.ts
// re-exports these functions.
// ─────────────────────────────────────────────────────────────

/** Coordinate pair */
export interface GeoPoint {
    lat: number;
    lng: number;
}

/** Earth radius in meters */
const EARTH_RADIUS = 6_371_000;

/** Convert degrees to radians */
function toRad(deg: number): number {
    return (deg * Math.PI) / 180;
}

/**
 * Haversine distance between two points in meters
 */
export function haversineDistance(a: GeoPoint, b: GeoPoint): number {
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
export function isPointInPolygon(point: GeoPoint, vertices: GeoPoint[]): boolean {
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
 * DB zone shape for server-side use (raw from Prisma)
 */
export interface DbZoneShape {
    shapeType: string;
    centerLat: number | null;
    centerLng: number | null;
    radiusMeters: number | null;
    vertices: string | any[] | null;
}

/**
 * Check if a point is inside a zone (supports both circle and polygon)
 * Works directly with raw DB zone data — no conversion needed.
 */
export function isInsideZone(lat: number, lng: number, zone: DbZoneShape): boolean {
    const point: GeoPoint = { lat, lng };

    if (zone.shapeType === 'polygon' && zone.vertices) {
        const verts: GeoPoint[] = typeof zone.vertices === 'string'
            ? JSON.parse(zone.vertices)
            : zone.vertices;
        return isPointInPolygon(point, verts);
    }

    // Circle (default)
    if (zone.centerLat != null && zone.centerLng != null && zone.radiusMeters != null) {
        const center: GeoPoint = { lat: zone.centerLat, lng: zone.centerLng };
        return haversineDistance(point, center) <= zone.radiusMeters;
    }

    return false;
}

/**
 * Calculate centroid of a polygon
 */
export function getPolygonCentroid(vertices: GeoPoint[]): GeoPoint {
    const n = vertices.length;
    const sum = vertices.reduce(
        (acc, v) => ({ lat: acc.lat + v.lat, lng: acc.lng + v.lng }),
        { lat: 0, lng: 0 }
    );
    return { lat: sum.lat / n, lng: sum.lng / n };
}
