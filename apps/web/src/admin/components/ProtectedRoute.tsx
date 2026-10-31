import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../AuthContext';

export function ProtectedRoute() {
  const { admin, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="admin-page-loading" aria-busy="true">
        Loading…
      </div>
    );
  }
  if (!admin) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }
  return <Outlet />;
}
