'use client';

import { Suspense } from 'react';
import { AppShell } from '@/shared/components';
import { SoldierHome } from '@/features/dashboard';
import { GeofenceProvider } from '@/providers/GeofenceProvider';

export default function SoldierPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-midnight" />}>
            <AppShell>
                <GeofenceProvider>
                    <SoldierHome />
                </GeofenceProvider>
            </AppShell>
        </Suspense>
    );
}
