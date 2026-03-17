import { useEffect, useMemo, useState } from 'react';
import { http } from '../api/http';
import { useAuth } from '../auth/AuthProvider';

const CATEGORIES = ['Electricity', 'Water Supply', 'College Facilities', 'Other'];
const API_BASE = import.meta.env.VITE_API_URL || '';

function resolveAttachmentUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url}`;
}

export default function RegisterComplaint() {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const data = await http.get('/api/complaints', { token });
    setComplaints(data.complaints || []);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setError('');
        setLoading(true);
        await load();
      } catch (e) {
        if (!active) return;
        setError(e.message || 'Failed to load complaints');
      } finally {
        if (active) setLoading(false);
      }
    })();

    const id = setInterval(() => {
      load().catch(() => {});
    }, 10000);

    return () => {
      active = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function submitComplaint(e) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');

      // Client-side validation
      if (!category.trim()) {
        setError('Please select a category.');
        return;
      }
      if (title.trim().length < 2) {
        setError('Title must be at least 2 characters.');
        return;
      }
      if (title.length > 120) {
        setError('Title must be 120 characters or less.');
        return;
      }
      if (description.trim().length < 5) {
        setError('Description must be at least 5 characters.');
        return;
      }
      if (description.length > 2000) {
        setError('Description must be 2000 characters or less.');
        return;
      }
      if (attachment && attachment.size > 5 * 1024 * 1024) {
        setError('Attachment must be 5MB or smaller.');
        return;
      }

      // Use FormData for file upload
      const formData = new FormData();
      formData.append('category', category);
      formData.append('title', title);
      formData.append('description', description);
      if (attachment) {
        formData.append('attachment', attachment);
      }

      // Custom fetch for FormData (multipart)
      const response = await fetch(`${API_BASE}/api/complaints`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to submit complaint');
      }

      setTitle('');
      setDescription('');
      setAttachment(null);
      document.getElementById('attachmentInput').value = ''; // Reset file input
      await load();
    } catch (e2) {
      setError(e2.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  }

  const rows = useMemo(() => complaints, [complaints]);

  return (
    <div className="stack">
      <div className="card">
        <h2>Submit a Complaint</h2>
        <form className="form" onSubmit={submitComplaint}>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
          </label>
          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required maxLength={2000} rows={4} />
          </label>
          <label>
            Attachment (Optional - Images or PDF)
            <input
              id="attachmentInput"
              type="file"
              accept="image/jpeg,image/png,image/gif,.pdf"
              onChange={(e) => setAttachment(e.target.files?.[0] || null)}
            />
            {attachment && (
              <div className="muted" style={{ marginTop: '8px', fontSize: '0.9em' }}>
                Selected: {attachment.name} ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </label>

          {error ? <div className="error">{error}</div> : null}

          <button disabled={submitting} type="submit">{submitting ? 'Submitting…' : 'Submit'}</button>
        </form>
      </div>
    </div>
  );
}
