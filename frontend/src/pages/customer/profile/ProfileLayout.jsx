import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  { to: '/tai-khoan', label: 'Thông tin cá nhân', end: true },
  { to: '/tai-khoan/mat-khau', label: 'Đổi mật khẩu' },
  { to: '/tai-khoan/don-hang', label: 'Đơn hàng của tôi' },
  { to: '/tai-khoan/dia-chi', label: 'Sổ địa chỉ' },
  { to: '/tai-khoan/ma-giam-gia', label: 'Mã giảm giá' },
  { to: '/tai-khoan/yeu-thich', label: 'Sản phẩm yêu thích' },
];

export default function ProfileLayout() {
  return (
    <div className="container" style={{ padding: '32px 20px 60px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28 }}>
      <aside className="card" style={{ padding: 12, alignSelf: 'start' }}>
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className="btn btn-ghost btn-block"
            style={({ isActive }) => ({
              justifyContent: 'flex-start', marginBottom: 4,
              background: isActive ? 'var(--color-primary-tint)' : 'transparent',
              color: isActive ? 'var(--color-primary)' : 'var(--color-ink)',
              fontWeight: isActive ? 700 : 500,
            })}
          >
            {t.label}
          </NavLink>
        ))}
      </aside>
      <div><Outlet /></div>
    </div>
  );
}
