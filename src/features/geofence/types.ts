// ─────────────────────────────────────────────────────────────
// LockPoint — Geofence & Location Types
// ─────────────────────────────────────────────────────────────

/** Coordinate pair */
export interface LatLng {
    lat: number;
    lng: number;
}

/** Geofence zone geometry — circle or polygon */
export type GeofenceShape =
    | { type: 'circle'; center: LatLng; radiusMeters: number }
    | { type: 'polygon'; vertices: LatLng[] };

/** Geofence zone definition */
export interface GeofenceZone {
    id: string;
    name: string;
    description?: string;
    shape: GeofenceShape;
    isActive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

/** Transition event type */
export type GeofenceTransition = 'ENTER' | 'EXIT' | 'STAY';

/** Location event when a soldier triggers a geofence transition */
export interface GeofenceEvent {
    id: string;
    soldierId: string;
    soldierName: string;
    zoneId: string;
    zoneName: string;
    transition: GeofenceTransition;
    location: LatLng;
    accuracy: number;       // meters
    timestamp: string;      // ISO-8601
    batteryLevel?: number;  // 0-100
}

/** Exit report — soldier's "Where to?" submission */
export interface ExitReport {
    id: string;
    soldierId: string;
    eventId: string;
    destination: string;
    reason: ExitReason;
    freeText?: string;
    estimatedReturn?: string;  // ISO-8601
    createdAt: string;
}

export type ExitReason =
    | 'personal_leave'
    | 'medical'
    | 'official_duty'
    | 'training'
    | 'emergency'
    | 'other';

/** Attendance snapshot for a single soldier */
export interface AttendanceRecord {
    soldierId: string;
    soldierName: string;
    serviceNumber: string;
    status: 'in_base' | 'out_of_base' | 'unknown';
    lastTransition?: GeofenceTransition;
    lastTransitionTime?: string;
    exitReport?: ExitReport;
}
