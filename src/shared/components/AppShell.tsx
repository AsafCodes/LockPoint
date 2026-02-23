'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — App Shell (Mobile-First + RTL)
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/shared/utils/cn';
import { useAuth } from '@/providers/AuthProvider';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { t } from '@/lib/i18n';
const packageInfo = require('../../../../package.json');

interface AppShellProps {
    children: ReactNode;
}

// ── Bottom Tab Config (role-aware) ──────────────────────────

const BOTTOM_TABS = {
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

export function AppShell({ children }: AppShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, isAuthenticated } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    // Redirect to login if not authenticated (e.g. after page refresh)
    useEffect(() => {
        if (!isAuthenticated && pathname !== '/') {
            router.replace('/');
        }
    }, [isAuthenticated, pathname, router]);

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-midnight">
                <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-signal-green/30 border-t-signal-green rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-text-muted">מפנה לדף ההתחברות...</p>
                </div>
            </div>
        );
    }

    const tabs = BOTTOM_TABS[user.role] || [];

    return (
        <div className="flex h-screen overflow-hidden bg-midnight">
            {/* Desktop sidebar — hidden on mobile */}
            <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30 lg:start-0">
                <Sidebar onClose={() => setSidebarOpen(false)} />
                {/* Version Display */}
                <div className="p-4 border-t border-border-subtle/50">
                    <p className="text-[10px] text-text-muted data-mono opacity-50 text-center">
                        v{packageInfo.version}
                    </p>
                </div>
            </aside>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <aside className="fixed inset-y-0 start-0 w-64 z-50 lg:hidden">
                        <Sidebar onClose={() => setSidebarOpen(false)} />
                    </aside>
                </>
            )}

            {/* Main content */}
            <div className="flex-1 lg:ps-64 flex flex-col min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-20 flex items-center h-14 px-4 border-b border-border-subtle bg-midnight/80 backdrop-blur-md safe-top">
                    <button
                        className="lg:hidden p-2 rounded-lg hover:bg-slate-dark transition-colors me-3 touch-target"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-signal-green dot-pulse-green" />
                        <span className="data-mono text-text-secondary text-xs uppercase tracking-widest">
                            {t.app.active}
                        </span>
                    </div>

                    <div className="me-auto flex items-center gap-3">
                        <span className="data-mono text-xs text-text-muted hidden sm:block">
                            {user.rank.code} {user.lastName}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-slate-dark flex items-center justify-center text-xs font-bold text-signal-green border border-border-subtle">
                            {user.firstName[0]}{user.lastName[0]}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className={cn(
                    'flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-bottomnav',
                    'max-w-[1920px] mx-auto w-full'
                )}>
                    {children}
                </main>

                {/* Bottom Tab Bar — mobile only */}
                {tabs.length > 0 && (
                    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-onyx/95 backdrop-blur-md border-t border-border-subtle safe-bottom">
                        <div className="flex items-center justify-around h-16">
                            {tabs.map((tab) => {
                                const hrefPath = tab.href.split('?')[0];
                                const hasQuery = tab.href.includes('?');
                                const active = hasQuery
                                    ? pathname === hrefPath && typeof window !== 'undefined' && window.location.search === '?' + tab.href.split('?')[1]
                                    : pathname === hrefPath && (typeof window === 'undefined' || !window.location.search);

                                return (
                                    <Link
                                        key={tab.href}
                                        href={tab.href}
                                        className={cn(
                                            'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors touch-target',
                                            active
                                                ? 'text-signal-green'
                                                : 'text-text-muted'
                                        )}
                                    >
                                        <span className="text-lg">{tab.icon}</span>
                                        <span className="text-[10px] font-medium">{tab.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>
                )}
            </div>
        </div>
    );
}
