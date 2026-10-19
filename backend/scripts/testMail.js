/* Gửi thử 1 email để kiểm tra cấu hình Gmail:
     npm run mail:test -- ten.ban@gmail.com
   (không truyền địa chỉ thì gửi cho chính MAIL_USER) */
require('../src/config/loadEnv');
const env = require('../src/config/env');
const mail = require('../src/modules/mail/mail.service');

(async () => {
  if (!env.mail.enabled) {
    console.log('❌ Chưa cấu hình MAIL_USER / MAIL_APP_PASSWORD trong backend/.env');
    process.exit(1);
  }
  const to = process.argv[2] || env.mail.user;
  console.log(`Đang gửi email thử từ ${env.mail.user} tới ${to} ...`);
  try {
    await mail.sendRegisterCode({ to, name: 'Bạn', code: '123456', ttlMinutes: env.otp.ttlMinutes });
    console.log('✅ Gửi thành công! Hãy kiểm tra hộp thư (cả mục Spam/Quảng cáo).');
  } catch (err) {
    console.log('❌ Gửi thất bại:', mail.explainMailError(err));
    process.exit(1);
  }
})();
