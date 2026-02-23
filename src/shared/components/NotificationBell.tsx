'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — Notification Bell + Panel
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { cn } from '@/shared/utils/cn';

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string;
    isRead: boolean;
    relatedId: string | null;
    createdAt: string;
}

interface NotificationsResponse {
    notifications: Notification[];
    unreadCount: number;
}

// ── Time ago helper ──────────────────────────────────────────

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'עכשיו';
    if (mins < 60) return `לפני ${mins} דק'`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `לפני ${hours} שע'`;
    return `לפני ${Math.floor(hours / 24)} ימים`;
}

// ── Type icon ────────────────────────────────────────────────

function typeIcon(type: string): string {
    switch (type) {
        case 'EXIT_NO_REPORT': return '🚨';
        case 'UNKNOWN_STATUS': return '📡';
        case 'REPORT_REMINDER': return '📋';
        default: return '🔔';
    }
}

// ── Main Component ──────────────────────────────────────────

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    // Fetch notifications
    const { data } = useQuery<NotificationsResponse>({
        queryKey: ['notifications'],
        queryFn: () => apiClient.get<NotificationsResponse>('/notifications'),
        refetchInterval: 30_000, // Poll every 30s
    });

    const unreadCount = data?.unreadCount || 0;
    const notifications = data?.notifications || [];

    // Mark all read mutation
    const markAllRead = useMutation({
        mutationFn: () => apiClient.patch('/notifications', { markAllRead: true }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    // Mark single read
    const markRead = useMutation({
        mutationFn: (id: string) => apiClient.patch('/notifications', { ids: [id] }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    // Close on click outside
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-lg hover:bg-slate-dark transition-colors touch-target"
                aria-label="Notifications"
            >
                <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>

                {/* Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-danger-red text-white text-[10px] font-bold flex items-center justify-center px-1 animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute left-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl bg-onyx border border-border-subtle shadow-2xl z-50"
                    style={{ direction: 'rtl' }}>
                    {/* Header */}
                    <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-onyx/95 backdrop-blur-sm">
                        <span className="text-sm font-semibold text-text-primary">התראות</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllRead.mutate()}
                                className="text-[11px] text-info-blue hover:underline"
                            >
                                סמן הכל כנקרא
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-2xl mb-2">✅</p>
                            <p className="text-sm text-text-muted">אין התראות חדשות</p>
                        </div>
                    ) : (
                        <div>
                            {notifications.map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => { if (!n.isRead) markRead.mutate(n.id); }}
                                    className={cn(
                                        'w-full text-start px-4 py-3 border-b border-border-subtle/30 transition-colors',
                                        n.isRead
                                            ? 'bg-transparent'
                                            : 'bg-info-blue/5 hover:bg-info-blue/10'
                                    )}
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="text-base flex-shrink-0 mt-0.5">{typeIcon(n.type)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                'text-sm truncate',
                                                n.isRead ? 'text-text-secondary' : 'text-text-primary font-medium'
                                            )}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{n.body}</p>
                                            <p className="text-[10px] text-text-muted mt-1 data-mono">{timeAgo(n.createdAt)}</p>
                                        </div>
                                        {!n.isRead && (
                                            <span className="w-2 h-2 rounded-full bg-info-blue flex-shrink-0 mt-1.5" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
