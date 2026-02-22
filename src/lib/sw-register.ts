// ─────────────────────────────────────────────────────────────
// LockPoint — Service Worker Registration
// ─────────────────────────────────────────────────────────────

export function registerServiceWorker() {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('[LockPoint] SW registered:', registration.scope);
        } catch (err) {
            console.error('[LockPoint] SW registration failed:', err);
        }
    });
}
