'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — Soldier Home View (Hebrew, Mobile-First)
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { TacticalCard } from '@/shared/components';
import { StatusBadge } from '@/features/attendance/components/StatusBadge';
import { GeofenceOverlay } from '@/features/geofence/components/GeofenceOverlay';
import { useAuth } from '@/providers/AuthProvider';
import { formatTacticalTime, formatCoordinates } from '@/shared/utils/formatters';
import { useAuthMe, useRecordEvent, useSubmitReport } from '@/lib/api/hooks';
import { t } from '@/lib/i18n';

export function SoldierHome() {
    const { user: authUser } = useAuth();
    const { data: me } = useAuthMe();
    const recordEvent = useRecordEvent();
    const submitReport = useSubmitReport();

    const [showOverlay, setShowOverlay] = useState(false);
    const [pendingExitEventId, setPendingExitEventId] = useState<string | null>(null);

    // Use refreshed data from API if available, else fall back to auth context
    const user = me || authUser;

    if (!user) return null;

    const currentStatus = user.currentStatus || 'unknown';
    const lastUpdate = user.lastLocationUpdate || new Date().toISOString();
    // Use real coords if available, else fallback slightly (since simulator needs somewhere to start)
    const lat = user.lastKnownLat || 32.0853;
    const lng = user.lastKnownLng || 34.7818;

    const handleSimulateExit = async () => {
        // 1. Record the EXIT event
        recordEvent.mutate({
            zoneId: 'z1', // placeholder
            transition: 'EXIT',
            lat: lat + 0.005,
            lng: lng + 0.005,
            accuracy: 15,
        }, {
            onSuccess: (res) => {
                // 2. Show the exit report overlay, passing the new event ID
                setPendingExitEventId(res.id);
                setShowOverlay(true);
            }
        });
    };

    const handleSimulateEnter = () => {
        recordEvent.mutate({
            zoneId: 'z1', // placeholder
            transition: 'ENTER',
            lat: 32.0853,
            lng: 34.7818,
            accuracy: 12,
        });
        setShowOverlay(false);
    };

    return (
        <>
            <div className="space-y-4">
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
                            <span className="data-mono text-xs text-text-secondary">Base Alpha</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-text-muted">{t.soldier.radius}</span>
                            <span className="data-mono text-xs text-text-secondary">500m</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-text-muted">{t.soldier.gpsAccuracy}</span>
                            <span className="data-mono text-xs text-signal-green">±12m</span>
                        </div>
                    </div>
                </TacticalCard>

                {/* Dev Controls */}
                <TacticalCard className="border-dashed !border-text-muted/20">
                    <p className="text-[10px] uppercase tracking-widest text-text-muted mb-3">
                        {t.soldier.devControls}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSimulateExit}
                            className="flex-1 py-3 rounded-lg bg-warning-amber/10 text-warning-amber text-xs font-medium border border-warning-amber/20 hover:bg-warning-amber/20 transition-all touch-target"
                        >
                            {t.soldier.simulateExit}
                        </button>
                        <button
                            onClick={handleSimulateEnter}
                            className="flex-1 py-3 rounded-lg bg-signal-green/10 text-signal-green text-xs font-medium border border-signal-green/20 hover:bg-signal-green/20 transition-all touch-target"
                        >
                            {t.soldier.simulateEnter}
                        </button>
                    </div>
                </TacticalCard>
            </div>

            {/* Geofence Overlay */}
            {showOverlay && (
                <GeofenceOverlay
                    zoneName="Base Alpha"
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
