'use client';

import { useState, useEffect } from 'react';
import type { LeaderboardEntry } from '@/types';
import { getRankInfo } from '@/utils/rank';

interface LeaderboardProps {
  refreshTrigger?: number;
}

export default function Leaderboard({ refreshTrigger = 0 }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const { getLeaderboard } = await import('@/services/api');
      const data = await getLeaderboard();
      setEntries(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError('Could not retrieve leaderboard standings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [refreshTrigger]);

  const filteredEntries = entries.filter((entry) => {
    const query = searchQuery.toLowerCase();
    return (
      entry.name.toLowerCase().includes(query) ||
      entry.email.toLowerCase().includes(query)
    );
  });

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span
          className="rank-medal"
          style={{
            background: 'linear-gradient(135deg, #fef08a 0%, #eab308 100%)',
            color: '#713f12',
            boxShadow: '0 0 12px rgba(234, 179, 8, 0.4)',
          }}
        >
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
          <span>1st</span>
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span
          className="rank-medal"
          style={{
            background: 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)',
            color: '#334155',
            boxShadow: '0 0 12px rgba(203, 213, 225, 0.4)',
          }}
        >
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
          <span>2nd</span>
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span
          className="rank-medal"
          style={{
            background: 'linear-gradient(135deg, #ffedd5 0%, #c2410c 100%)',
            color: '#7c2d12',
            boxShadow: '0 0 12px rgba(194, 65, 12, 0.4)',
          }}
        >
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
          <span>3rd</span>
        </span>
      );
    }
    return <span className="rank-number">{rank}th</span>;
  };

  return (
    <div className="panel-card custom-scrollbar" style={{ padding: 24, overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="panel-card-title" style={{ marginBottom: 4 }}>
            <span className="material-symbols-outlined text-primary">trophy</span>
            Green Commute Leaderboard
          </h2>
          <p className="panel-card-description">
            Live rankings of commuters by accumulated Green Credits and CO₂ savings.
          </p>
        </div>
        <button
          onClick={fetchLeaderboard}
          className="btn-primary flex items-center gap-1"
          style={{ padding: '6px 12px', fontSize: '0.75rem', height: 'fit-content' }}
          title="Refresh Standings"
        >
          <span className="material-symbols-outlined text-xs animate-spin-hover">refresh</span>
          Refresh
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-verdex-text-muted)', fontSize: '1.1rem' }}>
            search
          </span>
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              fontSize: '0.8rem',
              borderRadius: '8px',
              border: '1px solid rgba(11, 94, 67, 0.3)',
              background: 'rgba(3, 6, 5, 0.4)',
              color: 'var(--color-verdex-text)',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#10b981')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(11, 94, 67, 0.3)')}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 0', gap: 12 }}>
          <span className="material-symbols-outlined text-primary text-3xl animate-spin">refresh</span>
          <p className="panel-card-description">Updating rankings...</p>
        </div>
      ) : error ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 0', gap: 12 }}>
          <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
          <p className="panel-card-description text-red-400">{error}</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 0', gap: 12 }}>
          <span className="material-symbols-outlined text-slate-500 text-3xl">sentiment_dissatisfied</span>
          <p className="panel-card-description">No users match your search or have earned points yet.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr className="user-table-header-row" style={{ borderBottom: '1px solid rgba(11, 94, 67, 0.3)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', width: '80px', textAlign: 'center' }}>Rank</th>
                <th style={{ padding: '12px 8px' }}>User</th>
                <th style={{ padding: '12px 8px' }}>Role</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>CO₂ Saved</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Green Credits</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, index) => {
                const rank = index + 1;
                const rankInfo = getRankInfo(entry.carbon_credits_earned);
                const initials = entry.name
                  ? entry.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : entry.email.charAt(0).toUpperCase();

                return (
                  <tr key={entry.user_id} className="leaderboard-row" style={{ borderBottom: '1px solid rgba(11, 94, 67, 0.15)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '12px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                      {getRankBadge(rank)}
                    </td>
                    <td style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          className="sidebar-avatar"
                          style={{
                            width: 32,
                            height: 32,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            background: rank === 1 ? 'rgba(234, 179, 8, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                            border: rank === 1 ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(16, 185, 129, 0.2)',
                            color: rank === 1 ? '#eab308' : '#6ee7b7',
                          }}
                        >
                          {initials}
                        </div>
                        <div>
                          <div className="user-table-name" style={{ fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span>{entry.name}</span>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                padding: '1px 6px',
                                borderRadius: '6px',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                background: rankInfo.styles.background,
                                border: rankInfo.styles.border,
                                color: rankInfo.styles.color,
                                textTransform: 'uppercase',
                                letterSpacing: '0.03em',
                              }}
                              title={`Rank Level ${rankInfo.level}`}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '0.75rem' }}>
                                {rankInfo.icon}
                              </span>
                              {rankInfo.title}
                            </span>
                          </div>
                          <div className="user-table-email" style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                            {entry.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                      <span className={`role-badge ${
                        entry.role === 'admin' ? 'badge-admin' :
                        entry.role === 'client' ? 'badge-client' :
                        'badge-user'
                      }`}>
                        {entry.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', verticalAlign: 'middle', fontWeight: '500', color: '#cbd5e1' }} className="user-table-name">
                      {entry.total_co2_saved_kg.toFixed(1)} kg
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', verticalAlign: 'middle', fontWeight: 'bold', color: '#10b981', fontSize: '0.95rem' }}>
                      {Math.round(entry.carbon_credits_earned)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

