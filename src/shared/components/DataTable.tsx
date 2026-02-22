'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — DataTable (Shared UI Primitive)
// ─────────────────────────────────────────────────────────────

import { cn } from '@/shared/utils/cn';
import { useState } from 'react';
import { t } from '@/lib/i18n';

interface Column<T> {
    key: string;
    label: string;
    mono?: boolean;
    render?: (item: T) => React.ReactNode;
    sortable?: boolean;
    width?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (item: T) => string;
    emptyMessage?: string;
    className?: string;
    onRowClick?: (item: T) => void;
}

export function DataTable<T>({
    columns,
    data,
    keyExtractor,
    emptyMessage = t.table.noData,
    className,
    onRowClick,
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const toggleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const sorted = sortKey
        ? [...data].sort((a, b) => {
            const av = (a as Record<string, unknown>)[sortKey];
            const bv = (b as Record<string, unknown>)[sortKey];
            const cmp = String(av ?? '').localeCompare(String(bv ?? ''));
            return sortDir === 'asc' ? cmp : -cmp;
        })
        : data;

    return (
        <div className={cn('overflow-x-auto', className)}>
            <table className="w-full">
                <thead>
                    <tr className="border-b border-border-subtle">
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={cn(
                                    'px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-text-muted',
                                    col.sortable && 'cursor-pointer hover:text-text-secondary transition-colors',
                                    col.mono && 'data-mono'
                                )}
                                style={col.width ? { width: col.width } : undefined}
                                onClick={() => col.sortable && toggleSort(col.key)}
                            >
                                <span className="flex items-center gap-1">
                                    {col.label}
                                    {col.sortable && sortKey === col.key && (
                                        <span className="text-signal-green">
                                            {sortDir === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sorted.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-4 py-8 text-center text-text-muted text-sm"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        sorted.map((item) => (
                            <tr
                                key={keyExtractor(item)}
                                onClick={() => onRowClick?.(item)}
                                className={cn(
                                    'border-b border-border-subtle/50 transition-colors',
                                    onRowClick && 'cursor-pointer hover:bg-slate-dark/50'
                                )}
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        className={cn(
                                            'px-4 py-3 text-sm text-text-primary',
                                            col.mono && 'data-mono text-text-secondary'
                                        )}
                                    >
                                        {col.render
                                            ? col.render(item)
                                            : String((item as Record<string, unknown>)[col.key] ?? '—')}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
