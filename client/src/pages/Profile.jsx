import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { http } from '../api/http';

export default function Profile() {
  const { user, token, refreshMe, logout, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [dateOfBirth, setDateOfBirth] = useState(() => {
    try {
      return user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0, 10) : '';
    } catch (e) {
      return '';
    }
  });
  const [gender, setGender] = useState(() => user?.gender || '');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [avatarColor, setAvatarColor] = useState(() => {
    try {
      const key = typeof window !== 'undefined' && user?._id ? `avatarColor:${user._id}` : null;
      return key && window.localStorage.getItem(key) ? window.localStorage.getItem(key) : '#1B3C53';
    } catch (e) {
      return '#1B3C53';
    }
  });
  const DEFAULT_AVATARS = [
    { id: 'a1', color: '#FFFF00 ', label: 'Yellow' },
    { id: 'a2', color: '#0000CD', label: 'Blue' },
    { id: 'a3', color: '#06b6d4', label: 'Cyan' },
    { id: 'a4', color: '#10b981', label: 'Green' },
    { id: 'a5', color: '#704214', label: 'Sepia brown' },
    { id: 'a6', color: '#84cc16', label: 'Lime' },
    { id: 'a7', color: '#FF7518', label: 'Pumpkin' },
    { id: 'a8', color: '#ec4899', label: 'Pink' },
    { id: 'a9', color: '#FF2C2C', label: 'Red' },
    { id: 'a10', color: '#8b5cf6', label: 'Violet' },
  ].sort((x, y) => x.label.localeCompare(y.label));

  if (!user) return null;

  const resolvedAvatarUrl = user?.avatar
    ? (() => {
        const s = String(user.avatar || '');
        if (/^(https?:|\/\/|data:|blob:)/i.test(s)) return s;
        return `${import.meta.env.VITE_API_URL || ''}${s}`;
      })()
    : null;

  async function saveProfile(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage('');
      await http.patch('/api/auth/me', { name, email, phone, address, dateOfBirth: dateOfBirth || null, gender: gender || null }, { token });
      await refreshMe();
      setMessage('Profile updated');
      setSuccess('Profile saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setMessage(err.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  }

  

  async function changePassword(e) {
    e.preventDefault();
    const current = document.getElementById('currentPassword').value;
    const next = document.getElementById('newPassword').value;
    if (!current || !next) return setMessage('Provide current and new password');
    try {
      setLoading(true);
      setMessage('');
      await http.patch('/api/auth/me/password', { currentPassword: current, newPassword: next }, { token });
      setMessage('Password changed');
      setSuccess('Password changed successfully');
      setTimeout(() => setSuccess(''), 3000);
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
    } catch (err) {
      setMessage(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileSelect(e) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const previousAvatar = user?.avatar;
      // show local preview immediately
      try {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        try { setUser && setUser(prev => ({ ...(prev || {}), avatar: url })); } catch (err) {}
      } catch (err) {}
      setLoading(true);
      setMessage('');
      const form = new FormData();
      form.append('avatar', file);
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Upload failed');
      }
      await refreshMe();
      setMessage('Avatar uploaded');
      // clear the input value (use captured element to avoid React synthetic event pooling)
      try { input.value = ''; } catch (err) {}
      // clear preview after successful upload (refreshMe will update the real avatar)
      try { if (previewUrl) { URL.revokeObjectURL(previewUrl); } } catch (err) {}
      setPreviewUrl(null);
    } catch (err) {
      setMessage(err.message || 'Failed to upload');
      // keep preview so the user sees selected image even on failure
      try { setUser && setUser(prev => ({ ...(prev || {}), avatar: previousAvatar })); } catch (err) {}
    } finally {
      setLoading(false);
    }
  }

  async function exportData() {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/me/export`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-${user._id}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage(err.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  }

  async function deleteAccount() {
    if (!confirm('Delete your account? This cannot be undone.')) return;
    try {
      setLoading(true);
      await http.patch('/api/auth/me', {}, { token, method: 'DELETE' });
    } catch (err) {
      // fallback to fetch delete since http helper doesn't support body-less delete
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/me`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Delete failed');
      logout();
    } catch (err) {
      setMessage(err.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      {success ? (
        <div className="toast success" role="status" aria-live="polite">{success}</div>
      ) : null}
      <div className="card">
        <h1>Profile</h1>
        <p>Update your account details</p>

        <form className="form" onSubmit={saveProfile}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: 96, height: 96, cursor: 'default' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: avatarColor, color: 'var(--text)', transition: 'background 160ms ease' }}>
                    {previewUrl ? (
                      <img src={previewUrl} alt="Avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : resolvedAvatarUrl ? (
                      <img src={resolvedAvatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" fill="#ffffff" />
                        <path d="M4 20c0-2.667 4-4 8-4s8 1.333 8 4v1H4v-1z" fill="#ffffff" />
                      </svg>
                    )}
                  </div>

                  <button
                    type="button"
                    aria-label="Choose avatar from device"
                    onClick={() => {
                      const picker = document.getElementById('avatarPicker');
                      if (picker) picker.click();
                    }}
                    style={{
                      position: 'absolute',
                      right: -6,
                      bottom: -6,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      border: '1px solid rgba(0,0,0,0.08)',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 7H6L7 5H17L18 7H20C21.1 7 22 7.9 22 9V19C22 20.1 21.1 21 20 21H4C2.9 21 2 20.1 2 19V9C2 7.9 2.9 7 4 7Z" stroke="#111827" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="14" r="3" stroke="#111827" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                </div>
              </div>

              <div style={{ width: '100%', textAlign: 'center' }}>
                <div className="muted">Avatar</div>
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 48px)', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                  {DEFAULT_AVATARS.map((a) => {
                    const color = String(a.color || '').trim() || '#1B3C53';
                    return (
                      <button
                        key={a.id}
                        type="button"
                        title={a.label}
                        onClick={async () => {
                          // update preview immediately and persist selection
                          setAvatarColor(color);
                          try {
                            if (user?._id) window.localStorage.setItem(`avatarColor:${user._id}`, color);
                          } catch (e) {}

                          const initial = (user.name || 'U').charAt(0).toUpperCase();
                          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" alignment-baseline="central" text-anchor="middle" font-size="120" fill="#fff">${initial}</text></svg>`;
                          try {
                            const previousAvatar = user?.avatar;
                            // preview the generated svg immediately
                            let tempUrl = null;
                            try {
                              const blob = new Blob([svg], { type: 'image/svg+xml' });
                              tempUrl = URL.createObjectURL(blob);
                              setPreviewUrl(tempUrl);
                              try { setUser && setUser(prev => ({ ...(prev || {}), avatar: tempUrl })); } catch (err) {}
                            } catch (err) {}
                            setLoading(true);
                            setMessage('');
                            const blob = new Blob([svg], { type: 'image/svg+xml' });
                            const file = new File([blob], `${a.id}.svg`, { type: 'image/svg+xml' });
                            const form = new FormData();
                            form.append('avatar', file);
                            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/me/avatar`, {
                              method: 'POST',
                              headers: { Authorization: `Bearer ${token}` },
                              body: form,
                            });
                            if (!res.ok) {
                              const err = await res.json();
                              throw new Error(err.error?.message || 'Upload failed');
                            }
                            await refreshMe();
                            setMessage('Default avatar applied');
                            try { if (tempUrl) { URL.revokeObjectURL(tempUrl); } } catch (err) {}
                          } catch (err) {
                            setMessage(err.message || 'Failed to set avatar');
                            // keep preview on failure
                            try { setUser && setUser(prev => ({ ...(prev || {}), avatar: previousAvatar })); } catch (err) {}
                          } finally {
                            setLoading(false);
                          }
                        }}
                        style={{ width: 48, height: 48, borderRadius: '50%', background: color, border: 'none', cursor: 'pointer' }}
                      />
                    );
                  })}
                  </div>
                  <div className="muted" style={{ marginTop: '0.5rem', textAlign: 'center' }}>Choose Profile Color</div>
                  <input id="avatarPicker" type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                </div>
              </div>
            </div>
          </div>

          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} 
            style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
            />
          </label>

          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" />
          </label>

          <label>
            Date of Birth
            <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          </label>

          <label>
            Gender
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', alignItems: 'center' }}>
              <label style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}><input type="radio" name="gender" value="male" checked={gender === 'male'} onChange={(e) => setGender(e.target.value)} /> Male</label>
              <label style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}><input type="radio" name="gender" value="female" checked={gender === 'female'} onChange={(e) => setGender(e.target.value)} /> Female</label>
              <label style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}><input type="radio" name="gender" value="other" checked={gender === 'other'} onChange={(e) => setGender(e.target.value)} /> Other</label>
            </div>
          </label>

          <label>
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
          </label>

          <label>
            Address
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} maxLength={500} rows={5} />
          </label>

          

          

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" disabled={loading}>Save Profile</button>
            <button type="button" onClick={exportData} disabled={loading}>Export Data</button>
            <button type="button" onClick={deleteAccount} disabled={loading} style={{ background: '#ff5c5c' }}>Delete Account</button>
          </div>
        </form>

        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2>Change Password</h2>
          <form onSubmit={changePassword}>
              <label>
                Current Password
                <div style={{ position: 'relative' }}>
                  <input id="currentPassword" type={showCurrentPassword ? 'text' : 'password'} style={{ paddingRight: '40px' }} />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((s) => !s)}
                    aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
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
                    {showCurrentPassword ? (
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
              <label>
                New Password
                <div style={{ position: 'relative' }}>
                  <input id="newPassword" type={showNewPassword ? 'text' : 'password'} style={{ paddingRight: '40px' }} />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((s) => !s)}
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
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
                    {showNewPassword ? (
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
            {message && <div className="muted">{message}</div>}<br></br>
            <button type="submit" disabled={loading}>Change Password</button>
          </form>
        </div>
      </div>
    </div>
  );
}
