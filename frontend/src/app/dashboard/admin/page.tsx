'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SystemLogs from '@/components/SystemLogs';
import SessionMonitor from '@/components/SessionMonitor';
import type { AuthResponse } from '@/types';
import '@/styles/dashboard.css';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'sessions' | 'logs' | 'settings'>('overview');

  useEffect(() => {
    const stored = localStorage.getItem('verdex_user');
    if (!stored) {
      router.push('/');
      return;
    }
    const parsed = JSON.parse(stored);
    setUser(parsed);
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

        <div className="sidebar-section">System</div>
        <button 
          className={`sidebar-link ${activeView === 'overview' ? 'sidebar-link-active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          <span className="material-symbols-outlined sidebar-link-icon">monitor</span>
          Overview
        </button>
        <button 
          className={`sidebar-link ${activeView === 'sessions' ? 'sidebar-link-active' : ''}`}
          onClick={() => setActiveView('sessions')}
        >
          <span className="material-symbols-outlined sidebar-link-icon">group</span>
          Sessions
        </button>
        <button 
          className={`sidebar-link ${activeView === 'logs' ? 'sidebar-link-active' : ''}`}
          onClick={() => setActiveView('logs')}
        >
          <span className="material-symbols-outlined sidebar-link-icon">assignment</span>
          Logs
        </button>
        <button 
          className={`sidebar-link ${activeView === 'settings' ? 'sidebar-link-active' : ''}`}
          onClick={() => setActiveView('settings')}
        >
          <span className="material-symbols-outlined sidebar-link-icon">settings</span>
          Settings
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
            Admin Control Panel
            <span className="material-symbols-outlined text-2xl text-primary">settings</span>
          </h1>
          <p className="dashboard-subtitle">
            System monitoring &amp; session management
          </p>
        </div>

        {/* System Status Cards */}
        <div className="dashboard-grid grid-4" style={{ marginBottom: 24 }}>
          <div className="stat-card" onClick={() => setActiveView('overview')} style={{ cursor: 'pointer' }}>
            <div className="stat-card-header">
              <div className="stat-card-icon stat-icon-green">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
            </div>
            <div className="stat-card-value" style={{ color: '#10b981' }}>
              Healthy
            </div>
            <div className="stat-card-label">API Status</div>
          </div>
          <div className="stat-card" style={{ animationDelay: '0.1s' }}>
            <div className="stat-card-header">
              <div className="stat-card-icon stat-icon-cyan">
                <span className="material-symbols-outlined">bolt</span>
              </div>
            </div>
            <div className="stat-card-value">120ms</div>
            <div className="stat-card-label">Avg Response Time</div>
          </div>
          <div className="stat-card" style={{ animationDelay: '0.2s' }}>
            <div className="stat-card-header">
              <div className="stat-card-icon stat-icon-purple">
                <span className="material-symbols-outlined">psychology</span>
              </div>
            </div>
            <div className="stat-card-value">Active</div>
            <div className="stat-card-label">AI Engine</div>
          </div>
          <div className="stat-card" style={{ animationDelay: '0.3s' }}>
            <div className="stat-card-header">
              <div className="stat-card-icon stat-icon-amber">
                <span className="material-symbols-outlined">database</span>
              </div>
            </div>
            <div className="stat-card-value">Connected</div>
            <div className="stat-card-label">Database</div>
          </div>
        </div>

        {/* Dynamic views based on activeView */}
        {activeView === 'overview' && (
          <div className="dashboard-grid grid-2">
            <SessionMonitor />
            <SystemLogs />
          </div>
        )}

        {activeView === 'sessions' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <SessionMonitor />
          </div>
        )}

        {activeView === 'logs' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <SystemLogs />
          </div>
        )}

        {activeView === 'settings' && (
          <div className="panel-card" style={{ padding: 24 }}>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">settings</span>
              System Settings
            </h2>
            <p className="text-slate-400 text-xs font-mono mb-4">Manage Verdex routing configurations and API credentials.</p>
            <div className="space-y-4" style={{ maxWidth: '400px' }}>
              <div className="flex items-center justify-between border-b border-emerald-950/40 pb-2">
                <span className="text-xs font-semibold text-slate-300">Demo Limit Filter</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/40 text-emerald-400 font-mono">10 Sessions Max</span>
              </div>
              <div className="flex items-center justify-between border-b border-emerald-950/40 pb-2">
                <span className="text-xs font-semibold text-slate-300">Open-Meteo Cache Duration</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">10 Minutes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Headless ReAct Agent Mode</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/40 text-emerald-400 font-mono">Enabled</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
