'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — Zone Drawer (Interactive Polygon Drawing)
// ─────────────────────────────────────────────────────────────
// Full-screen overlay modal with:
// 1. Nominatim location search bar + coordinate search
// 2. Leaflet map with polygon drawing controls
// 3. Delete polygon, GPS start, live cursor coordinates
// 4. Save / Cancel buttons
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

// ── Search Bar (Nominatim + Coordinate Search) ──────────────

function LocationSearch() {
    const map = useMap();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Detect if input is coordinates (e.g., "32.08, 34.78" or "32.08 34.78")
    const parseCoordinates = (q: string): [number, number] | null => {
        const cleaned = q.trim().replace(/[,;]/g, ' ').replace(/\s+/g, ' ');
        const parts = cleaned.split(' ');
        if (parts.length === 2) {
            const lat = parseFloat(parts[0]);
            const lng = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                return [lat, lng];
            }
        }
        return null;
    };

    const handleSearch = useCallback(async (q: string) => {
        if (q.length < 2) {
            setResults([]);
            return;
        }

        // Check for coordinate input first
        const coords = parseCoordinates(q);
        if (coords) {
            setResults([{
                display_name: `📍 ${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`,
                lat: coords[0].toString(),
                lon: coords[1].toString(),
                isCoord: true,
            }]);
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
                    placeholder={'חפש מיקום או קואורדינטות (32.08, 34.78)'}
                    className="w-full px-4 py-2.5 pr-10 rounded-xl bg-[#1a2332]/95 backdrop-blur-md border border-[#2a3a4e] text-white text-sm focus:outline-none focus:ring-2 focus:ring-signal-green/50 focus:border-signal-green shadow-lg placeholder:text-[#7a8a9e]"
                    dir="rtl"
                />
                {/* Search icon */}
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a8a9e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>

                {/* Results dropdown */}
                {results.length > 0 && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-[#1a2332]/95 backdrop-blur-md border border-[#2a3a4e] rounded-xl shadow-2xl overflow-hidden">
                        {results.map((r: any, i: number) => (
                            <button
                                key={i}
                                onClick={() => flyTo(r.lat, r.lon, r.display_name)}
                                className="w-full text-right px-4 py-2.5 text-sm text-[#c0d0e0] hover:bg-[#2a3a4e]/60 hover:text-white transition-colors border-b border-[#2a3a4e]/30 last:border-b-0"
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

// ── User Location Center (GPS) ──────────────────────────────

function UserLocationCenter() {
    const map = useMap();

    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                map.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 1.5 });
            },
            () => {
                // Silently fail — stay at default Israel center
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    }, [map]);

    return null;
}

// ── Live Map Center Coordinates ─────────────────────────────

function MapCenterCoords({ onChange }: { onChange: (lat: number, lng: number) => void }) {
    const map = useMap();

    useEffect(() => {
        const updateCoords = () => {
            const center = map.getCenter();
            onChange(center.lat, center.lng);
        };
        map.on('move', updateCoords);
        updateCoords(); // Initial
        return () => { map.off('move', updateCoords); };
    }, [map, onChange]);

    return null;
}

// ── Main Component ──────────────────────────────────────────

export function ZoneDrawer({ initialVertices, initialName, onSave, onClose }: ZoneDrawerProps) {
    const [name, setName] = useState(initialName || '');
    const [vertices, setVertices] = useState<Vertex[]>(initialVertices || []);
    const [saving, setSaving] = useState(false);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 32.08, lng: 34.78 });
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

    // Handle polygon deleted via leaflet-draw
    const handleDeleted = () => {
        setVertices([]);
    };

    // Manual clear all drawings
    const handleClearAll = () => {
        if (featureGroupRef.current) {
            featureGroupRef.current.clearLayers();
        }
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

    const handleCenterUpdate = useCallback((lat: number, lng: number) => {
        setMapCenter({ lat, lng });
    }, []);

    const canSave = name.trim().length > 0 && vertices.length >= 3;

    const defaultCenter: [number, number] = isEdit
        ? [computeCentroid(initialVertices!).lat, computeCentroid(initialVertices!).lng]
        : [32.08, 34.78]; // Israel default — GPS will override in create mode

    return (
        <div className="fixed inset-0 z-50 bg-[#0d1117] flex flex-col">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#161b22]/95 backdrop-blur-md border-b border-[#30363d] safe-top z-[1001]">
                <div className="flex items-center gap-3 flex-1">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[#21262d] transition-colors"
                    >
                        <svg className="w-5 h-5 text-[#8b949e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.geofenceMgmt.name || 'שם האזור...'}
                        className="flex-1 px-3 py-2 rounded-lg bg-[#21262d] border border-[#30363d] text-white text-sm focus:outline-none focus:ring-2 focus:ring-signal-green/50 focus:border-signal-green"
                        dir="rtl"
                    />
                </div>
                <div className="flex items-center gap-2 ms-3">
                    {/* Delete / Clear button */}
                    {vertices.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="px-3 py-2 rounded-lg bg-danger-red/15 border border-danger-red/30 text-danger-red text-xs font-medium hover:bg-danger-red/25 transition-all"
                            title="מחק ציור"
                        >
                            🗑️ מחק
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={!canSave || saving}
                        className={cn(
                            'px-5 py-2 rounded-lg font-bold text-sm transition-all active:scale-[0.98]',
                            canSave
                                ? 'bg-signal-green text-midnight hover:bg-signal-green/90'
                                : 'bg-[#21262d] text-[#484f58] cursor-not-allowed'
                        )}
                    >
                        {saving ? (t.geofenceMgmt.saving || 'שומר...') : (t.geofenceMgmt.save || 'שמור')}
                    </button>
                </div>
            </div>

            {/* Instruction Banner */}
            {vertices.length < 3 && (
                <div className="px-4 py-2 bg-[#1a3a5c]/60 border-b border-[#1a5fb4]/30 text-center z-[1001]">
                    <p className="text-xs text-[#58a6ff] font-medium" dir="rtl">
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
                    style={{ height: '100%', width: '100%', background: '#0d1117' }}
                >
                    {/* Brighter tiles for zone drawing — CartoDB Voyager */}
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com">CARTO</a>'
                    />

                    {/* Location Search */}
                    <LocationSearch />

                    {/* GPS: fly to user location in create mode */}
                    {!isEdit && <UserLocationCenter />}

                    {/* Fit to existing polygon on edit */}
                    {isEdit && <FitToPolygon vertices={initialVertices!} />}

                    {/* Live center coordinates */}
                    <MapCenterCoords onChange={handleCenterUpdate} />

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
                            edit={{
                                remove: true,
                            }}
                        />
                    </FeatureGroup>
                </MapContainer>
            </div>

            {/* Bottom Status Bar — live coordinates */}
            <div className="px-4 py-2.5 bg-[#161b22]/95 backdrop-blur-md border-t border-[#30363d] safe-bottom flex items-center justify-between z-[1001]">
                <span className="text-xs text-[#8b949e]" dir="rtl">
                    {vertices.length >= 3
                        ? `${vertices.length} נקודות — אזור מוגדר ✓`
                        : `צייר מצולע עם לפחות 3 נקודות`}
                </span>
                <span className="text-xs text-[#58a6ff] font-medium data-mono">
                    {mapCenter.lat.toFixed(5)}, {mapCenter.lng.toFixed(5)}
                </span>
            </div>

            {/* Override Leaflet Draw styles for the light map context */}
            <style jsx global>{`
                .leaflet-container { z-index: 10 !important; }
                .leaflet-draw-toolbar a {
                    background-color: #ffffff !important;
                    border-color: #d0d7de !important;
                    color: #24292f !important;
                }
                .leaflet-draw-toolbar a:hover {
                    background-color: #f3f4f6 !important;
                    color: #1a1f2e !important;
                }
                .leaflet-draw-actions a {
                    background-color: #ffffff !important;
                    border-color: #d0d7de !important;
                    color: #24292f !important;
                    font-size: 12px !important;
                }
                .leaflet-draw-actions a:hover {
                    background-color: #22c55e !important;
                    color: #ffffff !important;
                }
                .leaflet-draw-tooltip {
                    background-color: #ffffff !important;
                    border-color: #d0d7de !important;
                    color: #24292f !important;
                    font-size: 12px !important;
                }
                .leaflet-draw-tooltip-subtext {
                    color: #57606a !important;
                }
                .leaflet-control-zoom a {
                    background: #ffffff !important;
                    color: #24292f !important;
                    border-color: #d0d7de !important;
                }
                .leaflet-control-zoom a:hover {
                    background: #f3f4f6 !important;
                    color: #1a1f2e !important;
                }
                .leaflet-popup-content-wrapper {
                    background: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
                }
                .leaflet-popup-tip {
                    background: #ffffff;
                }
            `}</style>
        </div>
    );
}
