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
    setUser(data.user);
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
    setUser(data.user);
    return data.user;
  }

  async function register(name, email, password) {
    setError('');
    const data = await http.post('/api/auth/register', { name, email, password });
    localStorage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setToken('');
    setUser(null);
  }

  const value = useMemo(
    () => ({ token, user, loading, error, setError, login, register, logout, refreshMe }),
    [token, user, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
