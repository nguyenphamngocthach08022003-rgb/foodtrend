import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { updateMe } from '../../../api/auth.api';

export default function ProfileInfo() {
  const { user, refreshProfile } = useAuth();
  const [form, setForm] = useState({ full_name: '', email: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) setForm({ full_name: user.full_name, email: user.email || '' });
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateMe(form);
    await refreshProfile();
    setMessage('Cập nhật thông tin thành công!');
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <div className="card" style={{ padding: 24, maxWidth: 480 }}>
      <h3 style={{ marginBottom: 18 }}>Thông tin cá nhân</h3>
      <form onSubmit={handleSubmit} className="flex-col gap-12">
        <div>
          <label style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>Số điện thoại</label>
          <input value={user?.phone || ''} disabled />
        </div>
        <div>
          <label style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>Họ và tên</label>
          <input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
        </div>
        <div>
          <label style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>Email</label>
          <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
        {message && <p style={{ color: 'var(--color-green)', fontSize: 13 }}>{message}</p>}
        <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Lưu thay đổi</button>
      </form>
    </div>
  );
}
