'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — Sidebar Navigation (Desktop-only, Hebrew RTL)
// ─────────────────────────────────────────────────────────────

import { useAuth } from '@/providers/AuthProvider';
import { useDisplay } from '@/providers/DisplayProvider';
import { cn } from '@/shared/utils/cn';
import { ROUTES } from '@/lib/constants';
import { t } from '@/lib/i18n';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface SidebarProps {
    onClose: () => void;
}

const NAV_ITEMS = {
    soldier: [
        { label: t.nav.myStatus, href: ROUTES.SOLDIER, icon: '◉' },
    ],
    commander: [
        { label: t.nav.dashboard, href: ROUTES.COMMANDER, icon: '◫' },
    ],
    senior_commander: [
        { label: t.nav.overview, href: ROUTES.SENIOR, icon: '◈' },
        { label: t.nav.geofence, href: `${ROUTES.SENIOR}?tab=geofence`, icon: '⬡' },
    ],
};

export function Sidebar({ onClose }: SidebarProps) {
    const { user, logout } = useAuth();
    const { isLargeUI, toggleLargeUI } = useDisplay();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    if (!user) return null;

    const items = NAV_ITEMS[user.role] || [];

    return (
        <div className="flex flex-col h-full bg-onyx border-e border-border-subtle">
            {/* Logo */}
            <div className="flex items-center h-14 px-4 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-signal-green/10 flex items-center justify-center">
                        <span className="text-signal-green font-bold text-sm">LP</span>
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-text-primary tracking-wide">{t.app.name}</h1>
                        <p className="text-[10px] text-text-muted">{t.app.subtitle}</p>
                    </div>
                </div>
            </div>

            {/* User info */}
            <div className="px-4 py-4 border-b border-border-subtle">
                <div className="glass-panel p-3">
                    <p className="text-xs text-text-muted mb-1">{user.rank.label}</p>
                    <p className="text-sm font-semibold text-text-primary">
                        {user.firstName} {user.lastName}
                    </p>
                    <p className="data-mono text-xs text-text-muted mt-1">{t.soldierCard.sn} {user.serviceNumber}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                        <div className={cn(
                            'w-2 h-2 rounded-full',
                            user.role === 'soldier' ? 'bg-signal-green dot-pulse-green' : 'bg-info-blue'
                        )} />
                        <span className="text-xs text-text-secondary">
                            {t.roles[user.role]}
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <p className="px-3 mb-2 text-[10px] font-medium uppercase tracking-widest text-text-muted">
                    {t.nav.navigation}
                </p>
                {items.map((item) => {
                    const hrefPath = item.href.split('?')[0];
                    const hasQuery = item.href.includes('?');
                    const hrefQS = hasQuery ? item.href.split('?')[1] : '';

                    const active = hasQuery
                        ? pathname === hrefPath && searchParams.toString() === hrefQS
                        : pathname === item.href && (!searchParams.toString() || searchParams.toString() === '');

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 touch-target',
                                active
                                    ? 'bg-signal-green/10 text-signal-green border border-signal-green/20'
                                    : 'text-text-secondary hover:bg-slate-dark hover:text-text-primary'
                            )}
                        >
                            <span className="text-base">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Display & Logout */}
            <div className="p-3 border-t border-border-subtle flex flex-col gap-2">
                <button
                    onClick={toggleLargeUI}
                    className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all touch-target border",
                        isLargeUI
                            ? "bg-info-blue/10 text-info-blue border-info-blue/30"
                            : "text-text-secondary hover:bg-slate-dark hover:text-text-primary border-transparent"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-base">A±</span>
                        <span>תצוגה מוגדלת</span>
                    </div>
                    <div className={cn(
                        "w-8 h-4 rounded-full flex items-center p-0.5 transition-colors duration-200 relative",
                        isLargeUI ? "bg-info-blue" : "bg-slate-light"
                    )}>
                        <div className={cn(
                            "w-3 h-3 bg-white rounded-full shadow-sm absolute transition-all duration-200",
                            isLargeUI ? "left-0.5" : "right-0.5"
                        )} />
                    </div>
                </button>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-danger-red/80 hover:bg-danger-red/10 hover:text-danger-red transition-all touch-target border border-transparent"
                >
                    <span>⏻</span>
                    <span>{t.auth.signOut}</span>
                </button>
            </div>
        </div>
    );
}
