'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — ZoneDrawer Dynamic Loader (SSR-safe)
// ─────────────────────────────────────────────────────────────

import dynamic from 'next/dynamic';
import type { ZoneDrawerProps } from './ZoneDrawer';

const ZoneDrawerInner = dynamic(
    () => import('./ZoneDrawer').then((mod) => mod.ZoneDrawer),
    {
        ssr: false,
        loading: () => (
            <div className="fixed inset-0 z-50 bg-midnight flex items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-signal-green/30 border-t-signal-green rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-text-muted">טוען מפת ציור...</p>
                </div>
            </div>
        ),
    }
);

export function DynamicZoneDrawer(props: ZoneDrawerProps) {
    return <ZoneDrawerInner {...props} />;
}
