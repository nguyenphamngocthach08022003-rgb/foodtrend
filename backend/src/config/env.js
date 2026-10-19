require('./loadEnv');

module.exports = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },

  // Gmail đại diện của shop dùng để GỬI mã xác nhận (xem hướng dẫn tạo "Mật khẩu ứng dụng" trong README)
  mail: {
    user: (process.env.MAIL_USER || '').trim(),
    pass: (process.env.MAIL_APP_PASSWORD || '').replace(/\s+/g, ''), // Google hiển thị có dấu cách -> bỏ hết
    fromName: process.env.MAIL_FROM_NAME || 'FoodTrend',
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT) || 465,
    secure: process.env.MAIL_SECURE ? process.env.MAIL_SECURE !== 'false' : true,
    get enabled() { return Boolean(this.user && this.pass); },
  },

  // Quy tắc mã xác nhận
  otp: {
    ttlMinutes: Number(process.env.OTP_TTL_MINUTES) || 10, // mã sống bao lâu
    resendSeconds: Number(process.env.OTP_RESEND_SECONDS) || 60, // cách nhau tối thiểu giữa 2 lần gửi
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS) || 5, // nhập sai tối đa
    maxSendsPerHour: Number(process.env.OTP_MAX_SENDS_PER_HOUR) || 6, // gửi tối đa / email / giờ
  },

  defaultDeliveryFee: Number(process.env.DEFAULT_DELIVERY_FEE) || 15000,
  viewSpamWindowMinutes: Number(process.env.VIEW_SPAM_WINDOW_MINUTES) || 30,
  passwordResetExpiresMinutes: Number(process.env.PASSWORD_RESET_EXPIRES_MINUTES) || 30,
};
