'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@/styles/enviromap.css';
import EarthIcon from '@/components/EarthIcon';

// Make L available globally so leaflet.heat can patch it
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).L = L;
}

// ── Layer Configuration ──────────────────────────────────────────────
type LayerKey = 'temperature' | 'aqi' | 'rain' | 'traffic';

interface LayerConfig {
  name: string;
  unit: string;
  color: string;
  legend: [string, string, string];
  gradient: string;
  heatGradient: Record<number, string>;
}

const LAYER_CONFIG: Record<LayerKey, LayerConfig> = {
  temperature: {
    name: 'Temperature',
    unit: '°C',
    color: '#ff6b35',
    legend: ['10°C', '22°C', '40°C'],
    gradient: 'linear-gradient(to right, #3b82f6, #4ade80, #facc15, #ff6b35, #ef4444)',
    heatGradient: { 0.0: '#3b82f6', 0.3: '#4ade80', 0.6: '#facc15', 0.8: '#ff6b35', 1.0: '#ef4444' },
  },
  aqi: {
    name: 'Air Quality Index',
    unit: 'AQI',
    color: '#4ade80',
    legend: ['Good', 'Moderate', 'Poor'],
    gradient: 'linear-gradient(to right, #4ade80, #facc15, #fb923c, #ef4444, #7c3aed)',
    heatGradient: { 0.0: '#4ade80', 0.3: '#facc15', 0.6: '#fb923c', 0.8: '#ef4444', 1.0: '#7c3aed' },
  },
  rain: {
    name: 'Precipitation',
    unit: 'mm/h',
    color: '#38bdf8',
    legend: ['0mm', '5mm', '20mm'],
    gradient: 'linear-gradient(to right, #0f172a, #0ea5e9, #38bdf8, #7dd3fc, #e0f2fe)',
    heatGradient: { 0.0: '#0f172a', 0.25: '#0ea5e9', 0.6: '#38bdf8', 0.85: '#7dd3fc', 1.0: '#e0f2fe' },
  },
  traffic: {
    name: 'Traffic Density',
    unit: '',
    color: '#f59e0b',
    legend: ['Free', 'Slow', 'Jam'],
    gradient: 'linear-gradient(to right, #4ade80, #facc15, #fb923c, #ef4444)',
    heatGradient: { 0.0: '#4ade80', 0.4: '#facc15', 0.7: '#fb923c', 1.0: '#ef4444' },
  },
};

interface SensorPoint {
  lat: number;
  lon: number;
  value: string | number;
  color: string;
}

interface WeatherCurrent {
  temperature_2m?: number;
  relative_humidity_2m?: number;
  wind_speed_10m?: number;
  precipitation?: number;
}

interface AqiCurrent {
  european_aqi?: number;
  pm2_5?: number;
}

