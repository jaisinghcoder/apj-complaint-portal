import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { http } from '../api/http';

function SvgRegister() {
  return (
    <svg className="cardIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M3 21v-3a4 4 0 0 1 4-4h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.5 6.5l3 3L7 20l-3-3L14.5 6.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SvgList() {
  return (
    <svg className="cardIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M8 6h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 12h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 18h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="3.5" cy="6" r="1" fill="currentColor" />
      <circle cx="3.5" cy="12" r="1" fill="currentColor" />
      <circle cx="3.5" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

function SvgTrack() {
  return (
    <svg className="cardIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="11" cy="11" r="5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SvgProfile() {
  return (
    <svg className="cardIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 20c0-3.3137 2.6863-6 6-6h4c3.3137 0 6 2.6863 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function UserDashboard() {
  const { user, token } = useAuth();
  const location = useLocation();
  const [success, setSuccess] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [seenNotifIds, setSeenNotifIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getSeenIdsKey = useCallback(() => {
    if (!user) return null;
    return `notifSeen:${user._id || user.id}`;
  }, [user]);

  useEffect(() => {
    try {
      const key = getSeenIdsKey();
      if (!key || typeof window === 'undefined') return;
      const raw = window.localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      setSeenNotifIds(Array.isArray(arr) ? arr : []);
    } catch (e) {
      setSeenNotifIds([]);
    }
  }, [getSeenIdsKey]);

  const storeSeenIds = (ids) => {
    try {
      const key = getSeenIdsKey();
      if (!key || typeof window === 'undefined') return;
      window.localStorage.setItem(key, JSON.stringify(ids));
    } catch (e) {}
  };

  const markNotificationSeen = (id) => {
    if (!id) return;
    setSeenNotifIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      storeSeenIds(next);
      return next;
    });
  };

  useEffect(() => {
    // Show a one-time toast when navigated from registration
    try {
      if (location && location.state && location.state.registered) {
        setSuccess('Registered successfully');
        // clear history state to avoid re-showing on refresh
        try { window.history.replaceState({}, document.title); } catch (e) {}
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (e) {}

    let active = true;
    (async () => {
      try {
        setLoading(true);
        const [cResp, nResp] = await Promise.all([
          http.get('/api/complaints', { token }),
          http.get('/api/notifications', { token }).catch(() => ({ notifications: [] })),
        ]);
        if (!active) return;
        setComplaints(cResp.complaints || []);
        setNotifications(nResp.notifications || []);
      } catch (e) {
        // ignore error; show empty state
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [token]);

  const stats = useMemo(() => {
    const s = { total: 0, pending: 0, resolved: 0, escalated: 0 };
    complaints.forEach((c) => {
      s.total += 1;
      const st = (c.status || '').toLowerCase();
      if (st.includes('pending')) s.pending += 1;
      else if (st.includes('resolved')) s.resolved += 1;
      else if (st.includes('escalated')) s.escalated += 1;
    });
    return s;
  }, [complaints]);

  const recent = useMemo(() => complaints.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5), [complaints]);

  // Simple donut segments for resolved/pending/escalated/other
  const donut = useMemo(() => {
    const { total, pending, resolved, escalated } = stats;
    const other = Math.max(0, total - (pending + resolved + escalated));
    const segments = [resolved, pending, escalated, other];
    const colors = ['#2f855a', '#f59e0b', '#e53e3e', '#4a5568'];
    const totalSum = Math.max(1, segments.reduce((a, b) => a + b, 0));
    let acc = 0;
    const arcs = segments.map((v, i) => {
      const start = acc / totalSum;
      acc += v;
      const end = acc / totalSum;
      return { start, end, color: colors[i], value: v };
    });
    return arcs;
  }, [stats]);

  const combinedNotifications = useMemo(() => {
    return [...(notifications || []), ...(complaints || [])]
      .map((n) => {
        // normalize complaint and notification shapes
        if (n && n.title && n.message !== undefined) return { ...n, _type: 'system' };
        return { _id: n._id, title: n.title || n.title, message: n.message || '', status: n.status, updatedAt: n.updatedAt || n.createdAt, _type: 'complaint' };
      })
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  }, [notifications, complaints]);

  const unreadCount = useMemo(() => {
    return combinedNotifications.filter((n) => n && n._id && !seenNotifIds.includes(n._id)).length;
  }, [combinedNotifications, seenNotifIds]);

  const handleNotificationClick = (n) => {
    if (!n) return;
    markNotificationSeen(n._id);
    if (n._type === 'complaint' || n.status) {
      // go to user's complaint list or specific complaint
      navigate(`/my-complaints`);
    } else {
      // system notification - just mark read
    }
  };

  const markAllRead = () => {
    const ids = combinedNotifications.map((x) => x._id).filter(Boolean);
    const next = Array.from(new Set([...(seenNotifIds || []), ...ids]));
    setSeenNotifIds(next);
    storeSeenIds(next);
  };

  return (
    <div className="dashboardFull">
      <div className="dashboardStats">
        {success ? <div className="toast success" role="status" aria-live="polite">{success}</div> : null}
        <div className="statTile total">
          <div className="statLabel">TOTAL COMPLAINTS</div>
          <div className="statValue">{stats.total}</div>
        </div>
        <div className="statTile pending">
          <div className="statLabel">PENDING COMPLAINTS</div>
          <div className="statValue">{stats.pending}</div>
        </div>
        <div className="statTile resolved">
          <div className="statLabel">RESOLVED COMPLAINTS</div>
          <div className="statValue">{stats.resolved}</div>
        </div>
        <div className="statTile escalated">
          <div className="statLabel">ESCALATED COMPLAINTS</div>
          <div className="statValue">{stats.escalated}</div>
        </div>
      </div>

      <div className="dashboardGrid">
        <aside className="leftPanel card">
          <h2>Lodge a New Complaint</h2>
          <p className="muted">Quickly file an issue with the campus facilities.</p>
          <Link to="/register-complaint" className="btn primary" style={{ marginTop: '1rem' }}>File a Complaint</Link>
        </aside>

        <section className="chartPanel card">
          <h2>Complaint Status Overview</h2>
          <div className="donutWrap">
            <svg viewBox="0 0 42 42" className="donut" role="img" aria-label="Complaint status donut">
              <circle className="donut-ring" cx="21" cy="21" r="15.91549431" fill="transparent" stroke="#e6e6e6" strokeWidth="6"></circle>
              {donut.map((d, i) => {
                const circumference = 2 * Math.PI * 15.91549431;
                const dash = (d.end - d.start) * circumference;
                const offset = (1 - d.end) * circumference;
                return (
                  <circle
                    key={i}
                    className="donut-segment"
                    cx="21"
                    cy="21"
                    r="15.91549431"
                    fill="transparent"
                    stroke={d.color}
                    strokeWidth="6"
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={offset}
                    strokeLinecap="butt"
                  />
                );
              })}
              <g className="donut-center">
                <text x="21" y="20.5" textAnchor="middle" className="donut-center-number">{stats.total}</text>
                <text x="21" y="24.5" textAnchor="middle" className="donut-center-label">Complaints</text>
              </g>
            </svg>

            <div className="donutLegend">
              <div><span className="legendDot" style={{ background: '#2f855a' }}></span>Resolved</div>
              <div><span className="legendDot" style={{ background: '#f59e0b' }}></span>Pending</div>
              <div><span className="legendDot" style={{ background: '#e53e3e' }}></span>Escalated</div>
              <div><span className="legendDot" style={{ background: '#4a5568' }}></span>In Progress</div>
            </div>
          </div>
        </section>
      </div>

      <div className="bottomPanels">
        <div className="panel card">
          <h3>Recent Complaints</h3>
          <ul className="recentList">
            {loading ? <li className="muted">Loading…</li> : recent.length === 0 ? <li className="muted">No recent complaints.</li> : recent.map((r) => (
              <li key={r._id} className="recentItem">
                <span className="recentTitle">{r.title}</span>
                <span className={`badge badge-${(r.status || '').toLowerCase().replace(/\s/g, '-')}`}>{r.status}</span>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: '0.75rem' }}>
            <Link to="/my-complaints" className="btn">View All</Link>
          </div>
        </div>

        <div className="panel card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Notifications & Updates</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="muted">Unread: {unreadCount}</div>
              <button className="btn" onClick={markAllRead}>Mark all read</button>
            </div>
          </div>

          {combinedNotifications.length === 0 ? (
            <div className="muted">No notifications</div>
          ) : (
            <ul className="recentList">
              {combinedNotifications.slice(0, 6).map((n) => (
                <li key={n._id} className="recentItem" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleNotificationClick(n)}>
                  <div>
                    <div className="recentTitle" style={{ fontWeight: 600 }}>{n.title}</div>
                    {n.message ? <div className="muted" style={{ fontSize: '0.9rem' }}>{n.message}</div> : null}
                    <div className="muted" style={{ fontSize: '0.8rem' }}>{n.updatedAt ? new Date(n.updatedAt).toLocaleString() : ''}</div>
                  </div>
                  <div style={{ marginLeft: 12 }}>
                    {n.status ? <span className={`badge badge-${(n.status || '').toLowerCase().replace(/\s/g, '-')}`}>{n.status}</span> : n.level ? <span className={`notificationBadge ${n.level}`}>{n.level}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel card">
          <h3>News</h3>
          <p className="muted">Resolution camp scheduled for next week. Keep an eye on portal updates for more details.</p>
          <div style={{ marginTop: '0.5rem' }}>
            <img src="apj-Photoroom.png" alt="APJ" style={{ width: '100%', borderRadius: 8, backgroundColor: '#ffffff' }} />
          </div>
        </div>
      </div>
    </div>
  );
}