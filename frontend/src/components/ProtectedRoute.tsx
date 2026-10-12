import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import type { UserRole } from '../features/auth/services/auth.service';

interface ProtectedRouteProps {
  allowedRole?: UserRole;
}

export default function ProtectedRoute({ allowedRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && profile.role !== allowedRole) {
    // If they are authenticated but have the wrong role, redirect to login
    // which will handle showing them the appropriate screen or logging them out
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
