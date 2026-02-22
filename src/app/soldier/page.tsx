'use client';

import { AppShell } from '@/shared/components';
import { SoldierHome } from '@/features/dashboard';

export default function SoldierPage() {
    return (
        <AppShell>
            <SoldierHome />
        </AppShell>
    );
}
