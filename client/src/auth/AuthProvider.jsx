import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { http } from '../api/http';

const AuthContext = createContext(null);

const STORAGE_KEY = 'ocms_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function refreshMe(nextToken = token) {
    if (!nextToken) {
      setUser(null);
      return;
    }
    const data = await http.get('/api/auth/me', { token: nextToken });
    // debug: log avatar returned by refresh
    try { console.debug('refreshMe user.avatar =>', data.user?.avatar); } catch (e) {}
    setUser((prev) => {
      try {
        const avatar = data.user?.avatar;
        if (!avatar) return data.user;
        const s = String(avatar || '');
        if (/^(https?:|\/\/|data:|blob:)/i.test(s)) return data.user;
        const api = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
        const resolved = s.startsWith('/') ? (api ? `${api}${s}` : (typeof window !== 'undefined' ? `${window.location.origin}${s}` : s)) : (api ? `${api}/${s}` : s);
        return { ...(data.user || {}), avatar: resolved };
      } catch (e) {
        return data.user;
      }
    });
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        if (token) {
          await refreshMe(token);
        } else {
          setUser(null);
        }
      } catch (e) {
        if (!active) return;
        localStorage.removeItem(STORAGE_KEY);
        setToken('');
        setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email, password) {
    setError('');
    const data = await http.post('/api/auth/login', { email, password });
    localStorage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    try {
      const avatar = data.user?.avatar;
      if (avatar && !/^(https?:|\/\/|data:|blob:)/i.test(String(avatar))) {
        const api = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
        const s = String(avatar || '');
        const resolved = s.startsWith('/') ? (api ? `${api}${s}` : (typeof window !== 'undefined' ? `${window.location.origin}${s}` : s)) : (api ? `${api}/${s}` : s);
        setUser({ ...(data.user || {}), avatar: resolved });
      } else {
        setUser(data.user);
      }
    } catch (e) {
      setUser(data.user);
    }
    return data.user;
  }

  async function loginWithGoogle(idToken) {
    setError('');
    const data = await http.post('/api/auth/google', { idToken });
    // debug: log avatar returned by google login
    try { console.debug('loginWithGoogle user.avatar =>', data.user?.avatar); } catch (e) {}
    localStorage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    try {
      const avatar = data.user?.avatar;
      if (avatar && !/^(https?:|\/\/|data:|blob:)/i.test(String(avatar))) {
        const api = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
        const s = String(avatar || '');
        const resolved = s.startsWith('/') ? (api ? `${api}${s}` : (typeof window !== 'undefined' ? `${window.location.origin}${s}` : s)) : (api ? `${api}/${s}` : s);
        setUser({ ...(data.user || {}), avatar: resolved });
      } else {
        setUser(data.user);
      }
    } catch (e) {
      setUser(data.user);
    }
    return data.user;
  }

  async function register(name, email, password) {
    setError('');
    const data = await http.post('/api/auth/register', { name, email, password });
    localStorage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    try {
      const avatar = data.user?.avatar;
      if (avatar && !/^(https?:|\/\/|data:|blob:)/i.test(String(avatar))) {
        const api = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
        const s = String(avatar || '');
        const resolved = s.startsWith('/') ? (api ? `${api}${s}` : (typeof window !== 'undefined' ? `${window.location.origin}${s}` : s)) : (api ? `${api}/${s}` : s);
        setUser({ ...(data.user || {}), avatar: resolved });
      } else {
        setUser(data.user);
      }
    } catch (e) {
      setUser(data.user);
    }
    return data.user;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setToken('');
    setUser(null);
  }

  const value = useMemo(
    () => ({ token, user, setUser, loading, error, setError, login, loginWithGoogle, register, logout, refreshMe }),
    // include setUser in deps so callers see correct ref (setUser stable but include for clarity)
    [token, user, setUser, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
