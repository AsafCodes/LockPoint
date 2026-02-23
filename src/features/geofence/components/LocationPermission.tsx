'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — Location Permission Request
// ─────────────────────────────────────────────────────────────
// Shown when the soldier needs to grant GPS access.
// Explains why location is required and offers a retry flow.
// ─────────────────────────────────────────────────────────────

import { TacticalCard } from '@/shared/components';

interface LocationPermissionProps {
    status: 'requesting' | 'denied' | 'unavailable' | 'error';
    onRetry: () => void;
}

const MESSAGES: Record<string, { icon: string; title: string; body: string }> = {
    requesting: {
        icon: '📍',
        title: 'נדרשת הרשאת מיקום',
        body: 'מערכת LockPoint דורשת גישה למיקום שלך כדי לזהות כניסה ויציאה מבסיסים באופן אוטומטי. אנא אשר את ההרשאה בחלון הקופץ.',
    },
    denied: {
        icon: '🚫',
        title: 'הרשאת מיקום נדחתה',
        body: 'לא ניתן להפעיל מעקב גדר גיאוגרפית ללא הרשאת מיקום. אנא הפעל את שירותי המיקום בהגדרות המכשיר ולחץ "נסה שוב".',
    },
    unavailable: {
        icon: '📡',
        title: 'GPS לא זמין',
        body: 'לא ניתן לגשת לשירותי המיקום במכשיר זה. ודא שה-GPS מופעל ונסה שוב.',
    },
    error: {
        icon: '⚠️',
        title: 'שגיאת מיקום',
        body: 'אירעה שגיאה בגישה לנתוני המיקום. ייתכן שאין אזורי גדר פעילים במערכת. לחץ "נסה שוב".',
    },
};

export function LocationPermission({ status, onRetry }: LocationPermissionProps) {
    const msg = MESSAGES[status] || MESSAGES.error;

    return (
        <div className="flex items-center justify-center min-h-[50vh] px-4">
            <TacticalCard className="max-w-sm text-center">
                <div className="py-6 space-y-4">
                    <p className="text-5xl">{msg.icon}</p>
                    <h3 className="text-lg font-bold text-text-primary">{msg.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{msg.body}</p>

                    {status !== 'requesting' && (
                        <button
                            onClick={onRetry}
                            className="mt-4 px-6 py-3 rounded-lg bg-signal-green text-midnight font-bold text-sm transition-all hover:bg-signal-green/90 active:scale-[0.98] touch-target"
                        >
                            נסה שוב
                        </button>
                    )}

                    {status === 'requesting' && (
                        <div className="flex justify-center">
                            <div className="w-6 h-6 border-2 border-signal-green/30 border-t-signal-green rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            </TacticalCard>
        </div>
    );
}
