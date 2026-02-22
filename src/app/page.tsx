'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — Login / Landing Page (Hebrew, Mobile-First)
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { t } from '@/lib/i18n';

const ROLE_ROUTES = {
  soldier: ROUTES.SOLDIER,
  commander: ROUTES.COMMANDER,
  senior_commander: ROUTES.SENIOR,
} as const;

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [serviceNumber, setServiceNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push(ROLE_ROUTES[user.role]);
    }
  }, [isAuthenticated, user, router]);

  if (isAuthenticated && user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ serviceNumber, password });
    } catch {
      setError(t.auth.invalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (sn: string) => {
    setServiceNumber(sn);
    setPassword('demo');
    setLoading(true);
    try {
      await login({ serviceNumber: sn, password: 'demo' });
    } catch {
      setError(t.auth.demoFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-midnight safe-top safe-bottom">
      {/* Background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -start-32 w-96 h-96 bg-signal-green/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -end-32 w-96 h-96 bg-info-blue/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-signal-green/10 border border-signal-green/20 mb-4">
            <span className="text-signal-green font-bold text-2xl">LP</span>
          </div>
          <h1 className="text-2xl font-bold tracking-wide text-text-primary">{t.app.name}</h1>
          <p className="text-sm text-text-muted mt-1">{t.app.tagline}</p>
        </div>

        {/* Login Form */}
        <div className="glass-panel p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium tracking-wider text-text-secondary mb-1.5">
                {t.auth.serviceNumber}
              </label>
              <input
                type="text"
                value={serviceNumber}
                onChange={(e) => setServiceNumber(e.target.value)}
                placeholder={t.auth.placeholder.serviceNumber}
                className="w-full px-4 py-3 h-12 rounded-lg bg-slate-dark border border-border-subtle text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-signal-green/50 focus:ring-1 focus:ring-signal-green/20 transition-all data-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium tracking-wider text-text-secondary mb-1.5">
                {t.auth.password}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.auth.placeholder.password}
                className="w-full px-4 py-3 h-12 rounded-lg bg-slate-dark border border-border-subtle text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-signal-green/50 focus:ring-1 focus:ring-signal-green/20 transition-all"
                required
              />
            </div>

            {error && (
              <div className="px-3 py-2 rounded-lg bg-danger-red/10 border border-danger-red/20">
                <p className="text-xs text-danger-red">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 h-12 rounded-lg bg-signal-green text-midnight font-bold text-sm transition-all hover:bg-signal-green/90 active:scale-[0.98] disabled:opacity-50 touch-target"
            >
              {loading ? t.auth.authenticating : t.auth.signIn}
            </button>
          </form>
        </div>

        {/* Demo Quick Login - Only visible in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6">
            <p className="text-center text-[10px] uppercase tracking-widest text-text-muted mb-3">
              {t.auth.quickDemo}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleDemoLogin('S-001')}
                className="py-3 rounded-lg border border-border-subtle text-xs text-text-secondary hover:bg-slate-dark hover:text-text-primary transition-all touch-target"
              >
                <p className="font-medium">{t.roles.soldier}</p>
                <p className="data-mono text-[10px] text-text-muted">S-001</p>
              </button>
              <button
                onClick={() => handleDemoLogin('C-001')}
                className="py-3 rounded-lg border border-border-subtle text-xs text-text-secondary hover:bg-slate-dark hover:text-text-primary transition-all touch-target"
              >
                <p className="font-medium">{t.roles.commander}</p>
                <p className="data-mono text-[10px] text-text-muted">C-001</p>
              </button>
              <button
                onClick={() => handleDemoLogin('SC-001')}
                className="py-3 rounded-lg border border-border-subtle text-xs text-text-secondary hover:bg-slate-dark hover:text-text-primary transition-all touch-target"
              >
                <p className="font-medium">{t.roles.senior_commander}</p>
                <p className="data-mono text-[10px] text-text-muted">SC-001</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
