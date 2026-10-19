import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../../api/auth.api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      await resetPassword({ token, new_password: newPassword });
      setMessage('Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...');
      setTimeout(() => navigate('/dang-nhap'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể đặt lại mật khẩu.');
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420, margin: '0 auto', padding: '60px 20px' }}>
      <div className="card" style={{ padding: 30 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Đặt lại mật khẩu</h2>
        <form onSubmit={handleSubmit} className="flex-col gap-12">
          <input placeholder="Token đặt lại mật khẩu" value={token} onChange={(e) => setToken(e.target.value)} required />
          <input type="password" placeholder="Mật khẩu mới" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          {error && <p style={{ color: 'var(--color-primary)', fontSize: 13 }}>{error}</p>}
          {message && <p style={{ color: 'var(--color-green)', fontSize: 13 }}>{message}</p>}
          <button className="btn btn-primary btn-block">Xác nhận</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>
          <Link to="/dang-nhap">← Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
