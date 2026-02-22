'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — TacticalCard (Shared UI Primitive)
// ─────────────────────────────────────────────────────────────

import { cn } from '@/shared/utils/cn';
import type { ReactNode } from 'react';

interface TacticalCardProps {
    children: ReactNode;
    className?: string;
    glow?: 'green' | 'amber' | 'red' | 'none';
    hover?: boolean;
    onClick?: () => void;
}

export function TacticalCard({
    children,
    className,
    glow = 'none',
    hover = false,
    onClick,
}: TacticalCardProps) {
    const glowClass = {
        green: 'glow-green',
        amber: 'glow-amber',
        red: 'glow-red',
        none: '',
    }[glow];

    return (
        <div
            onClick={onClick}
            className={cn(
                'glass-panel p-4 transition-all duration-200',
                hover && 'glass-panel-hover cursor-pointer',
                glowClass,
                onClick && 'cursor-pointer',
                className
            )}
        >
            {children}
        </div>
    );
}
