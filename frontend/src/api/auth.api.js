import client from './axiosClient';

// Đăng ký 3 bước: gửi mã về email -> (gửi lại) -> nhập mã để tạo tài khoản
export const requestRegisterCode = (data) => client.post('/auth/register/request-code', data);
export const resendRegisterCode = (data) => client.post('/auth/register/resend', data);
export const verifyRegister = (data) => client.post('/auth/register/verify', data);

export const login = (data) => client.post('/auth/login', data);
export const getMe = () => client.get('/auth/me');
export const updateMe = (data) => client.put('/auth/me', data);
export const changePassword = (data) => client.put('/auth/change-password', data);

// Quên mật khẩu: gửi mã về email -> nhập mã + mật khẩu mới
export const forgotPassword = (data) => client.post('/auth/forgot-password', data);
export const resetPassword = (data) => client.post('/auth/reset-password', data);
