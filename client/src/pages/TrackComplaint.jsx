import { useEffect, useState } from 'react';
import { http } from '../api/http';
import { useAuth } from '../auth/AuthProvider';

const API_BASE = import.meta.env.VITE_API_URL || '';

function resolveAttachmentUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url}`;
}

export default function TrackComplaint() {
  const { token } = useAuth();
  const [complaintId, setComplaintId] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [pendingComplaints, setPendingComplaints] = useState([]);
  const [inProgressComplaints, setInProgressComplaints] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState('');

  async function loadComplaintById(id) {
    if (!id) return;

    try {
      setLoading(true);
      setError('');
      setComplaint(null);

      const data = await http.get(`/api/complaints/${id}`, { token });
      setComplaint(data.complaint);
    } catch (e) {
      setError(e.message || 'Failed to track complaint');
    } finally {
      setLoading(false);
    }
  }

  async function trackComplaint(e) {
    e.preventDefault();
    if (!complaintId.trim()) return;
    await loadComplaintById(complaintId.trim());
  }

  async function fetchVisibleComplaints() {
    if (!token) return;

    setLoadingList(true);
    setListError('');

    try {
      const [pendingResp, inProgressResp] = await Promise.all([
        http.get('/api/complaints?status=Pending', { token }),
        http.get('/api/complaints?status=In%20Progress', { token }),
      ]);

      setPendingComplaints(pendingResp.complaints || []);
      setInProgressComplaints(inProgressResp.complaints || []);
    } catch (e) {
      setListError(e.message || 'Failed to load complaints');
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    fetchVisibleComplaints();
  }, [token]);

  return (
    <div className="container">
      <div className="card">


        {loadingList && <div style={{ marginTop: '1rem' }}>Loading your complaints…</div>}
        {listError && <div className="error" style={{ marginTop: '1rem' }}>{listError}</div>}

        {(pendingComplaints.length > 0 || inProgressComplaints.length > 0) && (
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h2>Your active complaints</h2>
            {pendingComplaints.length > 0 && (
              <div className="complaintSection">
                <h3>Pending</h3>
                <ul className="complaintList">
                  {pendingComplaints.map((c) => (
                    <li key={c._id} className="complaintItem">
                      <div className="complaintInfo">
                        <strong>{c.title}</strong>
                        <span className="complaintMeta">{new Date(c.createdAt).toLocaleDateString()}</span>
                        <span className={`badge badge-${(c.status || '').toLowerCase().replace(/\s/g, '-')}`}>{c.status}</span>
                      </div>
                      <div className="complaintActions">
                        <button
                          type="button"
                          onClick={() => {
                            setComplaintId(c._id);
                            loadComplaintById(c._id);
                          }}
                        >
                          View
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {inProgressComplaints.length > 0 && (
              <div className="complaintSection">
                <h3>In Progress</h3>
                <ul className="complaintList">
                  {inProgressComplaints.map((c) => (
                    <li key={c._id} className="complaintItem">
                      <div className="complaintInfo">
                        <strong>{c.title}</strong>
                        <span className="complaintMeta">{new Date(c.createdAt).toLocaleDateString()}</span>
                        <span className={`badge badge-${(c.status || '').toLowerCase().replace(/\s/g, '-')}`}>{c.status}</span>
                      </div>
                      <div className="complaintActions">
                        <button
                          type="button"
                          onClick={() => {
                            setComplaintId(c._id);
                            loadComplaintById(c._id);
                          }}
                        >
                          View
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {complaint && (
          <div className="card" style={{ marginTop: '2rem' }}>
            <h2>Complaint Details</h2>
            <div className="stack">
              <div><strong>Title:</strong> {complaint.title}</div>
              <div><strong>Category:</strong> {complaint.category}</div>
              <div><strong>Status:</strong> <span className={`badge badge-${(complaint.status || '').toLowerCase().replace(/\s/g, '-')}`}>{complaint.status}</span></div>
              <div><strong>Description:</strong> {complaint.description}</div>
              {complaint.attachment && (
                <div><strong>Attachment:</strong> <a href={resolveAttachmentUrl(complaint.attachment)} target="_blank" rel="noopener noreferrer">View</a></div>
              )}
              <div><strong>Created:</strong> {new Date(complaint.createdAt).toLocaleString()}</div>
              {complaint.history && complaint.history.length > 0 && (
                <div>
                  <strong>History:</strong>
                  <ul>
                    {complaint.history.map((h, i) => (
                      <li key={i}>
                        {h.from ? `${h.from} → ${h.to}` : `Created as ${h.to}`} 
                        {h.note && ` (${h.note})`} 
                        on {new Date(h.changedAt).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
