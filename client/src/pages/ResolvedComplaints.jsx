import { useEffect, useState } from 'react';
import { http } from '../api/http';
import { useAuth } from '../auth/AuthProvider';

const API_BASE = import.meta.env.VITE_API_URL || '';

function resolveAttachmentUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url}`;
}

export default function ResolvedComplaints() {
  const { user, token } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      if (!user || user.role !== 'admin') return;

      try {
        setError('');
        setLoading(true);
        const data = await http.get('/api/complaints?status=Resolved', { token });
        if (!active) return;
        setComplaints(data.complaints || []);
      } catch (e) {
        if (!active) return;
        setError(e.message || 'Failed to load complaints');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [token, user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="card">
        <div className="muted">Access denied.</div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="row space">
          <h2>Resolved Complaints</h2>
        </div>

        {error ? <div className="error">{error}</div> : null}

        {loading ? (
          <div className="muted">Loading…</div>
        ) : complaints.length === 0 ? (
          <div className="muted">No resolved complaints found.</div>
        ) : (
          <div className="tableWrap">
            <table className="table admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>User</th>
                  <th>Attachment</th>
                  <th>Resolved At</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c._id}>
                    <td>{c.title}</td>
                    <td>{c.category}</td>
                    <td>{c.user?.email || '—'}</td>
                    <td>
                      {c.attachment ? (
                        <a
                          href={resolveAttachmentUrl(c.attachment)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#0066cc', textDecoration: 'underline' }}
                        >
                          View
                        </a>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>{c.updatedAt ? new Date(c.updatedAt).toLocaleString() : '—'}</td>
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
