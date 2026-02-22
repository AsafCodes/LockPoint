'use client';

import { AppShell } from '@/shared/components';
import { CommanderDashboard } from '@/features/dashboard';

export default function CommanderPage() {
    return (
        <AppShell>
            <CommanderDashboard />
        </AppShell>
    );
}
