// ─────────────────────────────────────────────────────────────
// LockPoint — Formatters (Hebrew-aware)
// ─────────────────────────────────────────────────────────────

import { t } from '@/lib/i18n';

/**
 * Format ISO timestamp to tactical display: "21-FEB-2026 18:30:00"
 */
export function formatTacticalTime(iso: string): string {
    const d = new Date(iso);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dd = String(d.getDate()).padStart(2, '0');
    const mmm = months[d.getMonth()];
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${dd}-${mmm}-${yyyy} ${hh}:${mm}:${ss}`;
}

/**
 * Format relative time in Hebrew: "לפני 2 דק'", "לפני 1 שע'"
 */
export function formatRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return t.time.secondsAgo(seconds);
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t.time.minutesAgo(minutes);
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t.time.hoursAgo(hours);
    const days = Math.floor(hours / 24);
    return t.time.daysAgo(days);
}

/**
 * Format coordinates to military grid style: "32.0853°N, 34.7818°E"
 */
export function formatCoordinates(lat: number, lng: number): string {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
}

/**
 * Format distance in meters/km
 */
export function formatDistance(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
}
