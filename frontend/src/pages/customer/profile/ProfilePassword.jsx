import { useState } from 'react';
import { changePassword } from '../../../api/auth.api';

export default function ProfilePassword() {
  const [form, setForm] = useState({ old_password: '', new_password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      await changePassword(form);
      setMessage('Đổi mật khẩu thành công!');
      setForm({ old_password: '', new_password: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Đổi mật khẩu thất bại.');
    }
  };

  return (
    <div className="card" style={{ padding: 24, maxWidth: 420 }}>
      <h3 style={{ marginBottom: 18 }}>Đổi mật khẩu</h3>
      <form onSubmit={handleSubmit} className="flex-col gap-12">
        <input type="password" placeholder="Mật khẩu hiện tại" value={form.old_password} onChange={(e) => setForm((f) => ({ ...f, old_password: e.target.value }))} required />
        <input type="password" placeholder="Mật khẩu mới" value={form.new_password} onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))} required />
        {error && <p style={{ color: 'var(--color-primary)', fontSize: 13 }}>{error}</p>}
        {message && <p style={{ color: 'var(--color-green)', fontSize: 13 }}>{message}</p>}
        <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Đổi mật khẩu</button>
      </form>
    </div>
  );
}
