import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user || user.role !== 'ADMIN') return <Navigate to="/admin/dang-nhap" replace />;
  return <Outlet />;
}
