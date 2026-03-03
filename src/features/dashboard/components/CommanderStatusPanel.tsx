'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — Commander Status Panel (Hebrew, Mobile-First)
// ─────────────────────────────────────────────────────────────
// Derived from SoldierHome.tsx — GPS bar, status card, coordinates,
// zone info. No exit report overlay (commanders don't file exit reports).
// ─────────────────────────────────────────────────────────────

import { TacticalCard } from '@/shared/components';
import { StatusBadge } from '@/features/attendance/components/StatusBadge';
import { GpsStatusBar } from '@/features/geofence/components/GpsStatusBar';
import { LocationPermission } from '@/features/geofence/components/LocationPermission';
import { useAuth } from '@/providers/AuthProvider';
import { useGeofence } from '@/providers/GeofenceProvider';
import { formatTacticalTime, formatCoordinates } from '@/shared/utils/formatters';
import { useAuthMe } from '@/lib/api/hooks';
import { t } from '@/lib/i18n';

export function CommanderStatusPanel() {
    const { user: authUser } = useAuth();
    const { data: me } = useAuthMe();
    const geofence = useGeofence();

    const user = me || authUser;
    if (!user) return null;

    // ── Permission gate ─────────────────────────────────────
    if (geofence.gpsStatus === 'denied' || geofence.gpsStatus === 'unavailable' || geofence.gpsStatus === 'error') {
        return (
            <LocationPermission
                status={geofence.gpsStatus}
                onRetry={() => geofence.startMonitoring()}
            />
        );
    }

    const currentStatus = me?.currentStatus || user.currentStatus || 'unknown';
    const lastUpdate = geofence.lastPingTime || me?.lastLocationUpdate || user.lastLocationUpdate || new Date().toISOString();
    const lat = geofence.lastPosition?.lat || me?.lastKnownLat || user.lastKnownLat || 32.0853;
    const lng = geofence.lastPosition?.lng || me?.lastKnownLng || user.lastKnownLng || 34.7818;

    return (
        <TacticalCard className="border-indigo-500/20">
            {/* GPS Status Bar */}
            <GpsStatusBar
                gpsStatus={geofence.gpsStatus}
                accuracy={geofence.accuracy}
                currentZoneName={geofence.currentZoneName}
                isInsideZone={geofence.isInsideZone}
            />

            {/* Commander Header */}
            <div className="mt-3 mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                        מפקד
                    </span>
                    <h3 className="text-sm font-semibold text-text-primary">
                        {user.rank?.code || ''} {user.lastName || ''}
                    </h3>
                </div>
            </div>

            {/* Status + Coordinates */}
            <div className="text-center py-3">
                <StatusBadge status={currentStatus as any} size="lg" />
                <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-text-muted">{t.soldier.position}</p>
                        <p className="data-mono text-xs text-text-secondary mt-0.5">
                            {formatCoordinates(lat, lng)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-text-muted">{t.soldier.lastUpdate}</p>
                        <p className="data-mono text-xs text-text-secondary mt-0.5">
                            {formatTacticalTime(lastUpdate)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Zone Info (compact) */}
            <div className="border-t border-border-subtle pt-3 mt-2 space-y-1.5">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-text-muted">{t.soldier.zone}</span>
                    <span className="data-mono text-xs text-text-secondary">
                        {geofence.currentZoneName || 'מחוץ לתחום'}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-text-muted">סטטוס מעקב</span>
                    <span className={`data-mono text-xs ${geofence.isMonitoring ? 'text-signal-green' : 'text-text-muted'}`}>
                        {geofence.isMonitoring ? 'פעיל' : 'לא פעיל'}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-text-muted">{t.soldier.gpsAccuracy}</span>
                    <span className="data-mono text-xs text-signal-green">
                        {geofence.accuracy !== null ? `±${geofence.accuracy}m` : '---'}
                    </span>
                </div>
            </div>

            {/* OPSEC Notice */}
            <div className="mt-3 px-3 py-2 rounded-md bg-indigo-500/5 border border-indigo-500/10">
                <p className="text-[10px] text-indigo-300/70 text-center">
                    🔒 המיקום שלך מוצפן End-to-End — גלוי רק למפקדים מורשים
                </p>
            </div>
        </TacticalCard>
    );
}
