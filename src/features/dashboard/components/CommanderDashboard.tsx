'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — Commander Dashboard (Hebrew, Mobile-First)
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { TacticalCard } from '@/shared/components';
import { StatusBadge } from '@/features/attendance/components/StatusBadge';
import { SoldierCard } from '@/features/hierarchy/components/SoldierCard';
import { OrgTree } from '@/features/hierarchy/components/OrgTree';
import { formatTacticalTime } from '@/shared/utils/formatters';
import { t } from '@/lib/i18n';
import type { Soldier } from '@/features/hierarchy/types';
import type { OrgNode } from '@/features/hierarchy/types';
import type { GeofenceEvent } from '@/features/geofence/types';
import { useCommanderDashboard } from '@/lib/api/hooks';

// Demo data removed - using real API

export function CommanderDashboard() {
    const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

    const { data, isLoading } = useCommanderDashboard();

    if (isLoading || !data) {
        return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-slate-dark rounded w-3/4"></div><div className="space-y-2"><div className="h-4 bg-slate-dark rounded"></div><div className="h-4 bg-slate-dark rounded w-5/6"></div></div></div></div>;
    }

    const { stats, soldiers, units, events } = data;

    const filteredSoldiers = selectedUnit
        ? soldiers.filter((s) => s.unitId === selectedUnit)
        : soldiers;

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">{t.commander.title}</h2>
                    <p className="text-sm text-text-muted mt-1">{t.commander.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-signal-green dot-pulse-green" />
                    <span className="data-mono text-xs text-text-muted">{t.status.live}</span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <TacticalCard>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted">{t.table.total}</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">{stats.total}</p>
                </TacticalCard>
                <TacticalCard glow="green">
                    <p className="text-[10px] uppercase tracking-widest text-text-muted">{t.senior.inBase}</p>
                    <p className="text-2xl font-bold text-signal-green mt-1">{stats.inBase}</p>
                </TacticalCard>
                <TacticalCard glow="amber">
                    <p className="text-[10px] uppercase tracking-widest text-text-muted">{t.senior.out}</p>
                    <p className="text-2xl font-bold text-warning-amber mt-1">{stats.outOfBase}</p>
                </TacticalCard>
                <TacticalCard>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted">{t.senior.unknownCount}</p>
                    <p className="text-2xl font-bold text-text-muted mt-1">{stats.unknown}</p>
                </TacticalCard>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Org Tree */}
                <div className="lg:col-span-1">
                    <TacticalCard>
                        <h3 className="text-sm font-semibold text-text-primary mb-3">{t.commander.unitStructure}</h3>
                        <OrgTree
                            nodes={units}
                            selectedId={selectedUnit || undefined}
                            onSelectNode={(node) => setSelectedUnit(
                                node.id === selectedUnit ? null : node.id
                            )}
                        />
                    </TacticalCard>
                </div>

                {/* Soldier List */}
                <div className="lg:col-span-2 space-y-4 md:space-y-6">
                    {/* Personnel */}
                    <div>
                        <h3 className="text-sm font-semibold text-text-primary mb-3">
                            {t.commander.personnel}
                            {selectedUnit && (
                                <button
                                    onClick={() => setSelectedUnit(null)}
                                    className="me-2 text-xs text-text-muted hover:text-text-secondary"
                                >
                                    {t.commander.showAll}
                                </button>
                            )}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredSoldiers.map((soldier) => (
                                <SoldierCard key={soldier.id} soldier={soldier} />
                            ))}
                        </div>
                    </div>

                    {/* Recent Events */}
                    <TacticalCard>
                        <h3 className="text-sm font-semibold text-text-primary mb-3">{t.commander.recentEvents}</h3>
                        <div className="space-y-2">
                            {events.map((event) => (
                                <div
                                    key={event.id}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-dark/50"
                                >
                                    <StatusBadge
                                        status={event.transition === 'ENTER' ? 'in_base' : 'out_of_base'}
                                        size="sm"
                                        showLabel={false}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-text-primary truncate">
                                            {event.soldierName}
                                            <span className="text-text-muted mx-1">•</span>
                                            <span className="text-text-secondary">{event.transition}</span>
                                            <span className="text-text-muted mx-1">•</span>
                                            <span className="text-text-muted">{event.zoneName}</span>
                                        </p>
                                    </div>
                                    <span className="data-mono text-xs text-text-muted flex-shrink-0">
                                        {formatTacticalTime(event.timestamp)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </TacticalCard>
                </div>
            </div>
        </div>
    );
}
