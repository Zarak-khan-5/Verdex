'use client';

import type { CityMetrics } from '@/types';

interface ImpactMetricsProps {
  metrics: CityMetrics;
  city?: string;
}

export default function ImpactMetrics({ metrics, city = 'All' }: ImpactMetricsProps) {
  const getModeIcon = (mode: string) => {
    const lower = mode.toLowerCase();
    if (lower.includes('metro') || lower.includes('subway') || lower.includes('transit')) return 'subway';
    if (lower.includes('bike') || lower.includes('bicycle')) return 'pedal_bike';
    if (lower.includes('bus')) return 'directions_bus';
    if (lower.includes('walk')) return 'directions_walk';
    if (lower.includes('car')) return 'directions_car';
    return 'directions_run';
  };

  return (
    <div className="panel-card">
      <h3 className="panel-card-title" style={{ marginBottom: city ? 4 : 16 }}>
        <span className="material-symbols-outlined panel-card-title-icon text-primary">public</span>
        City-Wide Impact
      </h3>
      {city && (
        <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '10px', color: '#1aa876', textTransform: 'uppercase', marginBottom: 16 }}>
          {city}
        </div>
      )}

      <div className="impact-grid">
        <div className="impact-item">
          <div className="impact-value">{metrics.total_co2_saved_kg.toFixed(0)}</div>
          <div className="impact-label">kg CO₂ Saved This Month</div>
        </div>
        <div className="impact-item">
          <div className="impact-value">{metrics.total_routes_optimized}</div>
          <div className="impact-label">Routes Optimized</div>
        </div>
        <div className="impact-item">
          <div className="impact-value">{metrics.active_users}</div>
          <div className="impact-label">Active Commuters</div>
        </div>
        <div className="impact-item">
          <div className="impact-value">
            {(metrics.total_co2_saved_kg * 0.048).toFixed(0)}
          </div>
          <div className="impact-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <span className="material-symbols-outlined text-sm text-primary" style={{ fontSize: '1rem' }}>nature</span>
            <span>Trees Equivalent</span>
          </div>
        </div>
      </div>

      {/* Mode Distribution */}
      <div style={{ marginTop: 28 }}>
        <h4
          style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: 16,
            color: 'var(--color-verdex-text-muted)',
          }}
        >
          Transport Mode Distribution
        </h4>
        <div className="mode-list">
          {metrics.top_modes.map((mode) => (
            <div className="mode-item" key={mode.mode}>
              <span className="mode-name" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined text-base text-primary">{getModeIcon(mode.mode)}</span>
                <span>{mode.mode}</span>
              </span>
              <div className="mode-bar-container">
                <div
                  className="mode-bar"
                  style={{ width: `${mode.percentage}%` }}
                />
              </div>
              <span className="mode-percentage">{mode.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
