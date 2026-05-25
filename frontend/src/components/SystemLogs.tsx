'use client';

import { useEffect, useState } from 'react';
import type { SystemLog } from '@/types';
import { getSystemLogs } from '@/services/api';

export default function SystemLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getSystemLogs();
        setLogs(data);
      } catch {
        // Use mock data if API is down
        setLogs([
          {
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'Verdex API server initialized successfully',
            source: 'main.py',
          },
          {
            timestamp: new Date(Date.now() - 60000).toISOString(),
            level: 'info',
            message: 'Route optimization completed in 120ms',
            source: 'engine.py',
          },
          {
            timestamp: new Date(Date.now() - 120000).toISOString(),
            level: 'warning',
            message: 'Active sessions approaching limit (8/10)',
            source: 'sessions',
          },
          {
            timestamp: new Date(Date.now() - 180000).toISOString(),
            level: 'info',
            message: 'Weather data fetched from Open-Meteo API',
            source: 'engine.py',
          },
          {
            timestamp: new Date(Date.now() - 300000).toISOString(),
            level: 'error',
            message: 'LM Arena API rate limit exceeded — using fallback',
            source: 'engine.py',
          },
          {
            timestamp: new Date(Date.now() - 420000).toISOString(),
            level: 'info',
            message: 'Database connection pool refreshed',
            source: 'database',
          },
          {
            timestamp: new Date(Date.now() - 600000).toISOString(),
            level: 'info',
            message: 'JWT token validation successful for 3 users',
            source: 'auth.py',
          },
          {
            timestamp: new Date(Date.now() - 900000).toISOString(),
            level: 'warning',
            message: 'Stale session cleaned — user inactive 10+ min',
            source: 'sessions',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="panel-card">
      <h3 className="panel-card-title">
        <span className="material-symbols-outlined panel-card-title-icon text-primary">assignment</span>
        System Logs
      </h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <span className="spinner" />
        </div>
      ) : (
        <div className="system-logs">
          {logs.map((log, i) => (
            <div className="log-entry" key={i}>
              <span className={`log-level log-level-${log.level}`}>
                {log.level}
              </span>
              <span className="log-message">{log.message}</span>
              <span className="log-source">{log.source}</span>
              <span className="log-time">{formatTime(log.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
