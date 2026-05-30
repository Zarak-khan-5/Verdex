'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { BestRoute } from '@/types';

// Fix Leaflet default icon issue in bundlers
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface MobilityMapProps {
  route?: BestRoute | null;
  center?: [number, number];
}

const greenIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function MobilityMap({ route, center = [31.5204, 74.3587] }: MobilityMapProps) {
  const pathCoords = route?.path_coordinates?.map(
    (c: number[]) => [c[0], c[1]] as [number, number]
  ) || [];

  const startPoint = pathCoords.length > 0 ? pathCoords[0] : null;
  const endPoint = pathCoords.length > 1 ? pathCoords[pathCoords.length - 1] : null;

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <ChangeView center={center} />
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {pathCoords.length > 1 && (
          <Polyline
            positions={pathCoords}
            pathOptions={{
              color: '#10b981',
              weight: 4,
              opacity: 0.8,
              dashArray: '10, 6',
            }}
          />
        )}

        {startPoint && (
          <Marker position={startPoint}>
            <Popup>
              <strong>Origin</strong>
              <br />
              {startPoint[0].toFixed(4)}, {startPoint[1].toFixed(4)}
            </Popup>
          </Marker>
        )}

        {endPoint && (
          <Marker position={endPoint} icon={greenIcon}>
            <Popup>
              <strong>Destination</strong>
              <br />
              {route?.mode && <>Mode: {route.mode}<br /></>}
              {route?.total_time_mins && <>{route.total_time_mins} min<br /></>}
              {route?.co2_saved_kg && <>CO₂ saved: {route.co2_saved_kg} kg</>}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
