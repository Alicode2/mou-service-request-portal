import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, User, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import client from '../api/client';
import { StatusBadge, PriorityBadge } from './Badges';

const STATUS_OPTIONS = ['pending', 'assigned', 'in_progress', 'completed', 'closed', 'rejected'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];

function shortId(id) {
  return `#${id.slice(-6).toUpperCase()}`;
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function RequestTicketList({ showSubmitter = false, emptyTitle, emptyBody, refreshKey = 0 }) {
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 8 };
      if (search) params.search = search;
      if (status) params.status = status;
      if (priority) params.priority = priority;
      const res = await client.get('/requests', { params });
      setRequests(res.data.requests);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, priority]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests, refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [search, status, priority]);

  return (
    <div>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search title, description, location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">All priorities</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading requests…</div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <Search size={22} style={{ marginBottom: 10, opacity: 0.5 }} />
          <h3>{emptyTitle || 'No requests found'}</h3>
          <p>{emptyBody || 'Try adjusting your filters.'}</p>
        </div>
      ) : (
        <>
          {requests.map((r) => (
            <Link key={r._id} to={`/requests/${r._id}`} className="ticket">
              <div className="ticket-id">{shortId(r._id)}</div>
              <div className="ticket-body">
                <div className="ticket-top">
                  <span className="ticket-title">{r.title}</span>
                  <StatusBadge status={r.status} />
                </div>
                <div className="ticket-meta">
                  <span>
                    <MapPin size={12} /> {r.location}
                  </span>
                  <span>{r.category?.name}</span>
                  <span>
                    <PriorityBadge priority={r.priority} /> priority
                  </span>
                  {showSubmitter && r.submittedBy && (
                    <span>
                      <User size={12} /> {r.submittedBy.name}
                    </span>
                  )}
                  <span>
                    <Clock size={12} /> {timeAgo(r.createdAt)}
                  </span>
                </div>
              </div>
            </Link>
          ))}

          <div className="pagination">
            <span>
              {pagination.total} request{pagination.total === 1 ? '' : 's'} · page {pagination.page} of{' '}
              {pagination.totalPages}
            </span>
            <div className="controls">
              <button
                className="btn btn-outline btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                className="btn btn-outline btn-sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
