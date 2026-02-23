'use client';

import { AppShell } from '@/shared/components';
import { SoldierHome } from '@/features/dashboard';
import { GeofenceProvider } from '@/providers/GeofenceProvider';

export default function SoldierPage() {
    return (
        <AppShell>
            <GeofenceProvider>
                <SoldierHome />
            </GeofenceProvider>
        </AppShell>
    );
}
