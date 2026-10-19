import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getMe } from '../api/auth.api';

const SocketContext = createContext(null);

// Socket.IO chạy CÙNG cổng với REST API (http://localhost:4000), xác thực
// bằng access token JWT hiện có — không cần thêm config domain nào khác.
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user || !localStorage.getItem('ft_access_token')) {
      setSocket(null);
      setConnected(false);
      return undefined;
    }

    let instance = null;
    let triedRefresh = false;

    // Tạo socket ở tick kế tiếp: React StrictMode (dev) mount-unmount-mount liên tiếp, nếu tạo ngay
    // thì kết nối đầu bị đóng khi chưa kịp mở và trình duyệt báo "WebSocket is closed before...".
    const timer = setTimeout(() => {
      instance = io(SOCKET_URL, {
        // Dạng hàm: MỖI lần (kết nối lại) đều lấy access token mới nhất trong localStorage
        auth: (cb) => cb({ token: localStorage.getItem('ft_access_token') }),
        transports: ['websocket'],
        reconnectionAttempts: Infinity,
      });

      instance.on('connect', () => {
        triedRefresh = false;
        setConnected(true);
      });
      instance.on('disconnect', () => setConnected(false));

      // Token hết hạn: gọi 1 request REST để interceptor tự làm mới token, rồi kết nối lại 1 lần
      instance.on('connect_error', async (err) => {
        if (err && err.message === 'UNAUTHORIZED' && !triedRefresh) {
          triedRefresh = true;
          try {
            await getMe();
            instance.connect();
          } catch (e) {
            /* refresh thất bại -> axiosClient sẽ tự đưa về trang đăng nhập */
          }
        }
      });

      setSocket(instance);
    }, 0);

    return () => {
      clearTimeout(timer);
      if (instance) instance.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [user?.id]); // kết nối lại khi đổi user (đăng nhập / đăng xuất / đổi tài khoản)

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
