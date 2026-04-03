import { useEffect, useMemo, useState } from 'react';
import { http } from '../api/http';
import { useAuth } from '../auth/AuthProvider';

const CATEGORIES = ['Electricity', 'Water Supply', 'College Facilities', 'Other'];
const API_BASE = import.meta.env.VITE_API_URL || '';

function resolveAttachmentUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url}`;
}

export default function MyComplaints() {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    const data = await http.get('/api/complaints', { token });
    setComplaints(data.complaints || []);
  }

  const updateComplaintInState = (complaint) => {
    setComplaints((prev) => prev.map((c) => (c._id === complaint._id ? complaint : c)));
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    const filled = '★'.repeat(rating);
    const empty = '☆'.repeat(5 - rating);
    return <span style={{ color: '#d69e2e' }}>{filled + empty}</span>;
  };

  async function submitRating(complaint) {
    const ratingInput = window.prompt(
      'Rate this resolved complaint (1-5):',
      complaint.rating ?? ''
    );
    if (ratingInput === null) return;

    const rating = ratingInput.trim() === '' ? undefined : Number(ratingInput);
    if (rating === undefined) return;

    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
      alert('Rating must be a number between 1 and 5.');
      return;
    }

    try {
      const data = await http.patch(
        `/api/complaints/${complaint._id}/feedback`,
        { rating },
        { token }
      );
      updateComplaintInState(data.complaint);
      alert('Rating saved.');
    } catch (e) {
      alert(e.message || 'Failed to save rating');
    }
  }

  async function submitFeedback(complaint) {
    const feedbackInput = window.prompt(
      'Leave feedback (optional):',
      complaint.feedback || ''
    );
    if (feedbackInput === null) return;

    const feedback = feedbackInput.trim();
    if (!feedback) return;

    try {
      const data = await http.patch(
        `/api/complaints/${complaint._id}/feedback`,
        { feedback },
        { token }
      );
      updateComplaintInState(data.complaint);
      alert('Feedback submitted.');
    } catch (e) {
      alert(e.message || 'Failed to submit feedback');
    }
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
  }, [token]);

  const rows = useMemo(() => complaints, [complaints]);

  return (
    <div className="stack">
      <div className="card">
        <div className="row space">
          <h2>Your Complaint History</h2>
          <button type="button" onClick={() => load().catch(() => {})}>Refresh</button>
        </div>

        {loading ? (
          <div className="muted">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="muted">No complaints yet.</div>
        ) : (
          <div className="tableWrap">
            <table className="table user-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Attachment</th>
                  <th>Created</th>
                  <th>Rating</th>
                  <th>Feedback</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c._id}>
                    <td>{c.title}</td>
                    <td>{c.category}</td>
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
                    <td>{new Date(c.createdAt).toLocaleString()}</td>
                    <td>
                      {c.status === 'Resolved' ? (
                        c.rating ? (
                          renderStars(c.rating)
                        ) : (
                          <button type="button" onClick={() => submitRating(c)}>
                            Rate
                          </button>
                        )
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      {c.status === 'Resolved' ? (
                        c.feedback ? (
                          <span className="muted">Submitted</span>
                        ) : (
                          <button type="button" onClick={() => submitFeedback(c)}>
                            Leave feedback
                          </button>
                        )
                      ) : (
                        <span className="muted">—</span>
                      )}
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
