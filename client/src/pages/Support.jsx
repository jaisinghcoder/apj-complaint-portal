import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { http } from '../api/http';

export default function Support() {
  const { token } = useAuth();
  const CATEGORIES = [
    'General',
    'Account',
    'Billing',
    'Technical',
    'Login Issues',
    'Payment',
    'Feature Request',
    'Feedback',
    'Scheduling',
    'Other',
  ];
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await http.get('/api/support', { token });
      setTickets(data.tickets || []);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const data = await http.post('/api/support', { subject, message, category }, { token });
      setSubject('');
      setMessage('');
      setCategory(CATEGORIES[0]);
      setTickets((t) => [data.ticket, ...t]);
      // show success toast
      setSuccess('Message sent successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      {success ? (
        <div className="toast success" role="status" aria-live="polite">{success}</div>
      ) : null}
    <div className="page">
      <h1>Customer Support</h1>

      <section className="supportForm">
        <h2>Submit Your Problem</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Subject
            <input value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={200} />
          </label>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Message
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={4} maxLength={4000} />
          </label>
          <div className='send'>
            <button type="submit" disabled={loading}>Send</button>
          </div>
          {error && <div className="error">{error}</div>}
        </form>
      </section>

      <section className="supportList">
        <h2>Your Tickets</h2>
        {loading && tickets.length === 0 ? (
          <div>Loading…</div>
        ) : tickets.length === 0 ? (
          <div>No tickets yet.</div>
        ) : (
          <ul>
            {tickets.map((t) => (
              <li key={t._id}>
                <strong>{t.subject}</strong> — <em>{t.status}</em>
                <div>{t.message}</div>
                <div className="meta">{new Date(t.createdAt).toLocaleString()}</div>
                {t.reply && (
                  <div className="reply">Response: {t.reply}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
    </div>
  );
}
