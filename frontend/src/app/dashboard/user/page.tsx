'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CarbonWallet from '@/components/CarbonWallet';
import dynamic from 'next/dynamic';
import Leaderboard from '@/components/Leaderboard';
import { getRankInfo } from '@/utils/rank';

import type { AuthResponse } from '@/types';
import '@/styles/dashboard.css';

const TripReportButton = dynamic(() => import('@/components/TripReportButton'), {
  ssr: false,
});

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [activeView, setActiveView] = useState<'planner' | 'history' | 'rewards' | 'leaderboard'>('planner');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic calculated stats
  const totalCo2 = history.reduce((sum, r) => sum + (Number(r.co2_saved_kg) || 0), 0);
  const routesCount = history.length;
  const credits = Math.round(totalCo2 / 0.5);
  const rankInfo = getRankInfo(credits);

  const fetchHistoryData = async (userId: string) => {
    try {
      const { getRouteHistory } = await import('@/services/api');
      const data = await getRouteHistory(userId);
      // Sort history with most recent first
      const sorted = [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setHistory(sorted);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('verdex_theme');
    const root = window.document.documentElement;
    const body = window.document.body;
    if (savedTheme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      body.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      body.classList.remove('light');
    }

    const stored = localStorage.getItem('verdex_user');
    if (!stored) {
      router.push('/');
      return;
    }
    const parsedUser = JSON.parse(stored);
    setUser(parsedUser);
    fetchHistoryData(parsedUser.user_id);
  }, [router]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'ROUTE_SAVED' && user) {
        fetchHistoryData(user.user_id || '');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user]);

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

        <div className="sidebar-section">Navigation</div>
        <button 
          className={`sidebar-link ${activeView === 'planner' ? 'sidebar-link-active' : ''}`}
          onClick={() => setActiveView('planner')}
        >
          <span className="material-symbols-outlined sidebar-link-icon">map</span>
          Route Planner
        </button>
        <button 
          className={`sidebar-link ${activeView === 'history' ? 'sidebar-link-active' : ''}`}
          onClick={() => setActiveView('history')}
        >
          <span className="material-symbols-outlined sidebar-link-icon">analytics</span>
          My History
        </button>
        <button 
          className={`sidebar-link ${activeView === 'rewards' ? 'sidebar-link-active' : ''}`}
          onClick={() => setActiveView('rewards')}
        >
          <span className="material-symbols-outlined sidebar-link-icon">trophy</span>
          Rewards
        </button>
        <button 
          className={`sidebar-link ${activeView === 'leaderboard' ? 'sidebar-link-active' : ''}`}
          onClick={() => setActiveView('leaderboard')}
        >
          <span className="material-symbols-outlined sidebar-link-icon">leaderboard</span>
          Leaderboard
        </button>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="role-badge badge-user" style={{ width: 'fit-content', padding: '1px 6px', fontSize: '0.65rem' }}>
                  {user.role}
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: rankInfo.styles.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>
                    {rankInfo.icon}
                  </span>
                  {rankInfo.title}
                </span>
              </div>
            </div>
            <button className="sidebar-logout flex items-center justify-center" onClick={handleLogout} title="Logout">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-header flex justify-between items-center">
          <div>
            <h1 className="dashboard-title flex items-center gap-2">
              Welcome back, {user.name}
              <span className="material-symbols-outlined text-2xl text-primary animate-pulse">waving_hand</span>
            </h1>
            <p className="dashboard-subtitle">
              Plan your next eco-friendly commute
            </p>
          </div>
          <div>
            <TripReportButton userId={user.user_id || ''} userName={user.name} />
          </div>
        </div>

        {/* Stats Row */}
        <div className="dashboard-grid grid-3" style={{ marginBottom: 24 }}>
          <div className="stat-card" onClick={() => setActiveView('rewards')} style={{ cursor: 'pointer' }}>
            <div className="stat-card-header">
              <div className="stat-card-icon stat-icon-green">
                <span className="material-symbols-outlined">eco</span>
              </div>
            </div>
            <div className="stat-card-value">{totalCo2.toFixed(1)}</div>
            <div className="stat-card-label">kg CO₂ Saved</div>
          </div>
          <div className="stat-card" onClick={() => setActiveView('rewards')} style={{ cursor: 'pointer', animationDelay: '0.1s' }}>
            <div className="stat-card-header">
              <div className="stat-card-icon stat-icon-cyan">
                <span className="material-symbols-outlined">star</span>
              </div>
            </div>
            <div className="stat-card-value">{credits}</div>
            <div className="stat-card-label">Green Credits</div>
          </div>
          <div className="stat-card" onClick={() => setActiveView('history')} style={{ cursor: 'pointer', animationDelay: '0.2s' }}>
            <div className="stat-card-header">
              <div className="stat-card-icon stat-icon-purple">
                <span className="material-symbols-outlined">pedal_bike</span>
              </div>
            </div>
            <div className="stat-card-value">{routesCount}</div>
            <div className="stat-card-label">Routes Completed</div>
          </div>
        </div>

        {/* Main Grid: Replacing old static panels with the conditional views */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, flex: 1, minHeight: '620px', height: 'calc(100vh - 270px)' }}>
          {activeView === 'planner' && (
            <div className="panel-card" style={{ padding: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <iframe 
                src="/verdex.html" 
                style={{ width: '100%', height: '100%', border: 'none', background: '#030605' }}
                title="Verdex Live Navigation Widget"
              />
            </div>
          )}

          {activeView === 'history' && (
            <div className="panel-card custom-scrollbar" style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
              <h2 className="panel-card-title mb-4">
                <span className="material-symbols-outlined text-primary">history</span>
                Commute History
              </h2>
              {loading ? (
                <p className="panel-card-description mb-4">Loading history...</p>
              ) : history.length === 0 ? (
                <p className="panel-card-description mb-4">No routes completed yet. Run route safety optimization above to persist trips.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr className="user-table-header-row" style={{ borderBottom: '1px solid rgba(11, 94, 67, 0.3)', textAlign: 'left' }}>
                        <th style={{ padding: '12px 8px' }}>Date</th>
                        <th style={{ padding: '12px 8px' }}>Mode</th>
                        <th style={{ padding: '12px 8px' }}>Time</th>
                        <th style={{ padding: '12px 8px' }}>CO₂ Saved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((r, idx) => (
                        <tr key={r.route_id || idx} style={{ borderBottom: '1px solid rgba(11, 94, 67, 0.15)' }}>
                          <td className="user-table-email" style={{ padding: '12px 8px' }}>
                            {new Date(r.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <span className="mode-badge">
                              {r.mode}
                            </span>
                          </td>
                          <td className="user-table-name" style={{ padding: '12px 8px' }}>
                            {r.total_time_mins} mins
                          </td>
                          <td style={{ padding: '12px 8px', fontWeight: 'bold', color: '#10b981' }}>
                            {Number(r.co2_saved_kg).toFixed(2)} kg
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeView === 'rewards' && (
            <div className="panel-card" style={{ padding: 24, height: '100%', overflowY: 'auto' }}>
              <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <CarbonWallet 
                  totalCo2Saved={totalCo2}
                  carbonCredits={credits}
                  routesCompleted={routesCount}
                />
              </div>
            </div>
          )}

          {activeView === 'leaderboard' && (
            <Leaderboard />
          )}
        </div>
      </main>
    </div>
  );
}
