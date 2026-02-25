'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — Soldier Home View (Hebrew, Mobile-First)
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { TacticalCard } from '@/shared/components';
import { StatusBadge } from '@/features/attendance/components/StatusBadge';
import { GeofenceOverlay } from '@/features/geofence/components/GeofenceOverlay';
import { GpsStatusBar } from '@/features/geofence/components/GpsStatusBar';
import { LocationPermission } from '@/features/geofence/components/LocationPermission';
import { useAuth } from '@/providers/AuthProvider';
import { useGeofence } from '@/providers/GeofenceProvider';
import { formatTacticalTime, formatCoordinates } from '@/shared/utils/formatters';
import { useAuthMe, useSubmitReport } from '@/lib/api/hooks';
import { t } from '@/lib/i18n';

const isDev = process.env.NODE_ENV === 'development';

export function SoldierHome() {
    const { user: authUser } = useAuth();
    const { data: me } = useAuthMe();
    const submitReport = useSubmitReport();
    const geofence = useGeofence();

    const [showOverlay, setShowOverlay] = useState(false);
    const [pendingExitEventId, setPendingExitEventId] = useState<string | null>(null);

    // Use refreshed data from API if available, else fall back to auth context
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
        <>
            <div className="space-y-4">
                {/* GPS Status Bar */}
                <GpsStatusBar
                    gpsStatus={geofence.gpsStatus}
                    accuracy={geofence.accuracy}
                    currentZoneName={geofence.currentZoneName}
                    isInsideZone={geofence.isInsideZone}
                />

                {/* Header */}
                <div>
                    <h2 className="text-xl font-bold text-text-primary">{t.soldier.myStatus}</h2>
                    <p className="text-sm text-text-muted mt-1">
                        {t.soldier.trackingFor} {user.rank.code} {user.lastName}
                    </p>
                </div>

                {/* Current Status Card */}
                <TacticalCard glow={currentStatus === 'in_base' ? 'green' : 'amber'}>
                    <div className="text-center py-4">
                        <StatusBadge status={currentStatus as any} size="lg" />
                        <div className="mt-4 space-y-2">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-text-muted">{t.soldier.position}</p>
                                <p className="data-mono text-sm text-text-secondary mt-0.5">
                                    {formatCoordinates(lat, lng)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-text-muted">{t.soldier.lastUpdate}</p>
                                <p className="data-mono text-sm text-text-secondary mt-0.5">
                                    {formatTacticalTime(lastUpdate)}
                                </p>
                            </div>
                        </div>
                    </div>
                </TacticalCard>

                {/* Zone Info */}
                <TacticalCard>
                    <h3 className="text-sm font-semibold text-text-primary mb-3">{t.soldier.activeZone}</h3>
                    <div className="space-y-2">
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
                </TacticalCard>

                {/* Dev-only Simulation Controls */}
                {isDev && (
                    <TacticalCard className="border-dashed !border-text-muted/20">
                        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-3">
                            {t.soldier.devControls} (DEV ONLY)
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    // Manually trigger an exit report overlay for testing
                                    setShowOverlay(true);
                                    setPendingExitEventId('dev-test-event');
                                }}
                                className="flex-1 py-3 rounded-lg bg-warning-amber/10 text-warning-amber text-xs font-medium border border-warning-amber/20 hover:bg-warning-amber/20 transition-all touch-target"
                            >
                                {t.soldier.simulateExit}
                            </button>
                            <button
                                onClick={() => setShowOverlay(false)}
                                className="flex-1 py-3 rounded-lg bg-signal-green/10 text-signal-green text-xs font-medium border border-signal-green/20 hover:bg-signal-green/20 transition-all touch-target"
                            >
                                {t.soldier.simulateEnter}
                            </button>
                        </div>
                    </TacticalCard>
                )}
            </div>

            {/* Geofence Overlay */}
            {showOverlay && (
                <GeofenceOverlay
                    zoneName={geofence.currentZoneName || 'Base Alpha'}
                    onDismiss={() => {
                        setShowOverlay(false);
                        setPendingExitEventId(null);
                    }}
                    onSubmitReport={(data) => {
                        if (pendingExitEventId) {
                            submitReport.mutate({
                                eventId: pendingExitEventId,
                                ...data,
                            });
                        }
                        setShowOverlay(false);
                        setPendingExitEventId(null);
                    }}
                />
            )}
        </>
    );
}
