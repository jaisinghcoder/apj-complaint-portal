import { useAuth } from '../auth/AuthProvider';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="container">
      <div className="card">
        <h1>Profile</h1>
        <p>Your account information.</p>

        <div className="stack" style={{ marginTop: '1rem' }}>
          <div><strong>Name:</strong> {user.name}</div>
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>Role:</strong> {user.role}</div>
        </div>
      </div>
    </div>
  );
}
