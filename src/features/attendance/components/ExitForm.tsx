'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — "Where To?" Exit Form (Hebrew, Mobile-First)
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import type { ExitReason } from '@/features/geofence/types';
import { t } from '@/lib/i18n';

interface ExitFormProps {
    onSubmit: (data: {
        destination: string;
        reason: string;
        estimatedReturn?: string;
        freeText?: string;
    }) => void;
    onCancel: () => void;
}

const REASON_OPTIONS: { value: ExitReason; label: string }[] = [
    { value: 'personal_leave', label: t.reasons.personal_leave },
    { value: 'medical', label: t.reasons.medical },
    { value: 'official_duty', label: t.reasons.official_duty },
    { value: 'training', label: t.reasons.training },
    { value: 'emergency', label: t.reasons.emergency },
    { value: 'other', label: t.reasons.other },
];

export function ExitForm({ onSubmit, onCancel }: ExitFormProps) {
    const [destination, setDestination] = useState('');
    const [reason, setReason] = useState<ExitReason>('personal_leave');
    const [estimatedReturn, setEstimatedReturn] = useState('');
    const [freeText, setFreeText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!destination) return;

        onSubmit({
            destination,
            reason,
            estimatedReturn: estimatedReturn ? new Date(estimatedReturn).toISOString() : undefined,
            freeText: freeText || undefined,
        });
    };

    const inputClass =
        'w-full px-4 py-3 h-12 rounded-lg bg-slate-dark border border-border-subtle text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-warning-amber/50 focus:ring-1 focus:ring-warning-amber/20 transition-all';

    const labelClass = 'block text-xs font-medium tracking-wider text-text-secondary mb-1.5';

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-bold text-text-primary mb-4">{t.exitForm.title}</h3>

            <div>
                <label className={labelClass}>{t.exitForm.destination}</label>
                <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder={t.exitForm.destinationPlaceholder}
                    className={inputClass}
                    required
                />
            </div>

            <div>
                <label className={labelClass}>{t.exitForm.reason}</label>
                <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as ExitReason)}
                    className={inputClass}
                >
                    {REASON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className={labelClass}>{t.exitForm.estimatedReturn} <span className="normal-case tracking-normal text-text-muted">{t.exitForm.optional}</span></label>
                <input
                    type="datetime-local"
                    value={estimatedReturn}
                    onChange={(e) => setEstimatedReturn(e.target.value)}
                    className={inputClass}
                />
            </div>

            <div>
                <label className={labelClass}>{t.exitForm.additionalNotes} <span className="normal-case tracking-normal text-text-muted">{t.exitForm.optional}</span></label>
                <textarea
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    placeholder={t.exitForm.notesPlaceholder}
                    rows={3}
                    className={inputClass}
                />
            </div>

            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 rounded-lg border border-border-subtle text-text-secondary text-sm hover:bg-slate-dark transition-all touch-target"
                >
                    {t.exitForm.cancel}
                </button>
                <button
                    type="submit"
                    className="flex-1 py-3 rounded-lg bg-warning-amber text-midnight font-bold text-sm transition-all hover:bg-warning-amber/90 active:scale-[0.98] disabled:opacity-40 touch-target"
                    disabled={!destination}
                >
                    {t.exitForm.submit}
                </button>
            </div>
        </form>
    );
}
