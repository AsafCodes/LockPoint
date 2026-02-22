# LOCKPOINT

> Automated military attendance system with geofence-based tracking and hierarchical command dashboards.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — use the demo buttons to log in as Soldier, Commander, or Senior Commander.

## Demo Credentials

| Role | Service Number |
|------|---------------|
| Soldier | `S-001` |
| Commander | `C-001` |
| Senior Commander | `SC-001` |

## Stack

- **Next.js 14+** (App Router)
- **TypeScript** (strict)
- **Tailwind CSS** (tactical design system)
- **TanStack Query v5**
- **Capacitor.js 6** (native GPS bridge)
- **Leaflet** (geofence map editor)

## Project Structure

```
src/
├── app/             # Next.js routes (thin)
├── features/        # Feature modules (self-contained)
│   ├── auth/
│   ├── attendance/
│   ├── dashboard/
│   ├── geofence/
│   └── hierarchy/
├── shared/          # Reusable UI + utilities
├── lib/             # Infrastructure (API, constants)
├── providers/       # React context providers
├── styles/          # Tailwind + tactical design tokens
└── types/           # Global type re-exports
```
