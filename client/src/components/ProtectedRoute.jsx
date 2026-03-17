import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="card">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
