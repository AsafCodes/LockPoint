'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — Status Badge (Hebrew)
// ─────────────────────────────────────────────────────────────

import { cn } from '@/shared/utils/cn';
import { STATUS_COLORS } from '@/lib/constants';
import { t } from '@/lib/i18n';

type Status = 'in_base' | 'out_of_base' | 'unknown';

interface StatusBadgeProps {
    status: Status;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    pulse?: boolean;
}

const LABELS: Record<Status, string> = {
    in_base: t.status.in_base,
    out_of_base: t.status.out_of_base,
    unknown: t.status.unknown,
};

const PULSE_CLASS: Record<Status, string> = {
    in_base: 'dot-pulse-green',
    out_of_base: 'dot-pulse-amber',
    unknown: '',
};

export function StatusBadge({ status, size = 'md', showLabel = true, pulse = true }: StatusBadgeProps) {
    const colors = STATUS_COLORS[status];
    const dotSize = { sm: 'w-1.5 h-1.5', md: 'w-2 h-2', lg: 'w-3 h-3' }[size];
    const textSize = { sm: 'text-[10px]', md: 'text-xs', lg: 'text-sm' }[size];
    const padding = { sm: 'px-2 py-0.5', md: 'px-2.5 py-1', lg: 'px-3 py-1.5' }[size];

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full font-medium',
                colors.bg,
                colors.text,
                colors.border,
                'border',
                padding,
                textSize
            )}
        >
            <span
                className={cn(
                    'rounded-full flex-shrink-0',
                    colors.dot,
                    dotSize,
                    pulse && PULSE_CLASS[status]
                )}
            />
            {showLabel && <span>{LABELS[status]}</span>}
        </span>
    );
}
