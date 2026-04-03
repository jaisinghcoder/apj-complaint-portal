import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import { useAuth } from './auth/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import RegisterComplaint from './pages/RegisterComplaint';
import TrackComplaint from './pages/TrackComplaint';
import MyComplaints from './pages/MyComplaints';
import ResolvedComplaints from './pages/ResolvedComplaints';
import Support from './pages/Support';
import AdminSupport from './pages/AdminSupport';
import AdminManageComplaints from './pages/AdminManageComplaints';
  

export default function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  return (
    <div className="appShell">
      <Navbar />
      <main className={`main ${location.pathname === '/dashboard' ? 'main-dashboard' : ''}`}>
        <Routes>
          <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
          <Route path="/login" element={loading && user ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/register" element={loading && user ? <Navigate to="/dashboard" replace /> : <Register />} />
          <Route path="/forgot" element={loading && user ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} />
          <Route path="/reset/:token" element={loading && user ? <Navigate to="/dashboard" replace /> : <ResetPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register-complaint"
            element={
              <ProtectedRoute>
                <RegisterComplaint />
              </ProtectedRoute>
            }
          />
          <Route
            path="/track-complaint"
            element={
              <ProtectedRoute>
                <TrackComplaint />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <Support />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/support"
            element={
              <ProtectedRoute>
                <AdminSupport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/manage-complaints"
            element={
              <ProtectedRoute>
                <AdminManageComplaints />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-complaints"
            element={
              <ProtectedRoute>
                <MyComplaints />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resolved-complaints"
            element={
              <ProtectedRoute>
                <ResolvedComplaints />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
