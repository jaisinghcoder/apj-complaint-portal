import AdminDashboard from './AdminDashboard';
import UserDashboard from './UserDashboard';
import { useAuth } from '../auth/AuthProvider';

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === 'admin') return <AdminDashboard />;
  return <UserDashboard />;
}
