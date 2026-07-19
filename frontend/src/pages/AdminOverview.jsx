import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, Wrench, CheckCircle2, ArrowRight } from 'lucide-react';
import Layout from '../components/Layout';
import client from '../api/client';

const STATUS_ICON = {
  pending: Clock,
  in_progress: Wrench,
  completed: CheckCircle2,
};

export default function AdminOverview() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/reports/summary')
      .then((res) => setSummary(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load summary'));
  }, []);

  const statusMap = {};
  (summary?.byStatus || []).forEach((s) => (statusMap[s._id] = s.count));

  return (
    <Layout
      eyebrow="Administration"
      title="Overview"
      headerAction={
        <button className="btn btn-outline" onClick={() => navigate('/admin/requests')}>
          Manage requests
          <ArrowRight size={14} />
        </button>
      }
    >
      {error && <div className="alert alert-error">{error}</div>}
      {!summary ? (
        <div className="empty-state">Loading…</div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card accent">
              <div className="stat-label">
                <ClipboardList size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                Total requests
              </div>
              <div className="stat-value">{summary.total}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending</div>
              <div className="stat-value">{statusMap.pending || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">In progress</div>
              <div className="stat-value">{statusMap.in_progress || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Completed</div>
              <div className="stat-value">{(statusMap.completed || 0) + (statusMap.closed || 0)}</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card card-pad">
              <div className="section-title" style={{ marginTop: 0 }}>
                By category
              </div>
              {summary.byCategory.length === 0 ? (
                <p style={{ color: 'var(--steel-500)', fontSize: 13.5 }}>No requests yet.</p>
              ) : (
                summary.byCategory.map((c) => (
                  <div className="kv-row" key={c._id}>
                    <span className="k">{c._id}</span>
                    <span className="v">{c.count}</span>
                  </div>
                ))
              )}
            </div>
            <div className="card card-pad">
              <div className="section-title" style={{ marginTop: 0 }}>
                By priority
              </div>
              {summary.byPriority.map((p) => (
                <div className="kv-row" key={p._id}>
                  <span className="k" style={{ textTransform: 'capitalize' }}>
                    {p._id}
                  </span>
                  <span className="v">{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
