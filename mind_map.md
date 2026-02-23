# LockPoint — Feature Mind Map

> Living document tracking all features across versions.
> Updated: 2026-02-23 (v0.2.0)

---

## v0.1.0-Alpha — Secure Foundation ✅

| Feature | Status | Files |
|---------|--------|-------|
| **Prisma + SQLite Database** | ✅ Done | `prisma/schema.prisma`, `src/lib/db.ts` |
| **bcrypt Password Hashing** | ✅ Done | `src/lib/auth/password.ts` |
| **JWT Access + Refresh Tokens** | ✅ Done | `src/lib/auth/jwt.ts` |
| **RBAC Middleware** | ✅ Done | `src/lib/auth/middleware.ts` |
| **Immutable Audit Logging** | ✅ Done | `src/lib/auth/audit.ts` |
| **Auth API (login/refresh/me)** | ✅ Done | `src/app/api/auth/*/route.ts` |
| **Soldiers API** | ✅ Done | `src/app/api/soldiers/route.ts` |
| **Zones CRUD API** | ✅ Done | `src/app/api/zones/route.ts` |
| **Events API (manual)** | ✅ Done | `src/app/api/events/route.ts` |
| **Reports API** | ✅ Done | `src/app/api/reports/route.ts` |
| **Commander Dashboard (real data)** | ✅ Done | `src/features/dashboard/components/CommanderDashboard.tsx` |
| **Senior Dashboard (real data)** | ✅ Done | `src/features/dashboard/components/GlobalOverview.tsx` |
| **Soldier Home (real data)** | ✅ Done | `src/features/dashboard/components/SoldierHome.tsx` |
| **Docker + Render.com Deploy** | ✅ Done | `Dockerfile`, `render.yaml` |
| **Demo Login (dev-only)** | ✅ Done | `src/app/page.tsx` |

---

## v0.2.0-Alpha — Real Geofencing ✅

| Feature | Status | Files |
|---------|--------|-------|
| **React Geofence Monitor Hook** | ✅ Done | `src/features/geofence/hooks/useGeofenceMonitor.ts` |
| **Geofence Provider (app-wide)** | ✅ Done | `src/providers/GeofenceProvider.tsx` |
| **Auto ENTER/EXIT Detection** | ✅ Done | Wires `TransitionManager` + `CapacitorGPSBridge` |
| **Live GPS Status UI** | ✅ Done | `src/features/geofence/components/GpsStatusBar.tsx` |
| **Soldier Home (auto mode)** | ✅ Done | `src/features/dashboard/components/SoldierHome.tsx` |
| **Location Permission Flow** | ✅ Done | `src/features/geofence/components/LocationPermission.tsx` |
| **Version Bump to v0.2.0** | ✅ Done | `package.json` |

---

## Backlog — Future Versions

| Feature | Priority | Version |
|---------|----------|---------|
| Push Notifications (exit alerts) | 🔴 High | v0.3.0 |
| Leaflet Map View (commander) | 🟡 Medium | v0.3.0 |
| PostgreSQL Migration | 🟡 Medium | v0.3.0 |
| Password Reset / First Login | 🟢 Low | v0.4.0 |
| Export PDF/Excel Reports | 🟢 Low | v0.4.0 |
| Admin Panel (user management) | 🟢 Low | v0.4.0 |
| Background Location (Capacitor) | 🟡 Medium | v0.5.0 |
| Offline Mode + Sync | 🟢 Low | v0.5.0 |
