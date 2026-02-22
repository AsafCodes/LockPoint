'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — Senior Commander Global Overview (Hebrew, Mobile-First)
// ─────────────────────────────────────────────────────────────

import { useSearchParams } from 'next/navigation';
import { TacticalCard } from '@/shared/components';
import { OrgTree } from '@/features/hierarchy/components/OrgTree';
import { cn } from '@/shared/utils/cn';
import { t } from '@/lib/i18n';
import type { OrgNode } from '@/features/hierarchy/types';
import { useSeniorDashboard } from '@/lib/api/hooks';

// Demo data removed - using real API

// ── Demo geofence zones ─────────────────────────────────────

const DEMO_ZONES = [
    { id: 'zone-1', name: 'מחנה אלפא — היקף ראשי', type: 'circle' as const, radius: 500, lat: 32.08, lng: 34.78, active: true },
    { id: 'zone-2', name: 'שטח אימונים בראבו', type: 'circle' as const, radius: 300, lat: 32.10, lng: 34.80, active: true },
    { id: 'zone-3', name: 'מחסן אספקה צ\'ארלי', type: 'circle' as const, radius: 150, lat: 32.07, lng: 34.77, active: false },
];

// ── Geofence Management View ────────────────────────────────

function GeofenceManagementView() {
    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">{t.geofenceMgmt.title}</h2>
                    <p className="text-sm text-text-muted mt-1">{t.geofenceMgmt.subtitle}</p>
                </div>
                <button className="px-4 py-2.5 rounded-lg bg-signal-green text-midnight font-bold text-sm transition-all hover:bg-signal-green/90 active:scale-[0.98] touch-target">
                    {t.geofenceMgmt.createZone}
                </button>
            </div>

            {/* Map placeholder */}
            <TacticalCard>
                <div className="h-56 md:h-80 rounded-lg bg-slate-dark flex items-center justify-center border border-border-subtle">
                    <div className="text-center">
                        <p className="text-5xl mb-3">🗺️</p>
                        <p className="text-sm text-text-primary font-medium">{t.geofenceMgmt.mapTitle}</p>
                        <p className="text-xs text-text-muted mt-1">{t.geofenceMgmt.mapSubtitle}</p>
                    </div>
                </div>
            </TacticalCard>

            {/* Active Zones — Table on desktop, Cards on mobile */}
            <TacticalCard>
                <h3 className="text-sm font-semibold text-text-primary mb-4">{t.geofenceMgmt.configuredZones}</h3>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                    {DEMO_ZONES.map((zone) => (
                        <div key={zone.id} className="p-3 rounded-lg bg-slate-dark/50 border border-border-subtle/50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-text-primary font-medium">{zone.name}</span>
                                <span className={cn(
                                    'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded',
                                    zone.active ? 'bg-signal-green/10 text-signal-green' : 'bg-slate-500/10 text-slate-400'
                                )}>
                                    <span className={cn('w-1.5 h-1.5 rounded-full', zone.active ? 'bg-signal-green' : 'bg-slate-500')} />
                                    {zone.active ? t.status.active : t.status.inactive}
                                </span>
                            </div>
                            <div className="flex gap-4 text-xs text-text-muted">
                                <span>{t.geofenceMgmt.type}: <span className="text-info-blue">{zone.type}</span></span>
                                <span>{t.soldier.radius}: <span className="data-mono text-text-secondary">{zone.radius}m</span></span>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button className="text-xs px-3 py-1.5 rounded-lg border border-border-subtle text-text-secondary touch-target">
                                    {t.geofenceMgmt.edit}
                                </button>
                                <button className="text-xs px-3 py-1.5 rounded-lg border border-danger-red/30 text-danger-red/70 touch-target">
                                    {t.geofenceMgmt.delete}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border-subtle">
                                <th className="px-4 py-2 text-start text-xs font-medium uppercase tracking-wider text-text-muted">{t.geofenceMgmt.zoneName}</th>
                                <th className="px-4 py-2 text-start text-xs font-medium uppercase tracking-wider text-text-muted">{t.geofenceMgmt.type}</th>
                                <th className="px-4 py-2 text-start text-xs font-medium uppercase tracking-wider text-text-muted">{t.geofenceMgmt.radiusM}</th>
                                <th className="px-4 py-2 text-start text-xs font-medium uppercase tracking-wider text-text-muted">{t.geofenceMgmt.coordinates}</th>
                                <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-text-muted">{t.status.active}</th>
                                <th className="px-4 py-2 text-start text-xs font-medium uppercase tracking-wider text-text-muted">{t.geofenceMgmt.actions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DEMO_ZONES.map((zone) => (
                                <tr key={zone.id} className="border-b border-border-subtle/50">
                                    <td className="px-4 py-3 text-sm text-text-primary font-medium">{zone.name}</td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs px-2 py-1 rounded bg-info-blue/10 text-info-blue uppercase tracking-wider font-medium">
                                            {zone.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-secondary data-mono">{zone.radius}</td>
                                    <td className="px-4 py-3 text-xs text-text-muted data-mono">
                                        {zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={cn(
                                            'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded',
                                            zone.active ? 'bg-signal-green/10 text-signal-green' : 'bg-slate-500/10 text-slate-400'
                                        )}>
                                            <span className={cn('w-1.5 h-1.5 rounded-full', zone.active ? 'bg-signal-green' : 'bg-slate-500')} />
                                            {zone.active ? t.status.active : t.status.inactive}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button className="text-xs px-2.5 py-1.5 rounded-lg border border-border-subtle text-text-secondary hover:bg-slate-dark hover:text-text-primary transition-all">
                                                {t.geofenceMgmt.edit}
                                            </button>
                                            <button className="text-xs px-2.5 py-1.5 rounded-lg border border-danger-red/30 text-danger-red/70 hover:bg-danger-red/10 hover:text-danger-red transition-all">
                                                {t.geofenceMgmt.delete}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </TacticalCard>
        </div>
    );
}

// ── Main Component ──────────────────────────────────────────

export function GlobalOverview() {
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab');

    if (activeTab === 'geofence') {
        return <GeofenceManagementView />;
    }

    const { data, isLoading } = useSeniorDashboard();

    if (isLoading || !data) {
        return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-slate-dark rounded w-3/4"></div><div className="space-y-2"><div className="h-4 bg-slate-dark rounded"></div><div className="h-4 bg-slate-dark rounded w-5/6"></div></div></div></div>;
    }

    const totals = data.globalStats;
    const readiness = Math.round((totals.inBase / totals.total) * 100);

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">{t.senior.title}</h2>
                    <p className="text-sm text-text-muted mt-1">{t.senior.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-signal-green dot-pulse-green" />
                    <span className="data-mono text-xs text-text-muted">{t.status.live}</span>
                </div>
            </div>

            {/* Global Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <TacticalCard>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted">{t.senior.totalForce}</p>
                    <p className="text-3xl font-bold text-text-primary mt-1">{totals.total}</p>
                </TacticalCard>
                <TacticalCard glow="green">
                    <p className="text-[10px] uppercase tracking-widest text-text-muted">{t.senior.inBase}</p>
                    <p className="text-3xl font-bold text-signal-green mt-1">{totals.inBase}</p>
                </TacticalCard>
                <TacticalCard glow="amber">
                    <p className="text-[10px] uppercase tracking-widest text-text-muted">{t.senior.out}</p>
                    <p className="text-3xl font-bold text-warning-amber mt-1">{totals.outOfBase}</p>
                </TacticalCard>
                <TacticalCard>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted">{t.senior.unknownCount}</p>
                    <p className="text-3xl font-bold text-text-muted mt-1">{totals.unknown}</p>
                </TacticalCard>
                <TacticalCard glow={readiness >= 80 ? 'green' : 'amber'}>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted">{t.senior.readiness}</p>
                    <p className={cn(
                        'text-3xl font-bold mt-1',
                        readiness >= 80 ? 'text-signal-green' : 'text-warning-amber'
                    )}>
                        {readiness}%
                    </p>
                </TacticalCard>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Org Tree */}
                <div className="lg:col-span-1">
                    <TacticalCard>
                        <h3 className="text-sm font-semibold text-text-primary mb-3">{t.senior.commandStructure}</h3>
                        <OrgTree nodes={data.units} />
                    </TacticalCard>
                </div>

                {/* Unit Readiness Table */}
                <div className="lg:col-span-2">
                    <TacticalCard>
                        <h3 className="text-sm font-semibold text-text-primary mb-3">{t.senior.unitReadiness}</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border-subtle">
                                        <th className="px-4 py-2 text-start text-xs font-medium uppercase tracking-wider text-text-muted">{t.table.unit}</th>
                                        <th className="px-4 py-2 text-start text-xs font-medium uppercase tracking-wider text-text-muted">{t.table.total}</th>
                                        <th className="px-4 py-2 text-start text-xs font-medium uppercase tracking-wider text-text-muted">{t.table.inBase}</th>
                                        <th className="px-4 py-2 text-start text-xs font-medium uppercase tracking-wider text-text-muted">{t.table.out}</th>
                                        <th className="px-4 py-2 text-start text-xs font-medium uppercase tracking-wider text-text-muted">{t.table.readiness}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.units.filter(u => u.type === 'brigade' || u.type === 'battalion').map((unit: any) => {
                                        const total = unit.stats?.totalPersonnel || 0;
                                        const ready = Math.round(((unit.stats?.inBase || 0) / (total || 1)) * 100);
                                        return (
                                            <tr key={unit.name} className="border-b border-border-subtle/50">
                                                <td className="px-4 py-3 text-sm text-text-primary font-medium">{unit.name}</td>
                                                <td className="px-4 py-3 text-sm text-text-secondary data-mono">{total}</td>
                                                <td className="px-4 py-3 text-sm text-signal-green data-mono">{unit.stats?.inBase || 0}</td>
                                                <td className="px-4 py-3 text-sm text-warning-amber data-mono">{unit.stats?.outOfBase || 0}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-20 h-1.5 rounded-full bg-slate-dark overflow-hidden">
                                                            <div
                                                                className={'h-full rounded-full ' + (
                                                                    ready >= 80 ? 'bg-signal-green' :
                                                                        ready >= 50 ? 'bg-warning-amber' : 'bg-danger-red'
                                                                )}
                                                                style={{ width: `${ready}%` }}
                                                            />
                                                        </div>
                                                        <span className={'data-mono text-xs font-medium ' + (
                                                            ready >= 80 ? 'text-signal-green' : 'text-warning-amber'
                                                        )}>
                                                            {ready}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </TacticalCard>
                </div>
            </div>
        </div>
    );
}
