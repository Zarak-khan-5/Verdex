'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CityHeatmap from '@/components/CityHeatmap';
import ImpactMetrics from '@/components/ImpactMetrics';
import { getCityMetrics } from '@/services/api';
import type { CityMetrics, AuthResponse } from '@/types';
import '@/styles/dashboard.css';

const DEFAULT_METRICS: CityMetrics = {
  total_co2_saved_kg: 1247.5,
  total_routes_optimized: 3842,
  active_users: 156,
  monthly_trend: [
    { month: 'Jan', co2_saved: 145 },
    { month: 'Feb', co2_saved: 198 },
    { month: 'Mar', co2_saved: 256 },
    { month: 'Apr', co2_saved: 312 },
    { month: 'May', co2_saved: 336 },
  ],
  top_modes: [
    { mode: 'Metro + Walking', count: 1520, percentage: 39 },
    { mode: 'Bike', count: 1000, percentage: 26 },
    { mode: 'Bus + Metro', count: 845, percentage: 22 },
    { mode: 'Walking', count: 477, percentage: 13 },
  ],
};

export default function ClientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [metrics, setMetrics] = useState<CityMetrics>(DEFAULT_METRICS);
  const [activeView, setActiveView] = useState<'overview' | 'heatmap' | 'reports'>('overview');

  useEffect(() => {
    const stored = localStorage.getItem('verdex_user');
    if (!stored) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(stored));

    const fetchMetrics = async () => {
      try {
        const data = await getCityMetrics();
        setMetrics(data);
      } catch {
        // Keep default metrics if API unavailable
      }
    };
    fetchMetrics();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('verdex_token');
    localStorage.removeItem('verdex_user');
    router.push('/');
  };

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
          <span className="sidebar-logo">Verdex</span>
        </div>

        <div className="sidebar-section">Analytics</div>
        <button 
          className={`sidebar-link ${activeView === 'overview' ? 'sidebar-link-active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          <span className="material-symbols-outlined sidebar-link-icon">analytics</span>
          City Overview
        </button>
        <button 
          className={`sidebar-link ${activeView === 'heatmap' ? 'sidebar-link-active' : ''}`}
          onClick={() => setActiveView('heatmap')}
        >
          <span className="material-symbols-outlined sidebar-link-icon">map</span>
          Route Heatmap
        </button>
        <button 
          className={`sidebar-link ${activeView === 'reports' ? 'sidebar-link-active' : ''}`}
          onClick={() => setActiveView('reports')}
        >
          <span className="material-symbols-outlined sidebar-link-icon">trending_up</span>
          Reports &amp; SDGs
        </button>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">{user.role}</div>
            </div>
            <button className="sidebar-logout flex items-center justify-center" onClick={handleLogout} title="Logout">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1 className="dashboard-title flex items-center gap-2">
            City Planner Dashboard
            <span className="material-symbols-outlined text-2xl text-primary">location_city</span>
          </h1>
          <p className="dashboard-subtitle">
            Urban mobility analytics &amp; sustainability impact
          </p>
        </div>

        {/* Summary Stats */}
        <div className="dashboard-grid grid-4" style={{ marginBottom: 24 }}>
          <div className="stat-card" onClick={() => setActiveView('overview')} style={{ cursor: 'pointer' }}>
            <div className="stat-card-header">
              <div className="stat-card-icon stat-icon-green">
                <span className="material-symbols-outlined">eco</span>
              </div>
              <span className="stat-card-trend trend-up">+18%</span>
            </div>
            <div className="stat-card-value">
              {metrics.total_co2_saved_kg.toFixed(0)}
            </div>
            <div className="stat-card-label">kg CO₂ Saved</div>
          </div>
          <div className="stat-card" onClick={() => setActiveView('heatmap')} style={{ cursor: 'pointer', animationDelay: '0.1s' }}>
            <div className="stat-card-header">
              <div className="stat-card-icon stat-icon-cyan">
                <span className="material-symbols-outlined">route</span>
              </div>
              <span className="stat-card-trend trend-up">+24%</span>
            </div>
            <div className="stat-card-value">{metrics.total_routes_optimized}</div>
            <div className="stat-card-label">Routes Optimized</div>
          </div>
          <div className="stat-card" onClick={() => setActiveView('reports')} style={{ cursor: 'pointer', animationDelay: '0.2s' }}>
            <div className="stat-card-header">
              <div className="stat-card-icon stat-icon-purple">
                <span className="material-symbols-outlined">people</span>
              </div>
            </div>
            <div className="stat-card-value">{metrics.active_users}</div>
            <div className="stat-card-label">Active Commuters</div>
          </div>
          <div className="stat-card" style={{ animationDelay: '0.3s' }}>
            <div className="stat-card-header">
              <div className="stat-card-icon stat-icon-amber">
                <span className="material-symbols-outlined">nature</span>
              </div>
            </div>
            <div className="stat-card-value">
              {(metrics.total_co2_saved_kg * 0.048).toFixed(0)}
            </div>
            <div className="stat-card-label">Trees Equivalent</div>
          </div>
        </div>

        {/* Dynamic content rendering based on activeView */}
        {activeView === 'overview' && (
          <div className="dashboard-grid grid-2">
            <CityHeatmap monthlyTrend={metrics.monthly_trend} />
            <ImpactMetrics metrics={metrics} />
          </div>
        )}

        {activeView === 'heatmap' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <CityHeatmap monthlyTrend={metrics.monthly_trend} />
          </div>
        )}

        {activeView === 'reports' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <ImpactMetrics metrics={metrics} />
          </div>
        )}
      </main>
    </div>
  );
}
