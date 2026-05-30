'use client';

import { useState, useEffect } from 'react';
import type { PendingPlannerRequest } from '@/types';

interface PendingApprovalsProps {
  onActionCompleted?: () => void;
}

export default function PendingApprovals({ onActionCompleted }: PendingApprovalsProps) {
  const [requests, setRequests] = useState<PendingPlannerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchPendingList = async () => {
    setLoading(true);
    setError(null);
    try {
      const { getPendingPlanners } = await import('@/services/api');
      const data = await getPendingPlanners();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load pending approvals:', err);
      setError('Could not load pending registrations list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingList();
  }, []);

  const handleApprove = async (requestId: string) => {
    setActioningId(requestId);
    setError(null);
    setSuccessMsg(null);
    try {
      const { approvePlanner } = await import('@/services/api');
      const res = await approvePlanner(requestId);
      setSuccessMsg(res.message || 'City Planner registration approved successfully.');
      fetchPendingList();
      if (onActionCompleted) {
        onActionCompleted();
      }
    } catch (err) {
      console.error('Failed to approve planner:', err);
      setError('Approval failed. Please try again.');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm('Are you sure you want to reject this registration request?')) return;
    setActioningId(requestId);
    setError(null);
    setSuccessMsg(null);
    try {
      const { rejectPlanner } = await import('@/services/api');
      const res = await rejectPlanner(requestId);
      setSuccessMsg(res.message || 'City Planner request rejected and deleted.');
      fetchPendingList();
      if (onActionCompleted) {
        onActionCompleted();
      }
    } catch (err) {
      console.error('Failed to reject planner:', err);
      setError('Rejection failed. Please try again.');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="panel-card custom-scrollbar" style={{ padding: 24, overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 className="panel-card-title" style={{ marginBottom: 4 }}>
            <span className="material-symbols-outlined text-primary">how_to_reg</span>
            Pending Planners approvals
          </h2>
          <p className="panel-card-description">
            Approve or reject pending City Planner registrations before they can access dashboard analytics.
          </p>
        </div>
        <button
          onClick={fetchPendingList}
          disabled={loading}
          className="btn-primary flex items-center gap-1"
          style={{ padding: '6px 12px', fontSize: '0.75rem', height: 'fit-content' }}
          title="Refresh List"
        >
          <span className="material-symbols-outlined text-xs animate-spin-hover">refresh</span>
          Refresh
        </button>
      </div>

      {successMsg && (
        <div className="alert-success" style={{ marginBottom: 16 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert-error" style={{ marginBottom: 16 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 0', gap: 12 }}>
          <span className="material-symbols-outlined text-primary text-3xl animate-spin">refresh</span>
          <p className="panel-card-description">Retrieving approvals queue...</p>
        </div>
      ) : requests.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 0', gap: 12 }}>
          <span className="material-symbols-outlined text-slate-500 text-3xl">mark_email_read</span>
          <p className="panel-card-description">No pending City Planner registrations.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr className="user-table-header-row" style={{ borderBottom: '1px solid rgba(11, 94, 67, 0.3)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px' }}>Planner Name</th>
                <th style={{ padding: '12px 8px' }}>Email Address</th>
                <th style={{ padding: '12px 8px' }}>Requested On</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', width: '200px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => {
                const date = new Date(req.created_at);
                const dateStr = isNaN(date.getTime()) ? 'Pending' : date.toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr key={req.request_id} style={{ borderBottom: '1px solid rgba(11, 94, 67, 0.15)' }}>
                    <td className="user-table-name" style={{ padding: '12px 8px', fontWeight: 'bold' }}>
                      {req.name}
                    </td>
                    <td className="user-table-email" style={{ padding: '12px 8px', fontFamily: 'monospace' }}>
                      {req.email}
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--color-verdex-text-muted)', fontSize: '0.8rem' }}>
                      {dateStr}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button
                          disabled={actioningId !== null}
                          onClick={() => handleApprove(req.request_id)}
                          className="btn-primary"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            opacity: actioningId !== null ? 0.6 : 1,
                          }}
                        >
                          {actioningId === req.request_id ? 'Wait...' : 'Approve'}
                        </button>
                        <button
                          disabled={actioningId !== null}
                          onClick={() => handleReject(req.request_id)}
                          className="btn-delete"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            opacity: actioningId !== null ? 0.6 : 1,
                          }}
                        >
                          {actioningId === req.request_id ? 'Wait...' : 'Reject'}
                        </button>
                      </div>
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
