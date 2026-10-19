import axios from 'axios';

function getOrCreateDeviceKey() {
  const KEY = 'ft_device_key';
  let key = localStorage.getItem(KEY);
  if (!key) {
    key = 'dev-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(KEY, key);
  }
  return key;
}

const axiosClient = axios.create({ baseURL: '/api' });

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ft_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['x-device-key'] = getOrCreateDeviceKey();
  return config;
});

let isRefreshing = false;
let pendingQueue = [];

axiosClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && localStorage.getItem('ft_refresh_token')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject, original });
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = localStorage.getItem('ft_refresh_token');
        const { data } = await axios.post('/api/auth/refresh-token', { refreshToken });
        localStorage.setItem('ft_access_token', data.data.accessToken);
        localStorage.setItem('ft_refresh_token', data.data.refreshToken);
        pendingQueue.forEach(({ resolve, original: o }) => {
          o.headers.Authorization = `Bearer ${data.data.accessToken}`;
          resolve(axiosClient(o));
        });
        pendingQueue = [];
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return axiosClient(original);
      } catch (refreshErr) {
        pendingQueue = [];
        localStorage.removeItem('ft_access_token');
        localStorage.removeItem('ft_refresh_token');
        localStorage.removeItem('ft_user');
        // Route đăng nhập của project là /dang-nhap (khách) và /admin/dang-nhap (admin)
        const isAdminArea = window.location.pathname.startsWith('/admin');
        window.location.href = isAdminArea ? '/admin/dang-nhap' : '/dang-nhap';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
