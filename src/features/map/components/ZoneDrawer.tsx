'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — Zone Drawer (Interactive Polygon Drawing)
// ─────────────────────────────────────────────────────────────
// Full-screen overlay modal with:
// 1. Nominatim location search bar
// 2. Leaflet map with polygon drawing controls
// 3. Save / Cancel buttons
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Polygon, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { t } from '@/lib/i18n';
import { cn } from '@/shared/utils/cn';

// ── Types ───────────────────────────────────────────────────

export interface Vertex {
    lat: number;
    lng: number;
}

export interface ZoneDrawerProps {
    /** Existing vertices for edit mode (null = create mode) */
    initialVertices?: Vertex[] | null;
    /** Existing zone name (for edit mode) */
    initialName?: string;
    /** Called when zone is saved */
    onSave: (data: { name: string; vertices: Vertex[]; centerLat: number; centerLng: number }) => void;
    /** Called when modal is closed */
    onClose: () => void;
}

// ── Search Bar (Nominatim Geocoding) ────────────────────────

function LocationSearch() {
    const map = useMap();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = useCallback(async (q: string) => {
        if (q.length < 2) {
            setResults([]);
            return;
        }
        setSearching(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&accept-language=he`
            );
            const data = await res.json();
            setResults(data);
        } catch {
            setResults([]);
        } finally {
            setSearching(false);
        }
    }, []);

    const handleInputChange = (value: string) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => handleSearch(value), 400);
    };

    const flyTo = (lat: string, lon: string, displayName: string) => {
        map.flyTo([parseFloat(lat), parseFloat(lon)], 16, { duration: 1.2 });
        setQuery(displayName);
        setResults([]);
    };

    return (
        <div className="absolute top-3 left-3 right-3 z-[1000]" style={{ pointerEvents: 'auto' }}>
            <div className="relative max-w-md mx-auto">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={t.geofenceMgmt.searchLocation || 'חפש מיקום...'}
                    className="w-full px-4 py-2.5 pr-10 rounded-xl bg-onyx/95 backdrop-blur-md border border-border-subtle text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-signal-green/50 focus:border-signal-green shadow-lg"
                    dir="rtl"
                />
                {/* Search icon */}
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>

                {/* Results dropdown */}
                {results.length > 0 && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-onyx/95 backdrop-blur-md border border-border-subtle rounded-xl shadow-2xl overflow-hidden">
                        {results.map((r: any, i: number) => (
                            <button
                                key={i}
                                onClick={() => flyTo(r.lat, r.lon, r.display_name)}
                                className="w-full text-right px-4 py-2.5 text-sm text-text-secondary hover:bg-slate-dark/60 hover:text-text-primary transition-colors border-b border-border-subtle/30 last:border-b-0"
                                dir="rtl"
                            >
                                {r.display_name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Polygon Centroid Calculator ──────────────────────────────

function computeCentroid(vertices: Vertex[]): { lat: number; lng: number } {
    if (vertices.length === 0) return { lat: 32.08, lng: 34.78 };
    const lat = vertices.reduce((sum, v) => sum + v.lat, 0) / vertices.length;
    const lng = vertices.reduce((sum, v) => sum + v.lng, 0) / vertices.length;
    return { lat, lng };
}

// ── FitToPolygon helper ─────────────────────────────────────

function FitToPolygon({ vertices }: { vertices: Vertex[] }) {
    const map = useMap();

    useEffect(() => {
        if (vertices.length === 0) return;
        const bounds = L.latLngBounds(vertices.map(v => [v.lat, v.lng]));
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
    }, [map, vertices]);

    return null;
}

// ── Main Component ──────────────────────────────────────────

export function ZoneDrawer({ initialVertices, initialName, onSave, onClose }: ZoneDrawerProps) {
    const [name, setName] = useState(initialName || '');
    const [vertices, setVertices] = useState<Vertex[]>(initialVertices || []);
    const [saving, setSaving] = useState(false);
    const featureGroupRef = useRef<L.FeatureGroup>(null);
    const isEdit = !!initialVertices && initialVertices.length > 0;

    // Handle polygon created
    const handleCreated = (e: any) => {
        const layer = e.layer;
        if (layer instanceof L.Polygon) {
            const latlngs = layer.getLatLngs()[0] as L.LatLng[];
            const newVertices = latlngs.map((ll: L.LatLng) => ({ lat: ll.lat, lng: ll.lng }));
            setVertices(newVertices);
        }
    };

    // Handle polygon edited
    const handleEdited = (e: any) => {
        const layers = e.layers;
        layers.eachLayer((layer: any) => {
            if (layer instanceof L.Polygon) {
                const latlngs = layer.getLatLngs()[0] as L.LatLng[];
                const newVertices = latlngs.map((ll: L.LatLng) => ({ lat: ll.lat, lng: ll.lng }));
                setVertices(newVertices);
            }
        });
    };

    // Handle polygon deleted
    const handleDeleted = () => {
        setVertices([]);
    };

    // Save handler
    const handleSave = () => {
        if (!name.trim() || vertices.length < 3) return;
        setSaving(true);
        const centroid = computeCentroid(vertices);
        onSave({
            name: name.trim(),
            vertices,
            centerLat: centroid.lat,
            centerLng: centroid.lng,
        });
    };

    const canSave = name.trim().length > 0 && vertices.length >= 3;

    const defaultCenter: [number, number] = isEdit
        ? [computeCentroid(initialVertices!).lat, computeCentroid(initialVertices!).lng]
        : [32.08, 34.78]; // Israel default

    return (
        <div className="fixed inset-0 z-50 bg-midnight flex flex-col">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-onyx/90 backdrop-blur-md border-b border-border-subtle safe-top z-[1001]">
                <div className="flex items-center gap-3 flex-1">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-dark transition-colors"
                    >
                        <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.geofenceMgmt.name || 'שם האזור...'}
                        className="flex-1 px-3 py-2 rounded-lg bg-slate-dark border border-border-subtle text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-signal-green/50 focus:border-signal-green"
                        dir="rtl"
                    />
                </div>
                <button
                    onClick={handleSave}
                    disabled={!canSave || saving}
                    className={cn(
                        'ms-3 px-5 py-2 rounded-lg font-bold text-sm transition-all active:scale-[0.98]',
                        canSave
                            ? 'bg-signal-green text-midnight hover:bg-signal-green/90'
                            : 'bg-slate-dark text-text-muted cursor-not-allowed'
                    )}
                >
                    {saving ? (t.geofenceMgmt.saving || 'שומר...') : (t.geofenceMgmt.save || 'שמור')}
                </button>
            </div>

            {/* Instruction Banner */}
            {vertices.length < 3 && (
                <div className="px-4 py-2 bg-info-blue/10 border-b border-info-blue/20 text-center z-[1001]">
                    <p className="text-xs text-info-blue font-medium" dir="rtl">
                        {t.geofenceMgmt.drawInstruction || 'חפש מיקום ואז לחץ על כפתור המצולע בצד שמאל כדי לצייר את גבולות האזור'}
                    </p>
                </div>
            )}

            {/* Map */}
            <div className="flex-1 relative">
                <MapContainer
                    center={defaultCenter}
                    zoom={isEdit ? 15 : 12}
                    scrollWheelZoom={true}
                    dragging={true}
                    zoomControl={true}
                    attributionControl={false}
                    style={{ height: '100%', width: '100%', background: '#0a0f1a' }}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com">CARTO</a>'
                    />

                    {/* Location Search */}
                    <LocationSearch />

                    {/* Fit to existing polygon on edit */}
                    {isEdit && <FitToPolygon vertices={initialVertices!} />}

                    {/* Drawing Controls */}
                    <FeatureGroup ref={featureGroupRef}>
                        {/* Pre-render existing polygon for edit mode */}
                        {isEdit && (
                            <Polygon
                                positions={initialVertices!.map(v => [v.lat, v.lng] as [number, number])}
                                pathOptions={{
                                    color: '#22c55e',
                                    fillColor: '#22c55e',
                                    fillOpacity: 0.15,
                                    weight: 2,
                                }}
                            />
                        )}
                        <EditControl
                            position="topleft"
                            onCreated={handleCreated}
                            onEdited={handleEdited}
                            onDeleted={handleDeleted}
                            draw={{
                                rectangle: false,
                                circle: false,
                                circlemarker: false,
                                marker: false,
                                polyline: false,
                                polygon: {
                                    allowIntersection: false,
                                    showArea: true,
                                    shapeOptions: {
                                        color: '#22c55e',
                                        fillColor: '#22c55e',
                                        fillOpacity: 0.15,
                                        weight: 2,
                                    },
                                },
                            }}
                        />
                    </FeatureGroup>
                </MapContainer>
            </div>

            {/* Bottom Status Bar */}
            <div className="px-4 py-2.5 bg-onyx/90 backdrop-blur-md border-t border-border-subtle safe-bottom flex items-center justify-between z-[1001]">
                <span className="text-xs text-text-muted" dir="rtl">
                    {vertices.length >= 3
                        ? `${vertices.length} נקודות — אזור מוגדר ✓`
                        : `צייר מצולע עם לפחות 3 נקודות`}
                </span>
                {vertices.length >= 3 && (
                    <span className="text-xs text-signal-green font-medium data-mono">
                        {computeCentroid(vertices).lat.toFixed(4)}, {computeCentroid(vertices).lng.toFixed(4)}
                    </span>
                )}
            </div>

            {/* Override Leaflet Draw styles for dark theme */}
            <style jsx global>{`
                .leaflet-container { z-index: 10 !important; }
                .leaflet-draw-toolbar a {
                    background-color: #1a1f2e !important;
                    border-color: #2a2f3e !important;
                    color: #94a3b8 !important;
                }
                .leaflet-draw-toolbar a:hover {
                    background-color: #2a2f3e !important;
                    color: #e2e8f0 !important;
                }
                .leaflet-draw-actions a {
                    background-color: #1a1f2e !important;
                    border-color: #2a2f3e !important;
                    color: #94a3b8 !important;
                }
                .leaflet-draw-actions a:hover {
                    background-color: #22c55e !important;
                    color: #0a0f1a !important;
                }
                .leaflet-draw-tooltip {
                    background-color: #1a1f2e !important;
                    border-color: #2a2f3e !important;
                    color: #94a3b8 !important;
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
                .leaflet-popup-content-wrapper {
                    background: #f8fafc;
                    border-radius: 8px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
                }
                .leaflet-popup-tip {
                    background: #f8fafc;
                }
                /* Fix draw toolbar icon positioning */
                .leaflet-draw-toolbar .leaflet-draw-draw-polygon {
                    background-position: -31px -2px;
                }
            `}</style>
        </div>
    );
}
