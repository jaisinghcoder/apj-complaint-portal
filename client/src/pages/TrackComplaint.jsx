import { useEffect, useState } from 'react';
import { http } from '../api/http';
import { useAuth } from '../auth/AuthProvider';
import { computeSLA, formatDuration, SLA_HOURS } from '../utils/sla';

const API_BASE = import.meta.env.VITE_API_URL || '';

function SlaInfo({ item }) {
  if (!item || !item.createdAt) return null;
  const statusForSla = (item.status || '');
  const JUST_NOW_MS = 5 * 60 * 1000;
  const { elapsedMs: _elapsedOnly } = computeSLA(item, SLA_HOURS);
  if (statusForSla === 'Pending' && _elapsedOnly < JUST_NOW_MS) {
    return <span className="complaintMeta">Just now</span>;
  }
  const slaForStatus = statusForSla === 'In Progress' ? 72 : statusForSla === 'Escalated' ? 168 : (statusForSla === 'Pending' ? 24 : SLA_HOURS);
  const { elapsedMs, remainingMs, slaMs, overdue } = computeSLA(item, slaForStatus);
  if (overdue) {
    return <span className="complaintMeta" style={{ color: '#ff5c5c' }}>Overdue</span>;
  }
  return <span className="complaintMeta">Time to SLA: {formatDuration(remainingMs)}</span>;
}

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
  const [escalatedComplaints, setEscalatedComplaints] = useState([]);
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
      const [pendingResp, inProgressResp, escalatedResp] = await Promise.all([
        http.get('/api/complaints?status=Pending', { token }),
        http.get('/api/complaints?status=In%20Progress', { token }),
        http.get('/api/complaints?status=Escalated', { token }),
      ]);

      setPendingComplaints(pendingResp.complaints || []);
      setInProgressComplaints(inProgressResp.complaints || []);
      setEscalatedComplaints(escalatedResp.complaints || []);
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

        {(pendingComplaints.length > 0 || inProgressComplaints.length > 0 || escalatedComplaints.length > 0) && (
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
                        <SlaInfo item={c} />
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
                        <SlaInfo item={c} />
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

            {escalatedComplaints.length > 0 && (
              <div className="complaintSection">
                <h3>Escalated</h3>
                <ul className="complaintList">
                  {escalatedComplaints.map((c) => (
                    <li key={c._id} className="complaintItem">
                      <div className="complaintInfo">
                        <strong>{c.title}</strong>
                        <span className="complaintMeta">{new Date(c.createdAt).toLocaleDateString()}</span>
                        <SlaInfo item={c} />
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
              <div><strong>SLA:</strong> <SlaInfo item={complaint} /></div>
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
