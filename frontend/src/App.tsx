import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ShipmentsPage from './pages/ShipmentsPage';
import CreateShipmentPage from './pages/CreateShipmentPage';
import ShipmentDetailPage from './pages/ShipmentDetailPage';
import TrackingPage from './pages/TrackingPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to="/shipments" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/shipments" /> : <RegisterPage />} />
      <Route path="/track/:trackingNumber?" element={<TrackingPage />} />

      {/* Protected routes */}
      <Route path="/shipments" element={<ProtectedRoute><ShipmentsPage /></ProtectedRoute>} />
      <Route path="/shipments/new" element={<ProtectedRoute><CreateShipmentPage /></ProtectedRoute>} />
      <Route path="/shipments/:id" element={<ProtectedRoute><ShipmentDetailPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to={user ? '/shipments' : '/login'} replace />} />
    </Routes>
  );
}
