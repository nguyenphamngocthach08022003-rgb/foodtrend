import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authApi from '../api/auth.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('ft_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  const persist = (userData, accessToken, refreshToken) => {
    localStorage.setItem('ft_user', JSON.stringify(userData));
    localStorage.setItem('ft_access_token', accessToken);
    localStorage.setItem('ft_refresh_token', refreshToken);
    setUser(userData);
  };

  // identifier = email HOẶC số điện thoại
  const login = async (identifier, password) => {
    const { data } = await authApi.login({ identifier, password });
    persist(data.data.user, data.data.accessToken, data.data.refreshToken);
    return data.data.user;
  };

  // Sau khi xác nhận mã email thành công, backend trả luôn tài khoản + token -> đăng nhập luôn
  const acceptSession = (payload) => {
    persist(payload.user, payload.accessToken, payload.refreshToken);
    return payload.user;
  };

  const logout = () => {
    localStorage.removeItem('ft_user');
    localStorage.removeItem('ft_access_token');
    localStorage.removeItem('ft_refresh_token');
    setUser(null);
  };

  const refreshProfile = useCallback(async () => {
    if (!localStorage.getItem('ft_access_token')) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await authApi.getMe();
      localStorage.setItem('ft_user', JSON.stringify(data.data));
      setUser(data.data);
    } catch (err) {
      // token invalid/expired -> stay logged out silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, acceptSession, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
