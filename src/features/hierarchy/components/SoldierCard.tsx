'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — Soldier Status Card (Hebrew)
// ─────────────────────────────────────────────────────────────

import { TacticalCard } from '@/shared/components';
import { StatusBadge } from '@/features/attendance/components/StatusBadge';
import { formatRelativeTime, formatCoordinates } from '@/shared/utils/formatters';
import { t } from '@/lib/i18n';
import type { Soldier } from '@/features/hierarchy/types';

interface SoldierCardProps {
    soldier: Soldier;
    compact?: boolean;
    onClick?: () => void;
}

export function SoldierCard({ soldier, compact = false, onClick }: SoldierCardProps) {
    const glow = soldier.currentStatus === 'in_base' ? 'green'
        : soldier.currentStatus === 'out_of_base' ? 'amber'
            : 'none';

    return (
        <TacticalCard
            glow={glow}
            hover={!!onClick}
            onClick={onClick}
            className={compact ? 'p-3' : ''}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-slate-dark flex items-center justify-center text-xs font-bold text-text-primary border border-border-subtle flex-shrink-0">
                        {soldier.firstName[0]}{soldier.lastName[0]}
                    </div>

                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">
                            {soldier.rank.code} {soldier.lastName}, {soldier.firstName}
                        </p>
                        <p className="data-mono text-xs text-text-muted truncate">
                            {t.soldierCard.sn} {soldier.serviceNumber}
                        </p>
                    </div>
                </div>

                <StatusBadge status={soldier.currentStatus} size={compact ? 'sm' : 'md'} />
            </div>

            {!compact && (
                <div className="mt-3 pt-3 border-t border-border-subtle/50 grid grid-cols-2 gap-2">
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">{t.soldierCard.lastUpdate}</p>
                        <p className="data-mono text-xs text-text-secondary">
                            {soldier.lastLocationUpdate
                                ? formatRelativeTime(soldier.lastLocationUpdate)
                                : '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">{t.soldierCard.position}</p>
                        <p className="data-mono text-xs text-text-secondary">
                            {soldier.lastKnownLat && soldier.lastKnownLng
                                ? formatCoordinates(soldier.lastKnownLat, soldier.lastKnownLng)
                                : '—'}
                        </p>
                    </div>
                </div>
            )}
        </TacticalCard>
    );
}
