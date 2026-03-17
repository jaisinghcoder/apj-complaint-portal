import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { useAuth } from './auth/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import RegisterComplaint from './pages/RegisterComplaint';
import TrackComplaint from './pages/TrackComplaint';
import MyComplaints from './pages/MyComplaints';
import ResolvedComplaints from './pages/ResolvedComplaints';
  

export default function App() {
  const { user, loading } = useAuth();

  return (
    <div className="appShell">
      <Navbar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
          <Route path="/login" element={loading && user ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/register" element={loading && user ? <Navigate to="/dashboard" replace /> : <Register />} />
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
    </div>
  );
}
