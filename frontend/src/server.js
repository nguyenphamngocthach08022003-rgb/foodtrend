const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { initChatSocket } = require('./realtime/chatSocket');
const { envPath, found: envFound } = require('./config/loadEnv');

// In cấu hình DB đang dùng (KHÔNG in mật khẩu) để dễ phát hiện sai .env ngay khi khởi động
// eslint-disable-next-line no-console
console.log(
  envFound
    ? `[.env] Đã đọc file: ${envPath}`
    : `[.env] ⚠️  KHÔNG TÌM THẤY file ${envPath} — đang dùng giá trị mặc định (user=postgres, db=foodtrend)!`
);
// eslint-disable-next-line no-console
console.log(
  `[DB]   host=${process.env.DB_HOST || 'localhost'} port=${process.env.DB_PORT || 5432} ` +
  `db=${process.env.DB_NAME || 'foodtrend'} user=${process.env.DB_USER || 'postgres'} ` +
  `password=${process.env.DB_PASSWORD ? '(đã đặt)' : '(TRỐNG)'}`
);

// Dùng http.createServer thay vì app.listen trực tiếp để gắn được Socket.IO
// lên CÙNG một cổng với REST API (không cần mở thêm cổng riêng).
const httpServer = http.createServer(app);
initChatSocket(httpServer);

httpServer.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`FoodTrend API đang chạy tại http://localhost:${env.port}`);
  // eslint-disable-next-line no-console
  console.log(`   Customer API: http://localhost:${env.port}/api`);
  // eslint-disable-next-line no-console
  console.log(`   Admin API:    http://localhost:${env.port}/api/admin`);
  // eslint-disable-next-line no-console
  console.log(`   Socket.IO:    cùng cổng ${env.port}, xác thực bằng JWT access token`);
});
