import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function Login() {
  const { login, loginWithGoogle, error, setError, setUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    try {
      setSubmitting(true);
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (e2) {
      setError(e2.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function onGoogleLogin(credential) {
    if (!credential) {
      setError('Google login failed');
      return;
    }

    try {
      setSubmitting(true);
      // Optimistically show Google profile picture and basic info immediately
      try {
        const parts = String(credential).split('.');
        if (parts.length >= 2) {
          const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, '=');
          const payload = JSON.parse(atob(padded));
          const picture = payload.picture;
          const name = payload.name;
          const email = payload.email;
          if (picture && setUser) {
            setUser((prev) => ({ ...(prev || {}), avatar: picture, name: prev?.name || name, email: prev?.email || email }));
          }
        }
      } catch (err) {
        // ignore optimistic preview errors
      }

      await loginWithGoogle(credential);
      navigate('/dashboard', { replace: true });
    } catch (e2) {
      setError(e2.message || 'Google login failed');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (resp) => onGoogleLogin(resp?.credential),
        ux_mode: 'popup',
      });

      const container = document.getElementById('google-signin-button');
      if (container) {
        window.google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: '100%',
        });
      }
    };

    const existingScript = document.getElementById('google-client-script');
    if (existingScript) {
      initializeGoogle();
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-client-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  return (
    <div className="container">
      <div className="login-card">
        <h1>Login</h1>
        <p className="muted">Sign in to submit and track complaints.</p>

        <form onSubmit={onSubmit} className="form">      
          <label>
            Email
            <input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              type="email" 
              required
              className="input-full"
            />
          </label>
          <label>
            Password
            <div style={{ position: 'relative' }}>
              <input 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                type={showPassword ? 'text' : 'password'} 
                required
                className="input-full"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={setShowPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
          </label>
          {error ? <div className="error">{error}</div> : null}

          <button disabled={submitting} type="submit">{submitting ? 'Signing in…' : 'Login'}</button>
          <label className="or" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>or</label>
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <div id="google-signin-button" style={{ width: '100%', margin: '0 auto' }} />
            {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
              <div className="muted" style={{ marginTop: '8px', color: 'green' }}>
              </div>
            ) : (
              <div className="muted" style={{ marginTop: '8px' }}>
                Google Sign-In not configured. Set VITE_GOOGLE_CLIENT_ID in .env.
              </div>
            )}
          </div>
        </form>

        <div className="row" style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
          <div>
            <span className="muted">No account?</span> <Link to="/register">Register</Link>
          </div>
          <div>
            <Link to="/forgot">Forgot password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
