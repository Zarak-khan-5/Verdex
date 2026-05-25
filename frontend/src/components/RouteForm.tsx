'use client';

import { useState } from 'react';
import type { Coordinates } from '@/types';

interface RouteFormProps {
  onSubmit: (origin: Coordinates, destination: Coordinates, maxWalk: number) => void;
  isLoading?: boolean;
}

export default function RouteForm({ onSubmit, isLoading = false }: RouteFormProps) {
  const [originLat, setOriginLat] = useState('31.5204');
  const [originLng, setOriginLng] = useState('74.3587');
  const [destLat, setDestLat] = useState('31.4504');
  const [destLng, setDestLng] = useState('74.2933');
  const [maxWalk, setMaxWalk] = useState('10');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      { lat: parseFloat(originLat), lng: parseFloat(originLng) },
      { lat: parseFloat(destLat), lng: parseFloat(destLng) },
      parseInt(maxWalk)
    );
  };

  return (
    <div className="panel-card">
      <h3 className="panel-card-title">
        <span className="material-symbols-outlined panel-card-title-icon text-primary">location_on</span>
        Route Optimizer
      </h3>
      <form className="route-form" onSubmit={handleSubmit}>
        <div>
          <p className="form-input-label" style={{ marginBottom: 8 }}>Origin Coordinates</p>
          <div className="route-form-row">
            <div className="form-input-group">
              <label className="form-input-label">Latitude</label>
              <input
                id="origin-lat"
                type="number"
                step="any"
                value={originLat}
                onChange={(e) => setOriginLat(e.target.value)}
                className="input-field"
                placeholder="31.5204"
                required
              />
            </div>
            <div className="form-input-group">
              <label className="form-input-label">Longitude</label>
              <input
                id="origin-lng"
                type="number"
                step="any"
                value={originLng}
                onChange={(e) => setOriginLng(e.target.value)}
                className="input-field"
                placeholder="74.3587"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <p className="form-input-label" style={{ marginBottom: 8 }}>Destination Coordinates</p>
          <div className="route-form-row">
            <div className="form-input-group">
              <label className="form-input-label">Latitude</label>
              <input
                id="dest-lat"
                type="number"
                step="any"
                value={destLat}
                onChange={(e) => setDestLat(e.target.value)}
                className="input-field"
                placeholder="31.4504"
                required
              />
            </div>
            <div className="form-input-group">
              <label className="form-input-label">Longitude</label>
              <input
                id="dest-lng"
                type="number"
                step="any"
                value={destLng}
                onChange={(e) => setDestLng(e.target.value)}
                className="input-field"
                placeholder="74.2933"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-input-group">
          <label className="form-input-label">Max Walking Time (mins)</label>
          <input
            id="max-walk-time"
            type="number"
            min="1"
            max="30"
            value={maxWalk}
            onChange={(e) => setMaxWalk(e.target.value)}
            className="input-field"
            required
          />
        </div>

        <button
          id="find-green-route-btn"
          type="submit"
          className="btn-primary"
          disabled={isLoading}
          style={{ width: '100%', marginTop: 8 }}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span className="spinner" /> Optimizing...
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span className="material-symbols-outlined text-sm">eco</span> Find Green Route
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
