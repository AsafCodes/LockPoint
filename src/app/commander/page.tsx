'use client';

import { Suspense } from 'react';
import { AppShell } from '@/shared/components';
import { CommanderDashboard } from '@/features/dashboard';

export default function CommanderPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-midnight" />}>
            <AppShell>
                <CommanderDashboard />
            </AppShell>
        </Suspense>
    );
}
