import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useTheme } from '../auth/ThemeProvider';
import '../styles/Navbar.css';

export function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const showAuthLinks = !user && (location.pathname === '/login' || location.pathname === '/register');

  const handleNavClick = (path) => {
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
            <img className="brandLogo" src="apj.png" alt="APJ" />
            <span className="brand">APJ COMPLAINT PORTAL</span>
          </Link>
          <nav className="nav">
            {user ? (
              <>
                <label className="themeSlider" title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
                  <input
                    type="checkbox"
                    checked={isDark}
                    onChange={toggleTheme}
                    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  />
                  <span className="slider"></span>
                </label>
              </>
            ) : showAuthLinks ? (
              <>
                <label className="themeSlider" title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
                  <input
                    type="checkbox"
                    checked={isDark}
                    onChange={toggleTheme}
                    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  />
                  <span className="slider"></span>
                </label>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            ) : (
              <>
                <label className="themeSlider" title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
                  <input
                    type="checkbox"
                    checked={isDark}
                    onChange={toggleTheme}
                    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  />
                  <span className="slider"></span>
                </label>
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
                👤 Profile
              </button>
              <button
                className="sidebarItem"
                onClick={() => handleNavClick('/dashboard')}
              >
                📊 Dashboard
              </button>
              {isAdmin && (
                <button
                  className="sidebarItem"
                  onClick={() => handleNavClick('/resolved-complaints')}
                >
                  ✅ Resolved Complaints
                </button>
              )}
              {!isAdmin && (
              <>
                <button
                  className="sidebarItem"
                  onClick={() => handleNavClick('/register-complaint')}
                >
                  📝 Register Complaint
                </button>
                <button
                  className="sidebarItem"
                  onClick={() => handleNavClick('/track-complaint')}
                >
                  🔍 Track Complaint
                </button>
                <button
                  className="sidebarItem"
                  onClick={() => handleNavClick('/my-complaints')}
                >
                  📋 My Complaints
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
