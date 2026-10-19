const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { initChatSocket } = require('./realtime/chatSocket');
const { envPath, found: envFound, encoding: envEncoding, loadedKeys } = require('./config/loadEnv');

// In cấu hình DB đang dùng (KHÔNG in mật khẩu) để dễ phát hiện sai .env ngay khi khởi động
// eslint-disable-next-line no-console
console.log(
  envFound
    ? `[.env] Đã đọc file: ${envPath} (mã hóa: ${envEncoding}, ${loadedKeys.length} biến)`
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
// Lưới an toàn: lỗi bất đồng bộ không được bắt ở đâu đó chỉ ghi log, không làm sập server
process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('[unhandledRejection]', reason && reason.message ? reason.message : reason);
});

const httpServer = http.createServer(app);
initChatSocket(httpServer);

// Báo ngay trạng thái Gmail khi khởi động để biết cấu hình đúng hay chưa (không làm sập server nếu lỗi)
const mailService = require('./modules/mail/mail.service');

mailService.verifyConnection().then((r) => {
  /* eslint-disable no-console */
  if (!r.enabled) {
    console.log('[mail] ⚠️  Chưa cấu hình Gmail (MAIL_USER / MAIL_APP_PASSWORD) -> mã xác nhận KHÔNG được gửi email thật, chỉ chạy chế độ thử.');
  } else if (r.ok) {
    console.log(`[mail] ✅ Đã kết nối Gmail (${env.mail.user}) — sẵn sàng gửi mã xác nhận.`);
  } else {
    console.log(`[mail] ❌ Kết nối Gmail thất bại: ${mailService.explainMailError(r.error)}`);
  }
  /* eslint-enable no-console */
});

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
