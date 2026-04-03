import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { http } from '../api/http';
import { useAuth } from '../auth/AuthProvider';
import { computeSLA, formatDuration, SLA_HOURS } from '../utils/sla';

const STATUSES = ['', 'Pending', 'In Progress', 'Escalated'];
const API_BASE = import.meta.env.VITE_API_URL || '';

function resolveAttachmentUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url}`;
}

export default function AdminManageComplaints() {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const highlightIdParam = params.get('id');
  const [highlightId, setHighlightId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');

  async function load() {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    const catTrim = (category || '').trim();
    if (catTrim) {
      if (catTrim.length === 1 && /^[A-Za-z]$/.test(catTrim)) {
        params.set('categoryStartsWith', catTrim);
      } else {
        params.set('category', catTrim);
      }
    }
    const qs = params.toString() ? `?${params.toString()}` : '';

    const data = await http.get(`/api/complaints${qs}`, { token });
    setComplaints(data.complaints || []);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setError('');
        setLoading(true);
        await load();
      } catch (e) {
        if (!active) return;
        setError(e.message || 'Failed to load complaints');
      } finally {
        if (active) setLoading(false);
      }
    })();

    const id = setInterval(() => {
      load().catch(() => {});
    }, 10000);

    return () => {
      active = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, status, category]);

  useEffect(() => {
    if (highlightIdParam) setHighlightId(highlightIdParam);
  }, [highlightIdParam]);

  useEffect(() => {
    if (!highlightId) return;
    // wait for rows to render
    const el = document.getElementById(`complaint-row-${highlightId}`);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // clear highlight after a short delay
      const t = setTimeout(() => setHighlightId(null), 4000);
      return () => clearTimeout(t);
    }
  }, [highlightId, complaints]);

  async function updateStatus(id, nextStatus) {
    try {
      setError('');
      const data = await http.patch(`/api/complaints/${id}/status`, { status: nextStatus }, { token });
      setComplaints((prev) => prev.map((c) => (c._id === id ? data.complaint : c)));
    } catch (e) {
      setError(e.message || 'Failed to update status');
    }
  }

  const rows = useMemo(
    () => complaints.filter((c) => (c.status || '').toLowerCase() !== 'resolved'),
    [complaints]
  );

  return (
    <div className="stack">
      <div className="card">
        <div className="row space">
          <h2>Manage Complaints</h2>
          <button type="button" onClick={() => load().catch(() => {})}>Refresh</button>
        </div>

        <div className="grid2">
          <label>
            Filter by Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s || 'all'} value={s}>{s || 'All'}</option>
              ))}
            </select>
          </label>
          <label>
            Filter by Category
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Type Alphabet (a-z)" />
          </label>
        </div>

        {error ? <div className="error">{error}</div> : null}

        {loading ? (
          <div className="muted">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="muted">No complaints found.</div>
        ) : (
          <div className="tableWrap">
            <table className="table admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>User</th>
                  <th>SLA</th>
                  <th>Status</th>
                  <th>Attachment</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c._id} id={`complaint-row-${c._id}`} style={c._id === highlightId ? { background: '#fff7d600', transition: 'background 0.3s' } : undefined}>
                    <td>{c.title}</td>
                    <td>{c.category}</td>
                    <td>{c.user?.email || '—'}</td>
                    <td>
                      {c.createdAt ? (() => {
                        const statusForSla = (c.status || '');
                        const JUST_NOW_MS = 5 * 60 * 1000;
                        // compute elapsed first (independent of SLA length) so we can decide which SLA to apply
                        const { elapsedMs: _elapsedOnly } = computeSLA(c, SLA_HOURS);
                        if (statusForSla === 'Pending' && _elapsedOnly < JUST_NOW_MS) {
                          return <div className="muted">Just now</div>;
                        }
                        const slaForStatus = statusForSla === 'In Progress' ? 72 : statusForSla === 'Escalated' ? 168 : (statusForSla === 'Pending' ? 24 : SLA_HOURS);
                        const { elapsedMs, remainingMs, slaMs, overdue } = computeSLA(c, slaForStatus);
                        if (overdue) {
                          return <span className="badge badge-overdue">Overdue</span>;
                        }
                        return (
                          <div>
                            <div className="muted">Time : {formatDuration(remainingMs)}</div>
                          </div>
                        );
                      })() : <span className="muted">—</span>}
                    </td>
                    <td><span className={`badge badge-${(c.status || '').toLowerCase().replace(/\s/g, '-')}`}>{c.status}</span></td>
                    <td>
                      {c.attachment ? (
                        <a href={resolveAttachmentUrl(c.attachment)} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', textDecoration: 'underline' }}>
                          View
                        </a>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      <select value={c.status} onChange={(e) => updateStatus(c._id, e.target.value)}>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Escalated">Escalated</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
