'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — GPS Status Bar
// ─────────────────────────────────────────────────────────────
// Compact bar showing GPS signal, monitoring status, and zone.
// ─────────────────────────────────────────────────────────────

import { cn } from '@/shared/utils/cn';
import { t } from '@/lib/i18n';
import type { GpsStatus } from '../hooks/useGeofenceMonitor';

interface GpsStatusBarProps {
    gpsStatus: GpsStatus;
    accuracy: number | null;
    currentZoneName: string | null;
    isInsideZone: boolean;
}

/** Maps accuracy (meters) to signal strength (1-4 bars) */
function getSignalStrength(accuracy: number | null): number {
    if (accuracy === null) return 0;
    if (accuracy <= 10) return 4;
    if (accuracy <= 30) return 3;
    if (accuracy <= 75) return 2;
    return 1;
}

const STATUS_TEXT: Record<GpsStatus, string> = {
    idle: 'GPS לא פעיל',
    requesting: 'מבקש הרשאת מיקום...',
    active: 'מעקב פעיל',
    denied: 'הרשאת מיקום נדחתה',
    unavailable: 'GPS לא זמין',
    error: 'שגיאת GPS',
};

const STATUS_COLOR: Record<GpsStatus, string> = {
    idle: 'text-text-muted',
    requesting: 'text-info-blue',
    active: 'text-signal-green',
    denied: 'text-danger-red',
    unavailable: 'text-warning-amber',
    error: 'text-danger-red',
};

export function GpsStatusBar({ gpsStatus, accuracy, currentZoneName, isInsideZone }: GpsStatusBarProps) {
    const strength = getSignalStrength(accuracy);

    return (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-dark/60 border border-border-subtle/30">
            {/* Left side: GPS icon + status */}
            <div className="flex items-center gap-2">
                {/* Signal bars */}
                <div className="flex items-end gap-[2px] h-4">
                    {[1, 2, 3, 4].map((bar) => (
                        <div
                            key={bar}
                            className={cn(
                                'w-[3px] rounded-sm transition-all',
                                bar <= strength
                                    ? gpsStatus === 'active' ? 'bg-signal-green' : 'bg-text-muted'
                                    : 'bg-border-subtle/30'
                            )}
                            style={{ height: `${bar * 3 + 2}px` }}
                        />
                    ))}
                </div>

                {/* Status text */}
                <span className={cn('text-[10px] font-medium uppercase tracking-wider', STATUS_COLOR[gpsStatus])}>
                    {STATUS_TEXT[gpsStatus]}
                </span>

                {/* Accuracy badge */}
                {gpsStatus === 'active' && accuracy !== null && (
                    <span className="text-[9px] data-mono text-text-muted px-1.5 py-0.5 rounded bg-slate-dark">
                        ±{accuracy}m
                    </span>
                )}
            </div>

            {/* Right side: Zone indicator */}
            <div className="flex items-center gap-1.5">
                <div className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    isInsideZone ? 'bg-signal-green dot-pulse-green' : 'bg-warning-amber'
                )} />
                <span className={cn(
                    'text-[10px] font-medium',
                    isInsideZone ? 'text-signal-green' : 'text-warning-amber'
                )}>
                    {currentZoneName || 'מחוץ לתחום'}
                </span>
            </div>
        </div>
    );
}
