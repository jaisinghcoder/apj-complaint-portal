import { useEffect, useState } from 'react';
import { http } from '../api/http';
import { useAuth } from '../auth/AuthProvider';

const STATUSES = ['Open', 'Pending', 'Closed'];

export default function AdminSupport() {
  const { token, user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    const data = await http.get('/api/support', { token });
    setTickets(data.tickets || []);
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
        setError(e.message || 'Failed to load tickets');
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
  }, [token]);

  if (user?.role !== 'admin') {
    return <div className="card">You do not have permission to view this page.</div>;
  }

  async function updateTicket(id, status, reply) {
    try {
      setError('');
      const data = await http.patch(`/api/support/${id}/status`, { status, reply }, { token });
      setTickets((prev) => prev.map((t) => (t._id === id ? data.ticket : t)));
    } catch (e) {
      setError(e.message || 'Failed to update ticket');
    }
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="row space">
          <h2>Admin: Manage Support Tickets</h2>
          <button type="button" onClick={() => load().catch(() => {})}>Refresh</button>
        </div>

        {error ? <div className="error">{error}</div> : null}

        {loading ? (
          <div className="muted">Loading…</div>
        ) : tickets.length === 0 ? (
          <div className="muted">No tickets found.</div>
        ) : (
          <div className="tableWrap">
            <table className="table admin-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>User</th>
                  <th>Status</th>
                  <th>Message</th>
                  <th>Reply / Update</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <AdminSupportRow key={t._id} ticket={t} onUpdate={updateTicket} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminSupportRow({ ticket, onUpdate }) {
  const [status, setStatus] = useState(ticket.status || 'Open');
  const [reply, setReply] = useState(ticket.reply || '');
  const [saving, setSaving] = useState(false);

  return (
    <tr>
      <td>{ticket.subject}</td>
      <td>{ticket.category || 'General'}</td>
      <td>{ticket.user?.email || '—'}</td>
      <td><span className={`badge badge-${(ticket.status || '').toLowerCase().replace(/\s/g, '-')}`}>{ticket.status}</span></td>
      <td style={{ maxWidth: 300, whiteSpace: 'pre-wrap' }}>{ticket.message}</td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} maxLength={4000} />
          <div>
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await onUpdate(ticket._id, status, reply);
                } finally {
                  setSaving(false);
                }
              }}
            >
              Save
            </button>
          </div>
          {ticket.reply && (
            <div className="muted">Last reply: {ticket.reply}</div>
          )}
        </div>
      </td>
    </tr>
  );
}
