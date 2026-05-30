'use client';

import { useEffect, useState } from 'react';
import type { SessionsResponse } from '@/types';
import { getSessions } from '@/services/api';

export default function SessionMonitor() {
  const [sessionData, setSessionData] = useState<SessionsResponse>({
    active_sessions: 0,
    max_sessions: 10,
    sessions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      const storedLimit = typeof window !== 'undefined' ? localStorage.getItem('verdex_demo_limit') : null;
      const currentLimit = storedLimit ? Number(storedLimit) : 10;
      
      try {
        const data = await getSessions();
        data.max_sessions = currentLimit;
        setSessionData(data);
      } catch {
        // Fallback mock data
        setSessionData({
          active_sessions: 4,
          max_sessions: currentLimit,
          sessions: [
            {
              session_id: 'a1b2c3d4',
              user_id: 'user-001',
              last_active: new Date().toISOString(),
              is_active: true,
            },
            {
              session_id: 'e5f6g7h8',
              user_id: 'user-002',
              last_active: new Date(Date.now() - 120000).toISOString(),
              is_active: true,
            },
            {
              session_id: 'i9j0k1l2',
              user_id: 'planner-001',
              last_active: new Date(Date.now() - 300000).toISOString(),
              is_active: true,
            },
            {
              session_id: 'm3n4o5p6',
              user_id: 'admin-001',
              last_active: new Date(Date.now() - 60000).toISOString(),
              is_active: true,
            },
          ],
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSessions();

    // Poll every 10 seconds
    const interval = setInterval(fetchSessions, 10000);
    
    // Listen to local settings saves
    window.addEventListener('storage', fetchSessions);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', fetchSessions);
    };
  }, []);

  const fillPercentage =
    (sessionData.active_sessions / sessionData.max_sessions) * 100;
  const isWarning = fillPercentage >= 70;

  const formatTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <div className="panel-card">
      <h3 className="panel-card-title">
        <span className="material-symbols-outlined panel-card-title-icon text-primary">people</span>
        Session Monitor
      </h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <span className="spinner" />
        </div>
      ) : (
        <div className="session-monitor">
          <div className="session-gauge">
            <div className="session-gauge-label">
              {sessionData.active_sessions}{' '}
              <span
                style={{
                  fontSize: '1rem',
                  fontWeight: 400,
                  color: 'var(--color-verdex-text-muted)',
                }}
              >
                / {sessionData.max_sessions}
              </span>
            </div>
            <span className="session-gauge-sublabel">Active Sessions</span>
            <div className="session-gauge-bar">
              <div
                className={`session-gauge-fill ${isWarning ? 'warning' : ''}`}
                style={{ width: `${fillPercentage}%` }}
              />
            </div>
          </div>

          <div>
            <h4
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--color-verdex-text-muted)',
                marginBottom: 10,
              }}
            >
              Active Users
            </h4>
            <div className="session-list">
              {sessionData.sessions.map((session) => (
                <div className="session-item" key={session.session_id}>
                  <span
                    className={`session-indicator ${
                      session.is_active ? '' : 'inactive'
                    }`}
                  />
                  <span className="session-id">
                    {session.session_id.slice(0, 8)}…
                  </span>
                  <span className="session-time">
                    {formatTime(session.last_active)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
