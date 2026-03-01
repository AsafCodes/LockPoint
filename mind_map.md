# LockPoint — Feature Mind Map

> Living document tracking all features across versions.
> Updated: 2026-02-27 (v0.5.5)

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

## v0.5.4-Alpha — Geofence Sync, UI Unfreeze & UX Polish ✅

| Feature | Status | Files |
|---------|--------|-------|
| **Initial GPS Sync (Discrepancy Fix)** | ✅ Done | `src/app/api/events/sync/route.ts`, `useGeofenceMonitor.ts` |
| **Status Real-Time Cache Invalidation**| ✅ Done | `useGeofenceMonitor.ts`, `SoldierHome.tsx` |
| **Live UI Timestamp (Ping Heartbeat)** | ✅ Done | `SoldierHome.tsx`, `useGeofenceMonitor.ts` |
| **Noto Sans Replacement (Heebo)** | ✅ Done | `src/app/layout.tsx`, `src/styles/globals.css` |
| **Version Bump to v0.5.4** | ✅ Done | `package.json`, Git Push |

**Impact on existing features:**
- v0.2.0 **Soldier Home** — Visually ticks forward with the live GPS engine and syncs its state in real time.
- v0.1.0 **UI Design** — Browser console warnings eliminated and font rendering reliability improved.

---

## v0.5.5-Alpha — Display Scaling (Comfort View) ✅

| Feature | Status | Files |
|---------|--------|-------|
| **Global Scale Modifier** | ✅ Done | `src/styles/globals.css` |
| **Display State Context** | ✅ Done | `src/providers/DisplayProvider.tsx` |
| **Provider Integration** | ✅ Done | `src/app/layout.tsx` |
| **Display Toggle Switch** | ✅ Done | `src/shared/components/Sidebar.tsx` |
| **Version Bump to v0.5.5** | ✅ Done | `package.json` |

**Impact on existing features:**
- v0.1.0 **UI Design** — Mobile and desktop readability improved for all font-sizes, margins, paddings globally due to the `.ui-large` class. Users can toggle this preference.

---

## v0.5.6-Alpha — Capacitor Build Compatibility ✅

| Feature | Status | Files |
|---------|--------|-------|
| **Dual Build Mode Configuration** | ✅ Done | `next.config.ts` |
| **Dynamic Remote API Client** | ✅ Done | `src/lib/api/client.ts` |
| **AuthProvider Remote Fetch** | ✅ Done | `src/providers/AuthProvider.tsx` |

**Impact on existing features:**
- v0.1.0 **API Connectivity** — The frontend can now be bundled statically inside an APK while all `fetch()` calls correctly route external traffic to the Render server (`NEXT_PUBLIC_API_URL`). When run via Web/Docker, relative paths still work seamlessly.

---

## v0.5.7-Alpha — Global API CORS Security (Layer 1) ✅

| Feature | Status | Files |
|---------|--------|-------|
| **Global Edge Middleware** | ✅ Done | `src/middleware.ts` |
| **CORS Utility Helper** | ✅ Done | `src/lib/api/cors.ts` |

**Impact on existing features:**
- v0.1.0 **All API Routes** — Instead of modifying 13 individual route files, every `/api/*` endpoint is securely intercepted by Edge Middleware.
- **Strict Whitelisting** — Only requests originating from `capacitor://localhost`, `ionic://localhost`, or configured web domains are allowed.
- **Defense in Depth** — Established that CORS is merely Layer 1 edge-filtration; JWT Auth (Layer 2) remains deeply embedded within the routes.

## v0.5.8-Alpha — BOLA-001 Security Patch (Zone Ownership) ✅

| Feature | Status | Files |
|---------|--------|-------|
| **Zone Existence Validation** | ✅ Done | `src/app/api/zones/[id]/route.ts` |
| **Zone Scope Boundary Enforcement** | ✅ Done | `src/app/api/zones/[id]/route.ts` |
| **Automated BOLA Testing Script** | ✅ Done | `scripts/test-bola-001.ts` |
| **Postman Exploit Demo** | ✅ Done | `LockPoint_BOLA_Audit.postman_collection.json` |

**Impact on existing features:**
- v0.1.0 **Zones CRUD API** — Senior Commanders can no longer modify or delete zones that lie outside of their unit hierarchy. Implemented `verifyZoneScope` utility to protect ID references across PUT and DELETE operations.

---

## v0.5.9-Alpha — BOLA-002 Security Patch (Event Spoofing) ✅

| Feature | Status | Files |
|---------|--------|-------|
| **Event Ownership Validation** | ✅ Done | `src/app/api/reports/route.ts` |

**Impact on existing features:**
- v0.1.0 **Reports API** — Soldiers can no longer submit exit reports against another soldier's geofence event. The server aggressively checks `event.soldierId === user.userId` before taking action.

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
