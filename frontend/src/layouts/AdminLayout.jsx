import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';

export default function AdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F1E8' }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: '28px 32px' }}>
        <Outlet />
      </main>
    </div>
  );
}
