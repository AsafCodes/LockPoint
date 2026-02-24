'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — Tactical Map Component
// ─────────────────────────────────────────────────────────────
// Interactive Leaflet map with dark satellite tiles, soldier
// markers color-coded by status, and geofence zone overlays.
// Must be imported with next/dynamic({ ssr: false }).
// ─────────────────────────────────────────────────────────────

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon as LeafletPolygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Types ───────────────────────────────────────────────────

export interface MapSoldier {
    id: string;
    name: string;
    rank: string;
    status: 'in_base' | 'out_of_base' | 'unknown';
    lat: number | null;
    lng: number | null;
    lastUpdate?: string;
}

export interface MapZone {
    id: string;
    name: string;
    shapeType: string;
    centerLat: number | null;
    centerLng: number | null;
    radiusMeters: number | null;
    vertices?: string | null; // JSON-encoded [{lat,lng},...]
    isActive: boolean;
}

interface TacticalMapProps {
    soldiers: MapSoldier[];
    zones: MapZone[];
    height?: string;
    interactive?: boolean;
}

// ── Custom SVG Marker Icons ─────────────────────────────────

function createStatusIcon(status: 'in_base' | 'out_of_base' | 'unknown'): L.DivIcon {
    const colors: Record<string, { fill: string; pulse: string }> = {
        in_base: { fill: '#22c55e', pulse: 'rgba(34,197,94,0.4)' },
        out_of_base: { fill: '#f59e0b', pulse: 'rgba(245,158,11,0.4)' },
        unknown: { fill: '#64748b', pulse: 'rgba(100,116,139,0.3)' },
    };
    const c = colors[status] || colors.unknown;

    return L.divIcon({
        className: 'tactical-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -14],
        html: `
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="${c.pulse}" />
                <circle cx="12" cy="12" r="6" fill="${c.fill}" stroke="#0a0f1a" stroke-width="2" />
            </svg>
        `,
    });
}

// ── Auto-fit bounds helper ──────────────────────────────────

function FitBounds({ points }: { points: [number, number][] }) {
    const map = useMap();

    useEffect(() => {
        if (points.length === 0) return;

        if (points.length === 1) {
            map.setView(points[0], 14);
        } else {
            const bounds = L.latLngBounds(points.map(([lat, lng]) => [lat, lng]));
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
        }
    }, [map, points]);

    return null;
}

// ── Main Component ──────────────────────────────────────────

