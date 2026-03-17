import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function UserDashboard() {
  const { user } = useAuth();

  return (
    <div className="container">
      <div className="card">
        <h1>Welcome, {user?.name || 'User'}!</h1>
        <p className="muted">Manage your complaints from the APJ Complaint Portal.</p>
        
        <div className="grid2" style={{ marginTop: '2rem' }}>
          <Link to="/register-complaint" className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <h3>📝 Register New Complaint</h3>
            <p>Submit a new complaint about campus facilities.</p>
          </Link>
          
          <Link to="/my-complaints" className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <h3>📋 View My Complaints</h3>
            <p>Check the status of your submitted complaints.</p>
          </Link>
          
          <Link to="/track-complaint" className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <h3>🔍 Track Complaint</h3>
            <p>Track a complaint by its ID.</p>
          </Link>
          
          <Link to="/profile" className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <h3>👤 Profile</h3>
            <p>Update your profile information.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}