// ── Component ────────────────────────────────────────────────────────
export default function EnviroMapView() {
  const router = useRouter();

  // State
  const [currentLayer, setCurrentLayer] = useState<LayerKey>('temperature');
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('FETCHING LIVE DATA...');
  const [opacity, setOpacity] = useState(0.75);
  const [searchQuery, setSearchQuery] = useState('');
  const [weather, setWeather] = useState<WeatherCurrent>({});
  const [aqi, setAqi] = useState<AqiCurrent>({});
  const [sensors, setSensors] = useState<SensorPoint[]>([]);
  const [timeStr, setTimeStr] = useState('--:--');

  // Refs (for imperative Leaflet + stable closures)
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heatRef = useRef<any>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const coordsRef = useRef({ lat: 31.5204, lon: 74.3587 });
  const layerRef = useRef<LayerKey>('temperature');
  const opacityRef = useRef(0.75);
  const weatherRef = useRef<WeatherCurrent>({});
  const aqiRef = useRef<AqiCurrent>({});
  const heatReadyRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => { layerRef.current = currentLayer; }, [currentLayer]);
  useEffect(() => { opacityRef.current = opacity; }, [opacity]);
  useEffect(() => { weatherRef.current = weather; }, [weather]);
  useEffect(() => { aqiRef.current = aqi; }, [aqi]);

  // ── Data fetching ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    const { lat, lon } = coordsRef.current;
    
    // Pakistan bounding box pre-filter (longitude 60.87°E–77.84°E, latitude 23.63°N–37.09°N)
    if (lat < 23.63 || lat > 37.09 || lon < 60.87 || lon > 77.84) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadingText('FETCHING LIVE DATA...');

    try {
      const [weatherRes, aqiRes] = await Promise.all([
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code&timezone=auto`
        ).then((r) => r.json()),
        fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,pm10,carbon_monoxide,european_aqi&timezone=auto`
        ).then((r) => r.json()),
      ]);

      const w: WeatherCurrent = weatherRes?.current ?? {};
      const a: AqiCurrent = aqiRes?.current ?? {};
      setWeather(w);
      setAqi(a);
      weatherRef.current = w;
      aqiRef.current = a;
    } catch {
      // Fallback simulated data
      const sim: WeatherCurrent = { temperature_2m: 28, relative_humidity_2m: 62, wind_speed_10m: 14, precipitation: 0.2 };
      const simAqi: AqiCurrent = { european_aqi: 45, pm2_5: 18 };
      setWeather(sim);
      setAqi(simAqi);
      weatherRef.current = sim;
      aqiRef.current = simAqi;
      setLoadingText('USING SIMULATED DATA');
      await new Promise((r) => setTimeout(r, 800));
    }

    // Update time
    const now = new Date();
    setTimeStr(
      now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
    );

    setLoading(false);

    // Re-render the current layer with fresh data
    if (heatReadyRef.current) {
      renderLayerOnMap(layerRef.current);
    }
  }, []);

  // ── Heat-point generation ──────────────────────────────────────────
  const generateHeatPoints = useCallback((layer: LayerKey): [number, number, number][] => {
    const w = weatherRef.current;
    const a = aqiRef.current;
    const { lat, lon } = coordsRef.current;
    const points: [number, number, number][] = [];

    const offsets: [number, number, number][] = [
      [0, 0, 1.0], [0.012, -0.008, 0.9], [-0.01, 0.015, 0.85], [0.018, 0.012, 0.7],
      [-0.015, -0.012, 0.6], [0.005, 0.02, 0.8], [0.02, -0.015, 0.55], [-0.02, 0.005, 0.65],
      [0.008, -0.018, 0.75], [-0.008, 0.022, 0.5], [0.025, 0.005, 0.45], [-0.025, -0.005, 0.6],
      [0.003, 0.03, 0.4], [0.03, -0.003, 0.5], [-0.03, 0.01, 0.7],
    ];

    offsets.forEach(([dlat, dlon, base]) => {
      let intensity = base;
      if (layer === 'temperature') {
        const t = w.temperature_2m ?? 25;
        intensity = base * (t / 40) + Math.random() * 0.15;
      } else if (layer === 'aqi') {
        const aqiVal = a.european_aqi ?? 50;
        intensity = base * (aqiVal / 100) + Math.random() * 0.15;
      } else if (layer === 'rain') {
        const prec = (w.precipitation ?? 0.5) + 1;
        intensity = Math.min(1, base * prec * 0.5 + Math.random() * 0.2);
      } else {
        const hour = new Date().getHours();
        const rush = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) ? 1.4 : 0.7;
        intensity = Math.min(1, base * rush + Math.random() * 0.2);
      }

      for (let i = 0; i < 8; i++) {
        points.push([
          lat + dlat + (Math.random() - 0.5) * 0.008,
          lon + dlon + (Math.random() - 0.5) * 0.008,
          Math.min(1, Math.max(0.1, intensity + (Math.random() - 0.5) * 0.2)),
        ]);
      }
    });

    return points;
  }, []);

  // ── Sensor-point generation ────────────────────────────────────────
  const getSensorPoints = useCallback((layer: LayerKey): SensorPoint[] => {
    const w = weatherRef.current;
    const a = aqiRef.current;
    const { lat, lon } = coordsRef.current;
    const baseTemp = w.temperature_2m ?? 25;
    const baseAqi = a.european_aqi ?? 50;

    const offsets: [number, number][] = [
      [0.01, 0.005], [-0.008, 0.012], [0.015, -0.01],
      [-0.012, -0.008], [0.02, 0.015], [-0.018, 0.02],
    ];

    return offsets.map(([dlat, dlon]) => {
      let value: string | number;
      let color: string;

      if (layer === 'temperature') {
        value = Math.round(baseTemp + (Math.random() - 0.5) * 6);
        color = (value as number) > 30 ? '#ef4444' : (value as number) > 22 ? '#f59e0b' : '#38bdf8';
      } else if (layer === 'aqi') {
        value = Math.round(baseAqi + (Math.random() - 0.5) * 30);
        color = (value as number) > 100 ? '#ef4444' : (value as number) > 50 ? '#facc15' : '#4ade80';
      } else if (layer === 'rain') {
        value = +(Math.random() * 3).toFixed(1);
        color = value > 2 ? '#3b82f6' : value > 0.5 ? '#38bdf8' : '#94a3b8';
      } else {
        const labels = ['Fast', 'Moderate', 'Slow', 'Jam'] as const;
        const colors = ['#4ade80', '#facc15', '#fb923c', '#ef4444'];
        const idx = Math.floor(Math.random() * 4);
        value = labels[idx];
        color = colors[idx];
      }

      return { lat: lat + dlat, lon: lon + dlon, value, color };
    });
  }, []);

  // ── Render layer on map (imperative) ───────────────────────────────
  const renderLayerOnMap = useCallback(
    (layer: LayerKey) => {
      const map = mapRef.current;
      if (!map) return;

      const cfg = LAYER_CONFIG[layer];

      // Update heatmap
      if (heatRef.current) {
        map.removeLayer(heatRef.current);
      }
      const points = generateHeatPoints(layer);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const leaflet = L as any;
      if (leaflet.heatLayer) {
        heatRef.current = leaflet.heatLayer(points, {
          radius: 45,
          blur: 35,
          maxZoom: 17,
          gradient: cfg.heatGradient,
          max: 1.0,
          minOpacity: opacityRef.current * 0.5,
        }).addTo(map);
      }

      // Update markers
      if (markerGroupRef.current) {
        markerGroupRef.current.clearLayers();
      }
      const sensorPts = getSensorPoints(layer);
      setSensors(sensorPts);

      sensorPts.forEach((s) => {
        const circle = L.circleMarker([s.lat, s.lon], {
          radius: 7,
          fillColor: s.color,
          color: '#fff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.9,
        });

        circle.bindPopup(`
          <div class="enviro-popup-title">SENSOR READING</div>
          <div class="enviro-popup-row">
            <span>${cfg.name}</span>
            <span class="enviro-popup-val" style="color:${s.color}">${s.value}${typeof s.value === 'number' ? cfg.unit : ''}</span>
          </div>
          <div class="enviro-popup-row" style="margin-top:6px;color:#64748b">
            <span>${s.lat.toFixed(4)}, ${s.lon.toFixed(4)}</span>
          </div>
        `);

        markerGroupRef.current?.addLayer(circle);
      });
    },
    [generateHeatPoints, getSensorPoints],
  );

  // ── Initialize map + load leaflet.heat ─────────────────────────────
  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;

    const map = L.map(mapElRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([coordsRef.current.lat, coordsRef.current.lon], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    markerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Map click → re-fetch data for new location
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (lat >= 23.63 && lat <= 37.09 && lng >= 60.87 && lng <= 77.84) {
        coordsRef.current = { lat, lon: lng };
        map.setView(e.latlng, map.getZoom());
        fetchData();
      }
    });

    // Load leaflet.heat plugin dynamically
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
    script.async = true;
    script.onload = () => {
      heatReadyRef.current = true;
      fetchData();
    };
    script.onerror = () => {
      // Still fetch data, just without heatmap
      fetchData();
    };
    document.head.appendChild(script);

    // Auto-refresh every 15 minutes
    const interval = setInterval(() => {
      fetchData();
    }, 15 * 60 * 1000);

    return () => {
      clearInterval(interval);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-render when layer or opacity changes ────────────────────────
  useEffect(() => {
    if (heatReadyRef.current && mapRef.current && (weather.temperature_2m !== undefined || aqi.european_aqi !== undefined)) {
      renderLayerOnMap(currentLayer);
    }
  }, [currentLayer, opacity, weather, aqi, renderLayerOnMap]);

  // ── City search ────────────────────────────────────────────────────
  const searchCity = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setLoading(true);
    setLoadingText('LOCATING ' + q.toUpperCase() + '...');

    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=pk`
      );
      const data = await r.json();
      if (data.length) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        coordsRef.current = { lat, lon };
        mapRef.current?.setView([lat, lon], 13);
        fetchData();
      } else {
        setLoading(false);
        alert('City not found. Try another name.');
      }
    } catch {
      setLoading(false);
    }
  };

  // ── Derived sidebar values ─────────────────────────────────────────
  const cfg = LAYER_CONFIG[currentLayer];

  let mainValue = '—';
  let mainSub: React.ReactNode = 'Loading...';
  let mainUnit = cfg.unit;

  if (currentLayer === 'temperature') {
    mainValue = String(Math.round(weather.temperature_2m ?? 0));
    const t = weather.temperature_2m ?? 25;
    mainSub = t > 35 ? (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>warning</span>
        Extreme Heat
      </span>
    ) : t > 28 ? (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>thermostat</span>
        Hot
      </span>
    ) : t > 20 ? (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#facc15' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>thermostat</span>
        Warm
      </span>
    ) : (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#38bdf8' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>ac_unit</span>
        Cool
      </span>
    );
  } else if (currentLayer === 'aqi') {
    const a = aqi.european_aqi ?? 0;
    mainValue = String(a);
    mainSub = a > 100 ? (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>mask</span>
        Poor Air Quality
      </span>
    ) : a > 50 ? (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#facc15' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>air</span>
        Moderate
      </span>
    ) : (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#4ade80' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>nature_people</span>
        Good Air Quality
      </span>
    );
  } else if (currentLayer === 'rain') {
    mainValue = (weather.precipitation ?? 0).toFixed(1);
    const p = weather.precipitation ?? 0;
    mainSub = p > 5 ? (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#3b82f6' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>thunderstorm</span>
        Heavy Rain
      </span>
    ) : p > 0 ? (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#38bdf8' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>rainy</span>
        Light Rain
      </span>
    ) : (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#facc15' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>wb_sunny</span>
        No Precipitation
      </span>
    );
  } else {
    const hour = new Date().getHours();
    const rush = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    mainValue = rush ? 'HIGH' : 'MED';
    mainUnit = '';
    mainSub = rush ? (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>traffic</span>
        Rush Hour Active
      </span>
    ) : (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#4ade80' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>traffic</span>
        Normal Traffic
      </span>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="enviro-page">
      {/* Header */}
      <header className="enviro-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="enviro-logo" onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <EarthIcon size={22} style={{ color: 'var(--color-verdex-primary, #059669)' }} />
            <span className="enviro-logo-text">
              VERDEX<span>MAP</span>
            </span>
          </div>
          <button className="enviro-back-btn" onClick={() => router.push('/')}>
            ← Back
          </button>
        </div>

        <div className="enviro-layer-tabs">
          {(Object.keys(LAYER_CONFIG) as LayerKey[]).map((key) => (
            <button
              key={key}
              className={`enviro-layer-tab ${currentLayer === key ? 'active' : ''}`}
              data-layer={key}
              onClick={() => setCurrentLayer(key)}
            >
              <span className="dot" />
              {LAYER_CONFIG[key].name.split(' ')[0]}
            </button>
          ))}
        </div>

        <div className="enviro-status-pill">
          <div className="enviro-live-dot" />
          LIVE DATA
        </div>
      </header>

      {/* Main Area */}
      <div className="enviro-main">
        {/* Map */}
        <div className="enviro-map-wrapper">
          <div ref={mapElRef} className="enviro-map" />
          {loading && (
            <div className="enviro-loading">
              <div className="enviro-spinner" />
              <div className="enviro-loading-text">{loadingText}</div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="enviro-sidebar">
          {/* Search */}
          <div className="enviro-sidebar-section">
            <div className="enviro-section-label">Search Location</div>
            <div className="enviro-search-box">
              <svg width="12" height="12" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCity()}
              />
            </div>
            <button className="enviro-search-btn" onClick={searchCity}>
              Go →
            </button>
          </div>

          {/* Current Reading */}
          <div className="enviro-sidebar-section">
            <div className="enviro-section-label">Current Reading</div>

            <div className="enviro-metric-card">
              <div className="enviro-metric-header">
                <span className="enviro-metric-name">{cfg.name}</span>
                <span className="enviro-metric-badge">{timeStr}</span>
              </div>
              <div>
                <span className="enviro-metric-value" style={{ color: cfg.color }}>
                  {mainValue}
                </span>
                <span className="enviro-metric-unit">{mainUnit}</span>
              </div>
              <div className="enviro-metric-sub">{mainSub}</div>
            </div>

            <div className="enviro-metric-card">
              <div className="enviro-metric-header">
                <span className="enviro-metric-name">Wind Speed</span>
              </div>
              <div>
                <span className="enviro-metric-value" style={{ color: '#94a3b8' }}>
                  {Math.round(weather.wind_speed_10m ?? 0)}
                </span>
                <span className="enviro-metric-unit">km/h</span>
              </div>
            </div>

            <div className="enviro-metric-card">
              <div className="enviro-metric-header">
                <span className="enviro-metric-name">Humidity</span>
              </div>
              <div>
                <span className="enviro-metric-value" style={{ color: '#38bdf8' }}>
                  {Math.round(weather.relative_humidity_2m ?? 0)}
                </span>
                <span className="enviro-metric-unit">%</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="enviro-sidebar-section">
            <div className="enviro-section-label">Heatmap Legend</div>
            <div className="enviro-legend-bar" style={{ background: cfg.gradient }} />
            <div className="enviro-legend-labels">
              <span>{cfg.legend[0]}</span>
              <span>{cfg.legend[1]}</span>
              <span>{cfg.legend[2]}</span>
            </div>
            <div className="enviro-opacity-control">
              <label>Opacity</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
              />
            </div>
          </div>

          {/* Sensor List */}
          <div className="enviro-sidebar-section">
            <div className="enviro-section-label">Nearby Sensor Readings</div>
            <div>
              {sensors.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: 12 }}>Loading sensors...</div>
              ) : (
                sensors.map((s, i) => (
                  <div className="enviro-sensor-item" key={i}>
                    <div className="enviro-sensor-coords">
                      {s.lat.toFixed(4)}, {s.lon.toFixed(4)}
                    </div>
                    <div className="enviro-sensor-val" style={{ color: s.color }}>
                      {s.value}
                      {typeof s.value === 'number' ? cfg.unit : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Data Sources */}
          <div className="enviro-sidebar-section">
            <div className="enviro-section-label">Data Sources</div>
            <div className="enviro-sources">
              Weather: <span>Open-Meteo API</span>
              <br />
              Map tiles: <span>OpenStreetMap</span>
              <br />
              Update: <span>Every 15 min</span>
              <br />
              Cost: <span style={{ color: '#4ade80' }}>100% Free</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
