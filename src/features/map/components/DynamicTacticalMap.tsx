'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — TacticalMap Dynamic Loader
// ─────────────────────────────────────────────────────────────
// Leaflet depends on `window`, so it must be imported with
// SSR disabled. This wrapper handles that cleanly.
// ─────────────────────────────────────────────────────────────

import dynamic from 'next/dynamic';
import type { MapSoldier, MapZone } from './TacticalMap';

const TacticalMapInner = dynamic(
    () => import('./TacticalMap').then((mod) => mod.TacticalMap),
    {
        ssr: false,
        loading: () => (
            <div className="rounded-lg border border-border-subtle bg-slate-dark/50 flex items-center justify-center"
                style={{ height: '320px' }}>
                <div className="text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-signal-green/30 border-t-signal-green rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-text-muted">טוען מפה...</p>
                </div>
            </div>
        ),
    }
);

interface DynamicTacticalMapProps {
    soldiers: MapSoldier[];
    zones: MapZone[];
    height?: string;
    interactive?: boolean;
}

export function DynamicTacticalMap(props: DynamicTacticalMapProps) {
    return <TacticalMapInner {...props} />;
}
