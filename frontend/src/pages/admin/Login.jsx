import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(phone, password);
      if (user.role !== 'ADMIN') {
        setError('Tài khoản này không có quyền quản trị.');
        return;
      }
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--admin-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ padding: 32, width: 360 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 4 }}>🌶️ FoodTrend Admin</h2>
        <p style={{ textAlign: 'center', fontSize: 13, marginBottom: 20 }}>Demo: 0900000001 / Admin@123</p>
        <form onSubmit={handleSubmit} className="flex-col gap-12">
          <input placeholder="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p style={{ color: 'var(--color-primary)', fontSize: 13 }}>{error}</p>}
          <button className="btn btn-primary btn-block">Đăng nhập</button>
        </form>
      </div>
    </div>
  );
}
