import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { http } from '../api/http';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState('');
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const res = await http.post('/api/auth/forgot', { email });
      setMessage('If that email exists we sent reset instructions.');
      if (res?.token) {
        // in dev mode server returns token — navigate to reset page
        setDevToken(res.token);
        navigate(`/reset/${res.token}`, { replace: true });
        return;
      }
      setMessage('If that email exists we sent reset instructions.');
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to request reset');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <div className="card stack">
        {!sent ? (
          <>
            <div>
              <h1>Forgot Password</h1>
              <p className="muted">Enter your account email to receive reset instructions.</p>
            </div>

            <form onSubmit={onSubmit} className="form">
              <label>
                Email
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
              </label>

              <button disabled={submitting} type="submit">{submitting ? 'Sending…' : 'Submit to change password'}</button>
            </form>

            {error ? <div className="error">{error}</div> : null}
            {message ? <div className="muted">{message}</div> : null}

            <div className="row space">
              <Link to="/login">Back to login</Link>
              <Link to="/register">Register</Link>
            </div>
          </>
        ) : (
          <div>
            <h1>Check your email</h1>
            <p className="muted">{message || 'If that email exists we sent reset instructions.'}</p>
            {devToken ? (
              <p className="muted">Dev reset link: <a href={`/reset/${devToken}`}>/reset/{devToken}</a></p>
            ) : null}
            <div className="row space" style={{ marginTop: '8px' }}>
              <Link to="/login">Back to login</Link>
              <Link to="/register">Register</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
