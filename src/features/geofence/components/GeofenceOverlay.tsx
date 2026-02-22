'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — Geofence EXIT Overlay (Hebrew, Mobile-First)
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { ExitForm } from '@/features/attendance/components/ExitForm';
import { t } from '@/lib/i18n';

interface GeofenceOverlayProps {
    zoneName: string;
    onDismiss: () => void;
    onSubmitReport: (data: {
        destination: string;
        reason: string;
        estimatedReturn?: string;
        freeText?: string;
    }) => void;
}

export function GeofenceOverlay({ zoneName, onDismiss, onSubmitReport }: GeofenceOverlayProps) {
    const [showForm, setShowForm] = useState(false);

    return (
        <div className="fixed inset-0 z-[100] bg-midnight/95 backdrop-blur-md overlay-enter flex flex-col safe-top">
            {/* Warning Header */}
            <div className="flex-shrink-0 px-6 pt-12 pb-6 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warning-amber/10 border-2 border-warning-amber/30 mb-4 warning-flash">
                    <svg className="w-10 h-10 text-warning-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-warning-amber mb-2 tracking-wide">
                    {t.breach.title}
                </h1>
                <p className="text-text-secondary text-sm">
                    {t.breach.exitedPerimeter}
                </p>
                <p className="data-mono text-warning-amber text-lg mt-1">
                    {zoneName}
                </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
                {!showForm ? (
                    <div className="max-w-md mx-auto space-y-4 mt-8">
                        <p className="text-center text-text-secondary text-sm">
                            {t.breach.mustReport}
                        </p>

                        <button
                            onClick={() => setShowForm(true)}
                            className="w-full py-4 rounded-xl bg-warning-amber text-midnight font-bold text-lg transition-all hover:bg-warning-amber/90 active:scale-[0.98] touch-target"
                        >
                            {t.breach.reportWhereBtn}
                        </button>

                        <button
                            onClick={onDismiss}
                            className="w-full py-3 rounded-xl border border-border-subtle text-text-muted text-sm hover:bg-slate-dark transition-all touch-target"
                        >
                            {t.breach.dismiss}
                        </button>
                    </div>
                ) : (
                    <div className="max-w-md mx-auto mt-4">
                        <ExitForm
                            onSubmit={onSubmitReport}
                            onCancel={() => setShowForm(false)}
                        />
                    </div>
                )}
            </div>

            {/* Timestamp footer */}
            <div className="flex-shrink-0 px-6 py-3 border-t border-border-subtle text-center safe-bottom">
                <p className="data-mono text-xs text-text-muted">
                    {t.breach.detectedAt} {new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC
                </p>
            </div>
        </div>
    );
}
