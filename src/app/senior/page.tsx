'use client';

import { Suspense } from 'react';
import { AppShell } from '@/shared/components';
import { GlobalOverview } from '@/features/dashboard';

export default function SeniorCommanderPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-midnight" />}>
            <AppShell>
                <Suspense fallback={<div className="animate-pulse h-8 bg-slate-dark rounded w-1/2" />}>
                    <GlobalOverview />
                </Suspense>
            </AppShell>
        </Suspense>
    );
}
