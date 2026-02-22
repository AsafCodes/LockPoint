'use client';

import { Suspense } from 'react';
import { AppShell } from '@/shared/components';
import { GlobalOverview } from '@/features/dashboard';

export default function SeniorCommanderPage() {
    return (
        <AppShell>
            <Suspense fallback={<div className="animate-pulse h-8 bg-slate-dark rounded w-1/2" />}>
                <GlobalOverview />
            </Suspense>
        </AppShell>
    );
}
