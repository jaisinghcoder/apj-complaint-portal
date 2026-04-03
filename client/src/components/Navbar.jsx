import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useTheme } from '../auth/ThemeProvider';
import { http } from '../api/http';
import '../styles/Navbar.css';

export function Navbar() {
  const { user, logout, token } = useAuth();
  const [navAvatarColor, setNavAvatarColor] = useState(null);
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resolvedComplaints, setResolvedComplaints] = useState([]);
  const [escalatedComplaints, setEscalatedComplaints] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);
  const [systemNotifications, setSystemNotifications] = useState([]);
  const [seenNotifIds, setSeenNotifIds] = useState([]);
  const [seenTick, setSeenTick] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const lastSeenAt = useMemo(() => {
    // Ensure we re-run this memo when the badge has been cleared
    // (seenTick is a mechanism to force recompute without using state)
    const _tick = seenTick;

    if (!user || typeof window === 'undefined') return 0;
    const key = `resolvedSeenAt:${user.id}`;
    const raw = window.localStorage.getItem(key);
    return raw ? Number(raw) || 0 : 0;
  }, [user, seenTick]);

  const isAdmin = user?.role === 'admin';
  const showAuthLinks = !user && (location.pathname === '/login' || location.pathname === '/register');
  const resolvedNavPath = isAdmin ? '/resolved-complaints' : '/my-complaints';

  const getResolvedSeenKey = useCallback(() => {
    if (!user) return null;
    return `resolvedSeenAt:${user.id}`;
  }, [user]);

  const getSeenIdsKey = useCallback(() => {
    if (!user) return null;
    return `notifSeen:${user._id || user.id}`;
  }, [user]);

  const storeLastSeenAt = useCallback(
    (value) => {
      const key = getResolvedSeenKey();
      if (!key || typeof window === 'undefined') return;
      window.localStorage.setItem(key, String(value));
    },
    [getResolvedSeenKey]
  );

  useEffect(() => {
    let active = true;

    const loadResolvedComplaints = async () => {
      if (!user || !token) return;

      try {
        const data = await http.get('/api/complaints?status=Resolved', { token });
        if (!active) return;
        setResolvedComplaints(data.complaints || []);
      } catch {
        // ignore; keep previous complaints
      }
    };

    const loadEscalatedComplaints = async () => {
      if (!user || !token) return;
      try {
        const data = await http.get('/api/complaints?status=Escalated', { token });
        if (!active) return;
        setEscalatedComplaints(data.complaints || []);
      } catch {
        // ignore
      }
    };

    loadResolvedComplaints();
    loadEscalatedComplaints();

    return () => {
      active = false;
    };
  }, [token, user, location.pathname]);

  useEffect(() => {
    let active = true;

    const loadSystemNotifications = async () => {
      if (!user || !token) return;
      try {
        const data = await http.get('/api/notifications', { token });
        if (!active) return;
        setSystemNotifications(data.notifications || []);
      } catch {
        // ignore
      }
    };

    loadSystemNotifications();

    const loadAllComplaints = async () => {
      if (!user || !token || !isAdmin) return;
      try {
        const data = await http.get('/api/complaints', { token });
        if (!active) return;
        setAllComplaints(data.complaints || []);
      } catch {
        // ignore
      }
    };

    loadAllComplaints();

    return () => {
      active = false;
    };
  }, [token, user]);

  useEffect(() => {
    if (!notifOpen) return;

    const onClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [notifOpen]);

  useEffect(() => {
    try {
      if (user?._id && typeof window !== 'undefined') {
        const key = `avatarColor:${user._id}`;
        const c = window.localStorage.getItem(key);
        if (c) setNavAvatarColor(c);
      }
    } catch (e) {}
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

  const resolvedAvatarUrl = user?.avatar
    ? (() => {
        const s = String(user.avatar || '');
        if (/^(https?:|\/\/|data:|blob:)/i.test(s)) return s;
        return `${import.meta.env.VITE_API_URL || ''}${s}`;
      })()
    : null;

  const unseenResolvedCount = useMemo(() => {
    const combined = isAdmin ? [...allComplaints, ...systemNotifications] : [...escalatedComplaints, ...resolvedComplaints, ...systemNotifications];
    return combined.filter((c) => {
      if (!c) return false;
      if (c._id && seenNotifIds.includes(c._id)) return false;
      const updatedAt = c.updatedAt || c.createdAt;
      if (!updatedAt) return false;
      return new Date(updatedAt).getTime() > lastSeenAt;
    }).length;
  }, [escalatedComplaints, resolvedComplaints, systemNotifications, allComplaints, lastSeenAt, isAdmin, seenNotifIds]);

  const recentNotifications = useMemo(() => {
    const source = isAdmin ? [...systemNotifications, ...allComplaints] : [...systemNotifications, ...escalatedComplaints, ...resolvedComplaints];
    return source
      .sort((a, b) => {
        const aDate = new Date(a.updatedAt || a.createdAt).getTime();
        const bDate = new Date(b.updatedAt || b.createdAt).getTime();
        return bDate - aDate;
      })
      .slice(0, 10);
  }, [systemNotifications, escalatedComplaints, resolvedComplaints, allComplaints, isAdmin]);

  const isNotificationNew = (c) => {
    if (!c) return false;
    if (c._id && seenNotifIds.includes(c._id)) return false;
    const updatedAt = c.updatedAt || c.createdAt;
    if (!updatedAt) return false;
    return new Date(updatedAt).getTime() > lastSeenAt;
  };

  const formatNotificationTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const markAllResolvedAsRead = () => {
    const now = Date.now();
    storeLastSeenAt(now);
    setSeenTick(now);
    // also mark all current notifications as seen (for admins)
    try {
      if (isAdmin) {
        const ids = (allComplaints || []).map((c) => c._id).filter(Boolean);
        const next = Array.from(new Set([...(seenNotifIds || []), ...ids]));
        setSeenNotifIds(next);
        storeSeenIds(next);
      }
    } catch (e) {}
  };

  const handleNavClick = (path) => {
    if (path === resolvedNavPath) {
      markAllResolvedAsRead();
    }
    navigate(path);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
    setSidebarOpen(false);
  };

  return (
    <>
      <header className="topbar">
        <div className="topbarInner">
          {user && (
            <button
              className="menuToggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
              aria-expanded={sidebarOpen}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          )}
          <Link className="brandWrap" to={user ? '/dashboard' : '/'}>
            <img className="brandLogo" src="apj-Photoroom.png" alt="APJ" />
            <span className="brand">APJ COMPLAINT PORTAL</span>
          </Link>
          <nav className="nav">
            {user ? (
              <>
              <div className="notificationWrapper" ref={notifRef}>
                <button
                  className="notificationBtn"
                  onClick={() => setNotifOpen((prev) => !prev)}
                  title="View resolved complaints"
                  aria-label="View resolved complaints"
                  aria-haspopup="menu"
                  aria-expanded={notifOpen}
                >
                  <img className = "notificationicon"src="icons8-bell-48.png" alt="APJ" height="24" width="24" />
                  {unseenResolvedCount > 0 ? (
                    <span className="notificationBadge">{unseenResolvedCount}</span>
                  ) : null}
                </button>

                {notifOpen && (
                  <div className="notificationPanel" role="menu" aria-label="Notifications">
                    <div className="notificationPanelHeader">
                      <span>Notifications</span>
                      <button
                        type="button"
                        className="notificationPanelMarkAll"
                        onClick={markAllResolvedAsRead}
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="notificationPanelList">
                      {recentNotifications.length === 0 ? (
                        <div className="notificationPanelEmpty">No notifications</div>
                      ) : (
                        recentNotifications.map((c) => (
                          <button
                            key={c._id}
                            type="button"
                            className="notificationItem"
                              onClick={() => {
                                if (isAdmin && c._id) {
                                  markNotificationSeen(c._id);
                                  navigate(`/admin/manage-complaints?id=${c._id}`);
                                  setNotifOpen(false);
                                } else {
                                  if (c._id) markNotificationSeen(c._id);
                                  handleNavClick('/my-complaints');
                                  setNotifOpen(false);
                                }
                              }}
                          >
                            <div>
                              <span className="notificationItemTitle">{c.title}</span>
                            </div>
                            <div className="notificationItemMeta">
                              <span className="notificationItemTime">{formatNotificationTime(c.updatedAt || c.createdAt)}</span>
                              {c.message ? <div className="notificationMessage">{c.message}</div> : null}
                              <div className="notificationBadges">
                                {c.status ? (
                                  c.status === 'Escalated' ? (
                                    <span className="notificationBadge escalated">Escalated</span>
                                  ) : c.status === 'Resolved' ? (
                                    <span className="notificationBadge resolved">Resolved</span>
                                  ) : null
                                ) : c.level === 'maintenance' ? (
                                  <span className="notificationBadge maintenance">Maintenance</span>
                                ) : c.level ? (
                                  <span className={`notificationBadge ${c.level}`}>{c.level}</span>
                                ) : null}
                                {isNotificationNew(c) && <span className="notificationItemBadge">New</span>}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    <button
                      type="button"
                      className="notificationPanelViewAll"
                      onClick={() => {
                        handleNavClick(resolvedNavPath);
                        setNotifOpen(false);
                      }}
                    >
                      View all
                    </button>
                  </div>
                )}
              
              </div>
              
              <button
                type="button"
                className="navProfile"
                onClick={() => handleNavClick('/profile')}
                title={user?.name || 'Profile'}
              >
                <div className="navAvatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: navAvatarColor || 'var(--profile-placeholder-bg)', color: 'var(--text)' }}>
                  {resolvedAvatarUrl ? (
                    <img src={resolvedAvatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" fill="#ffffff" />
                      <path d="M4 20c0-2.667 4-4 8-4s8 1.333 8 4v1H4v-1z" fill="#ffffff" />
                    </svg>
                  )}
                </div>
                <span className="profileName">{user?.name || user?.email || (user?.role === 'admin' ? 'Admin' : 'User')}</span>
              </button>
              
              <button
                type="button"
                className="themeToggle"
                onClick={toggleTheme}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-label="Toggle theme"
              >
                {isDark ? <IconSun /> : <IconMoon />}
              </button>
            </>
            ) : showAuthLinks ? (
              <>
                <button
                  type="button"
                  className="themeToggle"
                  onClick={toggleTheme}
                  title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  aria-label="Toggle theme"
                >
                  {isDark ? <IconSun /> : <IconMoon />}
                </button>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="themeToggle"
                  onClick={toggleTheme}
                  title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  aria-label="Toggle theme"
                >
                  {isDark ? <IconSun /> : <IconMoon />}
                </button>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Sidebar Menu */}
      {user && (
        <>
          <div
            className={`sidebarOverlay ${sidebarOpen ? 'open' : ''}`}
            onClick={() => setSidebarOpen(false)}
          ></div>
          <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="sidebarHeader">
              <h2>Menu</h2>
              <button
                className="closeBtn"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <nav className="sidebarNav">
              <button
                  className="sidebarItem"
                  onClick={() => handleNavClick('/profile')}
              >
                <IconProfile />
                Profile
              </button>
              <button
                className="sidebarItem"
                onClick={() => handleNavClick('/dashboard')}
              >
                <IconDashboard />
                Dashboard
              </button>
              {isAdmin && (
                <>
                  <button
                    className="sidebarItem"
                    onClick={() => handleNavClick('/admin/manage-complaints')}
                  >
                    <IconResolved />
                    Manage Complaints
                  </button>
                  <button
                    className="sidebarItem"
                    onClick={() => handleNavClick('/resolved-complaints')}
                  >
                    <IconResolved />
                    Resolved Complaints
                  </button>
                  <button
                    className="sidebarItem"
                    onClick={() => handleNavClick('/admin/support')}
                  >
                    <IconSupport />
                    Support
                  </button>
                </>
              )}
              {!isAdmin && (
              <>
                <button
                  className="sidebarItem"
                  onClick={() => handleNavClick('/register-complaint')}
                >
                  <IconRegister />
                  Register Complaint
                </button>
                <button
                  className="sidebarItem"
                  onClick={() => handleNavClick('/track-complaint')}
                >
                  <IconTrack />
                  Track Complaint
                </button>
                <button
                  className="sidebarItem"
                  onClick={() => handleNavClick('/my-complaints')}
                >
                  <IconList />
                  My Complaints
                </button>
                <button
                  className="sidebarItem"
                  onClick={() => handleNavClick('/support')}
                >
                  <IconSupport />
                  Support
                </button>
              </>
            )}
            </nav>
            <div className="sidebarFooter">
              <button className="logoutBtn" onClick={handleLogout}>
                 Logout
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

/* Inline SVG icons used in the sidebar to replace emoji */
function IconProfile() {
  return (
    <svg className="sidebarIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 20c0-3.3137 2.6863-6 6-6h4c3.3137 0 6 2.6863 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDashboard() {
  return (
    <svg className="sidebarIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="3" y="11" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="10" y="7" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="17" y="3" width="4" height="18" rx="1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconResolved() {
  return (
    <svg className="sidebarIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconRegister() {
  return (
    <svg className="sidebarIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M3 21v-3a4 4 0 0 1 4-4h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.5 6.5l3 3L7 20l-3-3 10.5-10.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTrack() {
  return (
    <svg className="sidebarIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="11" cy="11" r="5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconList() {
  return (
    <svg className="sidebarIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M8 6h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 12h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 18h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="3.5" cy="6" r="1" fill="currentColor" />
      <circle cx="3.5" cy="12" r="1" fill="currentColor" />
      <circle cx="3.5" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

function IconSupport() {
  return (
    <svg className="sidebarIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 2a7 7 0 00-7 7v3a3 3 0 003 3h1v3l3-2v-1h2a3 3 0 003-3V9a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 11h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSun() {
  return (
    <svg className="themeIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 2v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 20v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4.93 4.93l1.41 1.41" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17.66 17.66l1.41 1.41" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M2 12h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 12h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4.93 19.07l1.41-1.41" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg className="themeIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