export function TacticalMap({ soldiers, zones, height = '320px', interactive = true }: TacticalMapProps) {
    // Compute all valid points for auto-fit
    const allPoints = useMemo(() => {
        const points: [number, number][] = [];

        soldiers.forEach((s) => {
            if (s.lat && s.lng) points.push([s.lat, s.lng]);
        });
        zones.forEach((z) => {
            if (z.vertices) {
                try {
                    const verts = typeof z.vertices === 'string' ? JSON.parse(z.vertices) : z.vertices;
                    verts.forEach((v: { lat: number; lng: number }) => points.push([v.lat, v.lng]));
                } catch { /* skip */ }
            } else if (z.centerLat && z.centerLng) {
                points.push([z.centerLat, z.centerLng]);
            }
        });

        // Default to Israel if no data
        if (points.length === 0) points.push([32.08, 34.78]);

        return points;
    }, [soldiers, zones]);

    const defaultCenter = allPoints[0] || [32.08, 34.78];

    // Memoize marker icons
    const icons = useMemo(() => ({
        in_base: createStatusIcon('in_base'),
        out_of_base: createStatusIcon('out_of_base'),
        unknown: createStatusIcon('unknown'),
    }), []);

    return (
        <div className="rounded-lg overflow-hidden border border-border-subtle" style={{ height }}>
            <MapContainer
                center={defaultCenter as [number, number]}
                zoom={14}
                scrollWheelZoom={interactive}
                dragging={interactive}
                zoomControl={interactive}
                attributionControl={false}
                style={{ height: '100%', width: '100%', background: '#0a0f1a' }}
            >
                {/* Dark tactical tiles (CartoDB Dark Matter) */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com">CARTO</a>'
                />

                {/* Auto-fit bounds to all data points */}
                <FitBounds points={allPoints} />

                {/* Geofence zone overlays — polygons + circles */}
                {zones.filter((z) => z.isActive).map((zone) => {
                    // Polygon zones
                    if (zone.vertices) {
                        try {
                            const verts = typeof zone.vertices === 'string' ? JSON.parse(zone.vertices) : zone.vertices;
                            if (Array.isArray(verts) && verts.length >= 3) {
                                return (
                                    <LeafletPolygon
                                        key={zone.id}
                                        positions={verts.map((v: { lat: number; lng: number }) => [v.lat, v.lng] as [number, number])}
                                        pathOptions={{
                                            color: '#22c55e',
                                            fillColor: '#22c55e',
                                            fillOpacity: 0.08,
                                            weight: 2,
                                            dashArray: '6 4',
                                        }}
                                    >
                                        <Popup>
                                            <div style={{ fontFamily: 'system-ui', direction: 'rtl', color: '#0a0f1a' }}>
                                                <strong>{zone.name}</strong>
                                                <br />
                                                <span style={{ fontSize: '11px', color: '#666' }}>
                                                    {verts.length} נקודות
                                                </span>
                                            </div>
                                        </Popup>
                                    </LeafletPolygon>
                                );
                            }
                        } catch { /* skip invalid */ }
                    }
                    // Circle zones (legacy)
                    if (zone.centerLat && zone.centerLng) {
                        return (
                            <Circle
                                key={zone.id}
                                center={[zone.centerLat!, zone.centerLng!]}
                                radius={zone.radiusMeters || 500}
                                pathOptions={{
                                    color: '#22c55e',
                                    fillColor: '#22c55e',
                                    fillOpacity: 0.06,
                                    weight: 1.5,
                                    dashArray: '6 4',
                                }}
                            >
                                <Popup>
                                    <div style={{ fontFamily: 'system-ui', direction: 'rtl', color: '#0a0f1a' }}>
                                        <strong>{zone.name}</strong>
                                        <br />
                                        <span style={{ fontSize: '11px', color: '#666' }}>
                                            רדיוס: {zone.radiusMeters}m
                                        </span>
                                    </div>
                                </Popup>
                            </Circle>
                        );
                    }
                    return null;
                })}

                {/* Soldier markers */}
                {soldiers.filter((s) => s.lat && s.lng).map((soldier) => (
                    <Marker
                        key={soldier.id}
                        position={[soldier.lat!, soldier.lng!]}
                        icon={icons[soldier.status] || icons.unknown}
                    >
                        <Popup>
                            <div style={{ fontFamily: 'system-ui', direction: 'rtl', color: '#0a0f1a', minWidth: '120px' }}>
                                <strong>{soldier.rank} {soldier.name}</strong>
                                <br />
                                <span style={{
                                    fontSize: '11px',
                                    color: soldier.status === 'in_base' ? '#16a34a' : soldier.status === 'out_of_base' ? '#d97706' : '#64748b',
                                    fontWeight: 600,
                                }}>
                                    {soldier.status === 'in_base' ? 'בבסיס' : soldier.status === 'out_of_base' ? 'מחוץ לבסיס' : 'לא ידוע'}
                                </span>
                                {soldier.lastUpdate && (
                                    <>
                                        <br />
                                        <span style={{ fontSize: '10px', color: '#999' }}>
                                            עדכון: {new Date(soldier.lastUpdate).toLocaleTimeString('he-IL')}
                                        </span>
                                    </>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Override Leaflet default styles */}
            <style jsx global>{`
                .leaflet-container {
                    z-index: 10 !important;
                }
                .tactical-marker {
                    background: none !important;
                    border: none !important;
                }
                .leaflet-popup-content-wrapper {
                    background: #f8fafc;
                    border-radius: 8px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
                }
                .leaflet-popup-tip {
                    background: #f8fafc;
                }
                .leaflet-control-zoom a {
                    background: #1a1f2e !important;
                    color: #94a3b8 !important;
                    border-color: #2a2f3e !important;
                }
                .leaflet-control-zoom a:hover {
                    background: #2a2f3e !important;
                    color: #e2e8f0 !important;
                }
            `}</style>
        </div>
    );
}
