// ─────────────────────────────────────────────────────────────
// LockPoint — Application Constants
// ─────────────────────────────────────────────────────────────

/** Polling intervals (ms) */
export const POLLING = {
    COMMANDER_DASHBOARD: 5_000,
    SOLDIER_STATUS: 10_000,
    ATTENDANCE_LOG: 15_000,
} as const;

/** Geofence configuration defaults */
export const GEOFENCE = {
    DEFAULT_RADIUS_METERS: 500,
    MIN_RADIUS_METERS: 50,
    MAX_RADIUS_METERS: 10_000,
    /** Significant location change threshold (meters) */
    DISTANCE_FILTER: 50,
    /** Stationary radius for battery optimization (meters) */
    STATIONARY_RADIUS: 100,
    /** Desired accuracy (meters) — balances precision vs battery */
    DESIRED_ACCURACY: 100,
} as const;

/** Route paths */
export const ROUTES = {
    HOME: '/',
    SOLDIER: '/soldier',
    COMMANDER: '/commander',
    SENIOR: '/senior',
    LOGIN: '/login',
} as const;

/** Status colors mapped to tactical theme */
export const STATUS_COLORS = {
    in_base: {
        bg: 'bg-signal-green/10',
        text: 'text-signal-green',
        border: 'border-signal-green/30',
        dot: 'bg-signal-green',
    },
    out_of_base: {
        bg: 'bg-warning-amber/10',
        text: 'text-warning-amber',
        border: 'border-warning-amber/30',
        dot: 'bg-warning-amber',
    },
    unknown: {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/30',
        dot: 'bg-slate-500',
    },
} as const;
