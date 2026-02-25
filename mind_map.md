# LockPoint — Feature Mind Map

> Living document tracking all features across versions.
> Updated: 2026-02-25 (v0.5.0)

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
| **Seed Idempotency (upsert)** | ✅ Done | `prisma/seed.ts` |
| **Version Bump to v0.4.0** | ✅ Done | `package.json` |

---

## v0.4.1-Alpha — Map-Based Polygon Zone Creation ✅

| Feature | Status | Files |
|---------|--------|-------|
| **ZoneDrawer (Leaflet + Draw)** | ✅ Done | `src/features/map/components/ZoneDrawer.tsx` |
| **SSR-safe ZoneDrawer Loader** | ✅ Done | `src/features/map/components/DynamicZoneDrawer.tsx` |
| **Location Search (Nominatim)** | ✅ Done | `ZoneDrawer.tsx` (LocationSearch component) |
| **Polygon Drawing Controls** | ✅ Done | `ZoneDrawer.tsx` (leaflet-draw integration) |
| **TacticalMap Polygon Rendering** | ✅ Done | `src/features/map/components/TacticalMap.tsx` |
| **GlobalOverview — Drawer Integration** | ✅ Done | `src/features/dashboard/components/GlobalOverview.tsx` |
| **Zones API — vertices in PUT** | ✅ Done | `src/app/api/zones/[id]/route.ts` |
| **Version Bump to v0.4.1** | ✅ Done | `package.json` |

---

## v0.4.2-Alpha — Bug Fix & Map Refinements ✅

| Feature | Status | Files |
|---------|--------|-------|
| **🐛 Fix כשירות יחידה (Unit Readiness)** | ✅ Fixed | `GlobalOverview.tsx` — show all units with soldiers, NaN guard |
| **Zoom-Adaptive Zone Dot Markers** | ✅ Done | `TacticalMap.tsx` — CircleMarker dots at low zoom |
| **Brighter Tiles in ZoneDrawer** | ✅ Done | `ZoneDrawer.tsx` — CartoDB Voyager (light) tiles |
| **Delete Polygon Button** | ✅ Done | `ZoneDrawer.tsx` — 🗑️ clear button + leaflet-draw trash |
| **GPS Auto-Center (Create Mode)** | ✅ Done | `ZoneDrawer.tsx` — navigator.geolocation fly-to |
| **Coordinate Search** | ✅ Done | `ZoneDrawer.tsx` — detect `lat, lng` in search bar |
| **Live Map Center Coordinates** | ✅ Done | `ZoneDrawer.tsx` — bottom bar shows current center |
| **Version Bump to v0.4.2** | ✅ Done | `package.json` |

**Impact on existing features:**
- v0.1.0 **Senior Dashboard** — unit readiness table now shows all units with soldiers
- v0.3.0 **TacticalMap** — zones visible as dots when zoomed out
- v0.4.1 **ZoneDrawer** — major UX improvements across 5 areas

---

## v0.4.3-Alpha — SC-001 Dashboard Bug Fixes ✅

| Feature | Status | Files |
|---------|--------|-------|
| **🐛 Fix OrgTree Infinite Duplication** | ✅ Fixed | `senior/route.ts`, `commander/route.ts` — `buildUnitTree` + `flatUnits` |
| **🐛 Fix Tab Highlighting** | ✅ Fixed | `Sidebar.tsx`, `AppShell.tsx` — `useSearchParams()` replaces `window.location.search` |
| **🐛 Fix ZoneDrawer Not Closing** | ✅ Fixed | `GlobalOverview.tsx` — `setShowDrawer(false)` after save |
| **Seed Script — Clean Slate** | ✅ Done | `prisma/seed.ts` — `deleteMany` in FK-safe order prevents duplicates |
| **Suspense Wrappers (SSR)** | ✅ Done | `commander/page.tsx`, `senior/page.tsx`, `soldier/page.tsx` |
| **TypeScript Interfaces** | ✅ Done | `hooks.ts` — added `flatUnits: OrgNode[]` to response types |

**Impact on existing features:**
- v0.1.0 **OrgTree** — shows clean nested hierarchy, no duplicates
- v0.1.0 **Unit Readiness Table** — uses flat list, unaffected by tree nesting
- v0.4.0 **Seed Script** — now idempotent via clean-slate delete + upsert
- v0.3.0 **Navigation** — tab highlighting works correctly on client-side navigation

---

## v0.5.0-Alpha — Server-Side Point-in-Polygon Geofence Check ✅

| Feature | Status | Files |
|---------|--------|-------|
| **Shared Geo Calculator (server-safe)** | ✅ Done | `src/lib/geo/geofence-calc.ts` — `isInsideZone`, `isPointInPolygon`, `haversineDistance` |
| **Cron Rule D: Spatial Re-evaluation** | ✅ Done | `check-alerts/route.ts` — auto-corrects stale statuses using polygon/circle checks |
| **Client Calculator DRY Refactor** | ✅ Done | `calculator.ts` — re-exports from shared module |
| **Version Bump to v0.5.0** | ✅ Done | `package.json` |

**Impact on existing features:**
- v0.4.0 **Cron Alert Checker** — now spatially verifies soldier positions (Rule D)
- v0.2.0 **Client Geofence Engine** — math functions shared with server, no duplication
- v0.1.0 **Soldier Status** — auto-corrected when position disagrees with stale status

---

## Backlog — Future Versions

| Feature | Priority | Version |
|---------|----------|---------|
| Daily Summary Cron (nightly aggregation) | 🟡 Medium | v0.5.1 |
| Password Reset / First Login | 🟢 Low | v0.5.1 |
| Export PDF/Excel Reports | 🟢 Low | v0.5.1 |
| Admin Panel (user management) | 🟢 Low | v0.5.1 |
| Background Location (Capacitor) | 🟡 Medium | v0.6.0 |
| Offline Mode + Sync | 🟢 Low | v0.6.0 |
