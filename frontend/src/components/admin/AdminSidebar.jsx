import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { adminGetUnreadTotal } from '../../api/chat.api';

const LINKS = [
  { to: '/admin', label: '📊 Tổng quan', end: true },
  { to: '/admin/san-pham', label: '🍢 Sản phẩm' },
  { to: '/admin/danh-muc', label: '🗂️ Danh mục' },
  { to: '/admin/don-hang', label: '📦 Đơn hàng' },
  { to: '/admin/khach-hang', label: '👥 Khách hàng' },
  { to: '/admin/ma-giam-gia', label: '🏷️ Mã giảm giá' },
  { to: '/admin/trending', label: '🔥 Trending' },
  { to: '/admin/chat', label: '💬 Chat' },
];

export default function AdminSidebar() {
  const { logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  const refreshUnread = () => {
    adminGetUnreadTotal().then(({ data }) => setUnread(data.data.total)).catch(() => {});
  };

  useEffect(() => { refreshUnread(); }, []);

  // Trang Chat đang mở -> coi như đã đọc hết, khỏi hiện badge gây rối
  useEffect(() => {
    if (location.pathname === '/admin/chat') setUnread(0);
  }, [location.pathname]);

  useEffect(() => {
    if (!socket) return undefined;
    const onUpdate = () => {
      if (location.pathname !== '/admin/chat') refreshUnread();
    };
    socket.on('chat:conversation_updated', onUpdate);
    return () => socket.off('chat:conversation_updated', onUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, location.pathname]);

  return (
    <aside style={{ width: 240, background: 'var(--admin-bg)', color: 'var(--admin-text)', minHeight: '100vh', padding: '20px 14px', flexShrink: 0 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, marginBottom: 28, paddingLeft: 8 }}>
        🌶️ FoodTrend <span style={{ color: 'var(--color-primary)' }}>Admin</span>
      </div>
      <nav className="flex-col gap-4">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', borderRadius: 10, fontSize: 14.5,
              background: isActive ? 'var(--color-primary)' : 'transparent',
              color: isActive ? '#fff' : 'var(--admin-text-soft)',
              fontWeight: isActive ? 700 : 500,
            })}
          >
            <span>{l.label}</span>
            {l.to === '/admin/chat' && unread > 0 && (
              <span style={{
                background: 'var(--color-accent)', color: 'var(--color-ink)', borderRadius: 999,
                fontSize: 11, fontWeight: 800, minWidth: 20, height: 20, padding: '0 6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <button
        className="btn btn-block"
        style={{ marginTop: 40, background: 'var(--admin-surface)', color: 'var(--admin-text)', border: '1px solid var(--admin-line)' }}
        onClick={() => { logout(); navigate('/admin/dang-nhap'); }}
      >
        Đăng xuất
      </button>
    </aside>
  );
}
