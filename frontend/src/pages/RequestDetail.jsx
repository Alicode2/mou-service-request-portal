import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Tag, User, AlertCircle, CheckCircle2, Trash2, FileImage } from 'lucide-react';
import Layout from '../components/Layout';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/Badges';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
const STATUS_OPTIONS = ['pending', 'assigned', 'in_progress', 'completed', 'closed', 'rejected'];

function shortId(id) {
  return `#${id.slice(-6).toUpperCase()}`;
}

function fmt(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [officers, setOfficers] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await client.get(`/requests/${id}`);
      setData(res.data);
      setNewStatus(res.data.request.status);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load request');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (user?.role === 'admin') {
      client.get('/users', { params: { role: 'maintenance_officer', limit: 100 } }).then((res) => {
        setOfficers(res.data.users);
      });
    }
  }, [user]);

  async function handleAssign(e) {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    setBusy(true);
    try {
      await client.post(`/requests/${id}/assign`, { officerId: selectedOfficer, notes: assignNote });
      setActionSuccess('Request assigned successfully.');
      setAssignNote('');
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to assign request.');
    } finally {
      setBusy(false);
    }
  }

  async function handleStatusUpdate(e) {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    setBusy(true);
    try {
      await client.patch(`/requests/${id}/status`, { status: newStatus, note: statusNote });
      setActionSuccess('Status updated.');
      setStatusNote('');
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this service request? This cannot be undone.')) return;
    setBusy(true);
    try {
      await client.delete(`/requests/${id}`);
      navigate('/dashboard');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete request.');
      setBusy(false);
    }
  }

  if (error) {
    return (
      <Layout eyebrow="Work Orders" title="Request">
        <div className="alert alert-error">
          <AlertCircle size={15} />
          {error}
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout eyebrow="Work Orders" title="Request">
        <div className="empty-state">Loading…</div>
      </Layout>
    );
  }

  const { request, assignment, statusHistory } = data;
  const isOwner = user.role === 'student_staff' && request.submittedBy?._id === user.id;
  const canDelete = user.role === 'admin' || (isOwner && request.status === 'pending');

  return (
    <Layout eyebrow={shortId(request._id)} title={request.title}>
      <div className="grid-2">
        <div>
          <div className="card card-pad" style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <StatusBadge status={request.status} />
              </div>
              {canDelete && (
                <button className="btn btn-danger-outline btn-sm" onClick={handleDelete} disabled={busy}>
                  <Trash2 size={13} />
                  Delete
                </button>
              )}
            </div>

            <p style={{ marginTop: 16, fontSize: 14.5, lineHeight: 1.6, color: 'var(--steel-700)' }}>
              {request.description}
            </p>

            <div className="kv-row">
              <span className="k">
                <MapPin size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                Location
              </span>
              <span className="v">{request.location}</span>
            </div>
            <div className="kv-row">
              <span className="k">
                <Tag size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                Category
              </span>
              <span className="v">{request.category?.name}</span>
            </div>
            <div className="kv-row">
              <span className="k">Priority</span>
              <span className="v">
                <PriorityBadge priority={request.priority} />
              </span>
            </div>
            <div className="kv-row">
              <span className="k">
                <User size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                Submitted by
              </span>
              <span className="v">{request.submittedBy?.name}</span>
            </div>
            <div className="kv-row">
              <span className="k">Submitted on</span>
              <span className="v">{fmt(request.createdAt)}</span>
            </div>
            {assignment && (
              <div className="kv-row">
                <span className="k">Assigned officer</span>
                <span className="v">{assignment.officer?.name}</span>
              </div>
            )}

            {request.evidenceFiles?.length > 0 && (
              <>
                <div className="section-title">
                  <FileImage size={12} style={{ verticalAlign: -1, marginRight: 4 }} />
                  Evidence
                </div>
                <div className="evidence-grid">
                  {request.evidenceFiles.map((f) => (
                    <a
                      key={f.filename}
                      href={`${API_ORIGIN}${f.path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="evidence-thumb"
                    >
                      {f.mimetype?.startsWith('image/') ? (
                        <img src={`${API_ORIGIN}${f.path}`} alt={f.originalName} />
                      ) : (
                        <span>{f.originalName}</span>
                      )}
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Admin: assign / reassign officer */}
          {user.role === 'admin' && (
            <div className="card card-pad" style={{ marginBottom: 18 }}>
              <div className="section-title" style={{ marginTop: 0 }}>
                {assignment ? 'Reassign officer' : 'Assign to officer'}
              </div>
              {actionError && (
                <div className="alert alert-error">
                  <AlertCircle size={14} />
                  {actionError}
                </div>
              )}
              {actionSuccess && (
                <div className="alert alert-success">
                  <CheckCircle2 size={14} />
                  {actionSuccess}
                </div>
              )}
              <form onSubmit={handleAssign}>
                <div className="field">
                  <label>Maintenance officer</label>
                  <select required value={selectedOfficer} onChange={(e) => setSelectedOfficer(e.target.value)}>
                    <option value="">Select officer…</option>
                    {officers.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} {o.department ? `(${o.department})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Note (optional)</label>
                  <input value={assignNote} onChange={(e) => setAssignNote(e.target.value)} placeholder="Instructions for the officer" />
                </div>
                <button className="btn btn-primary" disabled={busy}>
                  {assignment ? 'Reassign' : 'Assign'}
                </button>
              </form>
            </div>
          )}

          {/* Officer / admin: update status */}
          {(user.role === 'maintenance_officer' || user.role === 'admin') && (
            <div className="card card-pad">
              <div className="section-title" style={{ marginTop: 0 }}>
                Update progress
              </div>
              {actionError && (
                <div className="alert alert-error">
                  <AlertCircle size={14} />
                  {actionError}
                </div>
              )}
              {actionSuccess && (
                <div className="alert alert-success">
                  <CheckCircle2 size={14} />
                  {actionSuccess}
                </div>
              )}
              <form onSubmit={handleStatusUpdate}>
                <div className="field">
                  <label>Status</label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Note (optional)</label>
                  <textarea
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="What was done, parts used, follow-up needed…"
                  />
                </div>
                <button className="btn btn-amber" disabled={busy}>
                  Update status
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="card card-pad">
          <div className="section-title" style={{ marginTop: 0 }}>
            Activity log
          </div>
          <div className="timeline">
            {statusHistory.map((log) => (
              <div className="timeline-item" key={log._id}>
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="t-status">{log.toStatus.replace('_', ' ')}</div>
                  <div className="t-meta">
                    {log.changedBy?.name} · {fmt(log.createdAt)}
                  </div>
                  {log.note && <div className="t-note">{log.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
