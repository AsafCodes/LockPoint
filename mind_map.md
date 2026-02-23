# LockPoint — Feature Mind Map

> Living document tracking all features across versions.
> Updated: 2026-02-23 (v0.4.0)

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

## v0.3.0-Alpha — Live Tactical Map ✅

| Feature | Status | Files |
|---------|--------|-------|
| **TacticalMap (Leaflet Dark)** | ✅ Done | `src/features/map/components/TacticalMap.tsx` |
| **SSR-safe Dynamic Loader** | ✅ Done | `src/features/map/components/DynamicTacticalMap.tsx` |
| **Commander Map Integration** | ✅ Done | `src/features/dashboard/components/CommanderDashboard.tsx` |
| **Geofence Mgmt Map** | ✅ Done | `src/features/dashboard/components/GlobalOverview.tsx` |
| **Commander API — zones** | ✅ Done | `src/app/api/dashboard/commander/route.ts` |
| **Version Bump to v0.3.x** | ✅ Done | `package.json` |

---

## v0.4.0-Alpha — PostgreSQL, Smart Notifications & BI Data Layer ✅

| Feature | Status | Files |
|---------|--------|-------|
| **PostgreSQL Migration** | ✅ Done | `prisma/schema.prisma`, `.env`, `.env.example` |
| **Docker Entrypoint (migrate deploy)** | ✅ Done | `docker-entrypoint.sh` |
| **Notification Model** | ✅ Done | `prisma/schema.prisma` |
| **Notifications API (GET/PATCH)** | ✅ Done | `src/app/api/notifications/route.ts` |
| **Cron Alert Checker (Rules B+C)** | ✅ Done | `src/app/api/cron/check-alerts/route.ts` |
| **StatusSnapshot Model (BI)** | ✅ Done | `prisma/schema.prisma` |
| **DailyUnitSummary Model (BI)** | ✅ Done | `prisma/schema.prisma` |
| **NotificationBell UI** | ✅ Done | `src/shared/components/NotificationBell.tsx` |
| **Alert Thresholds Config** | ✅ Done | `src/lib/constants.ts` |
| **Version Bump to v0.4.0** | ✅ Done | `package.json` |

---

## Backlog — Future Versions

| Feature | Priority | Version |
|---------|----------|---------|
| Daily Summary Cron (nightly aggregation) | 🟡 Medium | v0.4.1 |
| Password Reset / First Login | 🟢 Low | v0.5.0 |
| Export PDF/Excel Reports | 🟢 Low | v0.5.0 |
| Admin Panel (user management) | 🟢 Low | v0.5.0 |
| Background Location (Capacitor) | 🟡 Medium | v0.6.0 |
| Offline Mode + Sync | 🟢 Low | v0.6.0 |
