/* =========================================================================
   Test end-to-end: đăng ký có mã email + quên mật khẩu qua email.
   Dựng 1 máy chủ SMTP giả (smtp-server) để NHẬN email thật từ backend, rồi đọc
   mã trong email ra nhập lại — đúng như người dùng làm với Gmail.

   Cách chạy (backend đang chạy với .env trỏ MAIL_HOST=127.0.0.1 MAIL_PORT=2525
   MAIL_SECURE=false MAIL_USER/MAIL_APP_PASSWORD bất kỳ, OTP_RATE_LIMIT_MAX=1000):
       node tests/test_email_auth.js
   ========================================================================= */
require('../src/config/loadEnv');
const axios = require('axios');
const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const { Client } = require('pg');
const express = require('express');
const rateLimit = require('../src/middlewares/rateLimit.middleware');

const API = 'http://localhost:4000/api';
const inbox = []; // email đã nhận
let smtp;

const http = axios.create({ baseURL: API, validateStatus: () => true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
function check(label, cond, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'} - ${label}${extra ? ` ${extra}` : ''}`);
  if (!cond) failures += 1;
}

function startSmtp() {
  smtp = new SMTPServer({
    authOptional: true,
    disabledCommands: ['STARTTLS'],
    onAuth(auth, session, cb) { cb(null, { user: auth.username }); },
    onData(stream, session, cb) {
      simpleParser(stream).then((mail) => {
        inbox.push({
          to: mail.to.value[0].address,
          from: mail.from.text,
          subject: mail.subject,
          text: mail.text,
          html: mail.html,
          code: (mail.subject.match(/^(\d{6})/) || [])[1] || null,
        });
        cb();
      }).catch(cb);
    },
  });
  return new Promise((resolve) => smtp.listen(2525, '127.0.0.1', resolve));
}

async function waitMail(to, afterIndex = 0, timeoutMs = 4000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    const found = inbox.slice(afterIndex).find((m) => m.to === to);
    if (found) return found;
    await sleep(100);
  }
  return null;
}

async function main() {
  const db = new Client({
    host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  });
  await db.connect();
  await startSmtp();
  const q = async (sql, params) => (await db.query(sql, params)).rows;

  const U = { name: 'Nguyễn Văn An', email: 'an.test@example.com', phone: '+84 912 345 678', pass: 'Matkhau@1' };
  const PHONE = '0912345678';
  await q("DELETE FROM users WHERE phone = $1 OR email = $2", [PHONE, U.email]);
  await q('DELETE FROM email_otps');

  // ------------------------------------------------------------------ ĐĂNG KÝ
  console.log('\n=== ĐĂNG KÝ CÓ XÁC NHẬN EMAIL ===');
  let mark = inbox.length;
  let r = await http.post('/auth/register/request-code', { full_name: U.name, email: 'An.Test@Example.com', phone: U.phone, password: U.pass });
  check('gửi yêu cầu đăng ký -> 200', r.status === 200, JSON.stringify(r.data).slice(0, 100));
  check('phản hồi che bớt email (an***@example.com)', /^an\*+@example\.com$/.test(r.data.data.masked_email), r.data.data.masked_email);
  check('KHÔNG lộ mã trong phản hồi khi đã cấu hình gửi mail thật', r.data.data.dev_code === undefined);
  check('có thời hạn mã & thời gian chờ gửi lại', r.data.data.expires_in === 600 && r.data.data.resend_after === 60);

  const mail1 = await waitMail('an.test@example.com', mark);
  check('EMAIL ĐÃ ĐƯỢC GỬI tới hộp thư (địa chỉ chuẩn hoá chữ thường)', !!mail1);
  check('  -> người gửi là Gmail của shop (tên hiển thị FoodTrend)', mail1 && /FoodTrend/.test(mail1.from) && /shop\.foodtrend@gmail\.com/.test(mail1.from), mail1 && mail1.from);
  check('  -> tiêu đề bắt đầu bằng mã 6 số', mail1 && /^\d{6}$/.test(mail1.code), mail1 && mail1.subject);
  check('  -> nội dung HTML có thương hiệu + mã + thời hạn 10 phút', mail1 && mail1.html.includes('FoodTrend') && mail1.html.includes(mail1.code) && mail1.html.includes('10 phút'));
  check('  -> có bản văn bản thuần (cho trình đọc mail đơn giản)', mail1 && mail1.text.includes(mail1.code));
  const code1 = mail1.code;

  check('CHƯA tạo tài khoản khi chưa nhập mã', (await q('SELECT 1 FROM users WHERE phone=$1', [PHONE])).length === 0);
  const otpRow = (await q("SELECT code_hash, payload FROM email_otps WHERE purpose='REGISTER' AND email='an.test@example.com'"))[0];
  check('mã được lưu dạng BĂM (không lưu mã thô)', otpRow && otpRow.code_hash !== code1 && otpRow.code_hash.length === 64);
  check('mật khẩu trong hồ sơ chờ đã băm bcrypt, tên + số điện thoại đã chuẩn hoá', otpRow.payload.password_hash.startsWith('$2') && otpRow.payload.phone === PHONE && otpRow.payload.full_name === U.name);

  r = await http.post('/auth/register/verify', { email: U.email, code: code1 === '000000' ? '111111' : '000000' });
  check('nhập SAI mã -> 400 + báo còn 4 lần thử', r.status === 400 && /còn 4 lần/.test(r.data.message), r.data.message);
  check('  -> vẫn chưa tạo tài khoản', (await q('SELECT 1 FROM users WHERE phone=$1', [PHONE])).length === 0);

  r = await http.post('/auth/register/resend', { email: U.email });
  check('bấm gửi lại ngay lập tức -> 429 (chống spam)', r.status === 429 && /đợi/.test(r.data.message), r.data.message);

  r = await http.post('/auth/register/verify', { email: U.email, code: code1 });
  check('nhập ĐÚNG mã -> 201, tạo tài khoản + đăng nhập luôn', r.status === 201 && r.data.data.accessToken && r.data.data.refreshToken);
  check('  -> trả về mã chào mừng WELCOME20', r.data.data.welcome_coupon && r.data.data.welcome_coupon.code === 'WELCOME20');
  const user = (await q('SELECT full_name, phone, email, role, password_hash FROM users WHERE phone=$1', [PHONE]))[0];
  check('  -> ĐÃ LƯU vào bảng users (số chuẩn hoá, email thường, vai trò CUSTOMER)', user && user.phone === PHONE && user.email === 'an.test@example.com' && user.role === 'CUSTOMER');
  check('  -> mật khẩu băm bcrypt', user.password_hash.startsWith('$2'));
  check('  -> tự có giỏ hàng + mã WELCOME20 trong user_coupons',
    (await q('SELECT 1 FROM carts c JOIN users u ON u.id=c.user_id WHERE u.phone=$1', [PHONE])).length === 1 &&
    (await q("SELECT 1 FROM user_coupons uc JOIN users u ON u.id=uc.user_id JOIN coupons c ON c.id=uc.coupon_id WHERE u.phone=$1 AND c.code='WELCOME20'", [PHONE])).length === 1);

  r = await http.post('/auth/register/verify', { email: U.email, code: code1 });
  check('dùng LẠI mã đã dùng -> 400', r.status === 400, r.data.message);
  check('  -> không tạo thêm tài khoản', (await q('SELECT count(*)::int AS n FROM users WHERE phone=$1', [PHONE]))[0].n === 1);

  r = await http.post('/auth/login', { identifier: 'an.test@example.com', password: U.pass });
  check('đăng nhập bằng EMAIL -> 200', r.status === 200);
  r = await http.post('/auth/login', { identifier: '0912 345 678', password: U.pass });
  check('đăng nhập bằng SỐ ĐIỆN THOẠI (gõ có dấu cách) -> 200', r.status === 200);
  r = await http.post('/auth/login', { identifier: 'AN.TEST@EXAMPLE.COM', password: U.pass });
  check('đăng nhập bằng email viết HOA -> 200', r.status === 200);
  r = await http.post('/auth/login', { phone: PHONE, password: U.pass });
  check('tương thích kiểu cũ (trường "phone") -> 200', r.status === 200);
  r = await http.post('/auth/login', { identifier: 'an.test@example.com', password: 'sai-mat-khau' });
  check('sai mật khẩu -> 401', r.status === 401);

  r = await http.post('/auth/register/request-code', { full_name: 'Khác', email: 'an.test@example.com', phone: '0987654321', password: 'abcdef' });
  check('đăng ký lại bằng EMAIL đã dùng -> 409', r.status === 409, r.data.message);
  r = await http.post('/auth/register/request-code', { full_name: 'Khác', email: 'khac@example.com', phone: '0912 345 678', password: 'abcdef' });
  check('đăng ký lại bằng SĐT đã dùng (gõ kiểu khác) -> 409', r.status === 409, r.data.message);
  r = await http.post('/auth/register/request-code', { full_name: 'Khách Hàng', email: 'khong-phai-email', phone: '0987654321', password: 'abcdef' });
  check('email sai định dạng -> 400', r.status === 400, r.data.message);
  r = await http.post('/auth/register/request-code', { full_name: 'Khác', email: 'x@example.com', phone: '12345', password: 'abcdef' });
  check('số điện thoại sai định dạng -> 400', r.status === 400, r.data.message);
  r = await http.post('/auth/register/request-code', { full_name: 'Khác', email: 'x@example.com', phone: '0987654321', password: '123' });
  check('mật khẩu quá ngắn -> 400', r.status === 400, r.data.message);

  // ---------- nhập sai quá số lần
  console.log('\n=== GIỚI HẠN NHẬP SAI / HẾT HẠN / GỬI LẠI ===');
  mark = inbox.length;
  await http.post('/auth/register/request-code', { full_name: 'Trần Bình', email: 'binh@example.com', phone: '0911000111', password: 'abcdef' });
  const mailB = await waitMail('binh@example.com', mark);
  let last;
  for (let i = 0; i < 5; i += 1) last = await http.post('/auth/register/verify', { email: 'binh@example.com', code: mailB.code === '999999' ? '888888' : '999999' });
  check('nhập sai 5 lần -> 429 và mã bị vô hiệu hoá', last.status === 429, last.data.message);
  r = await http.post('/auth/register/verify', { email: 'binh@example.com', code: mailB.code });
  check('  -> sau đó nhập mã ĐÚNG cũng không được (phải xin mã mới)', r.status === 400 && (await q("SELECT 1 FROM users WHERE phone='0911000111'")).length === 0, r.data.message);

  // ---------- hết hạn
  mark = inbox.length;
  await http.post('/auth/register/request-code', { full_name: 'Lê Chi', email: 'chi@example.com', phone: '0911000222', password: 'abcdef' });
  const mailC = await waitMail('chi@example.com', mark);
  await q("UPDATE email_otps SET expires_at = CURRENT_TIMESTAMP - INTERVAL '1 minute' WHERE email='chi@example.com'");
  r = await http.post('/auth/register/verify', { email: 'chi@example.com', code: mailC.code });
  check('mã HẾT HẠN -> 400 "đã hết hạn"', r.status === 400 && /hết hạn/.test(r.data.message), r.data.message);
  check('  -> không tạo tài khoản', (await q("SELECT 1 FROM users WHERE phone='0911000222'")).length === 0);

  // ---------- gửi lại sau thời gian chờ -> mã mới, mã cũ vô hiệu
  mark = inbox.length;
  await http.post('/auth/register/request-code', { full_name: 'Phạm Dũng', email: 'dung@example.com', phone: '0911000333', password: 'abcdef' });
  const mailD1 = await waitMail('dung@example.com', mark);
  await q("UPDATE email_otps SET last_sent_at = CURRENT_TIMESTAMP - INTERVAL '2 minutes' WHERE email='dung@example.com'");
  mark = inbox.length;
  r = await http.post('/auth/register/resend', { email: 'dung@example.com' });
  check('gửi lại mã sau khi hết thời gian chờ -> 200', r.status === 200, r.data.message);
  const mailD2 = await waitMail('dung@example.com', mark);
  check('  -> nhận email thứ 2 chứa mã mới', !!mailD2 && /^\d{6}$/.test(mailD2.code));
  r = await http.post('/auth/register/verify', { email: 'dung@example.com', code: mailD1.code === mailD2.code ? '000001' : mailD1.code });
  check('  -> mã CŨ không còn dùng được', r.status === 400, r.data.message);
  r = await http.post('/auth/register/verify', { email: 'dung@example.com', code: mailD2.code });
  check('  -> mã MỚI hoạt động, tài khoản được tạo', r.status === 201 && (await q("SELECT 1 FROM users WHERE phone='0911000333'")).length === 1);
  r = await http.post('/auth/register/resend', { email: 'khong.ton.tai@example.com' });
  check('gửi lại cho email chưa từng đăng ký -> 400 "phiên đã hết hạn"', r.status === 400, r.data.message);

  // ---------- gửi mail thất bại -> 502 và không để lại mã kẹt
  console.log('\n=== SMTP/GMAIL LỖI ===');
  await new Promise((res) => smtp.close(res));
  r = await http.post('/auth/register/request-code', { full_name: 'Võ Em', email: 'em@example.com', phone: '0911000444', password: 'abcdef' });
  check('Gmail lỗi/không kết nối được -> 502 báo rõ ràng', r.status === 502 && /Không gửi được email/.test(r.data.message), r.data.message);
  check('  -> không để lại mã chờ (người dùng không bị kẹt thời gian chờ gửi lại)', (await q("SELECT 1 FROM email_otps WHERE email='em@example.com' AND consumed_at IS NULL")).length === 0);
  await startSmtp();

  // ------------------------------------------------------------ QUÊN MẬT KHẨU
  console.log('\n=== QUÊN MẬT KHẨU QUA EMAIL ===');
  mark = inbox.length;
  const unknown = await http.post('/auth/forgot-password', { identifier: 'khong.ton.tai@example.com' });
  await sleep(600);
  check('email KHÔNG tồn tại -> vẫn trả lời thành công (không lộ ai đã đăng ký)', unknown.status === 200);
  check('  -> KHÔNG có email nào được gửi', inbox.length === mark);

  mark = inbox.length;
  const known = await http.post('/auth/forgot-password', { identifier: 'an.test@example.com' });
  check('email tồn tại -> 200', known.status === 200);
  check('  -> phản hồi GIỐNG HỆT trường hợp không tồn tại (cùng nội dung)', known.data.message === unknown.data.message && Object.keys(known.data.data).sort().join() === Object.keys(unknown.data.data).sort().join());
  const mailR = await waitMail('an.test@example.com', mark);
  check('  -> email mã đặt lại mật khẩu đã gửi', !!mailR && /\d{6}/.test(mailR.code || '') && /đặt lại mật khẩu/.test(mailR.subject), mailR && mailR.subject);

  r = await http.post('/auth/reset-password', { identifier: 'an.test@example.com', code: mailR.code === '123123' ? '321321' : '123123', new_password: 'MatKhauMoi@2' });
  check('đặt lại bằng mã SAI -> 400', r.status === 400, r.data.message);
  r = await http.post('/auth/reset-password', { identifier: 'an.test@example.com', code: mailR.code, new_password: '123' });
  check('mật khẩu mới quá ngắn -> 400', r.status === 400, r.data.message);

  mark = inbox.length;
  r = await http.post('/auth/reset-password', { identifier: 'an.test@example.com', code: mailR.code, new_password: 'MatKhauMoi@2' });
  check('đặt lại bằng mã ĐÚNG -> 200', r.status === 200, r.data.message);
  r = await http.post('/auth/login', { identifier: 'an.test@example.com', password: 'MatKhauMoi@2' });
  check('  -> đăng nhập bằng mật khẩu MỚI thành công', r.status === 200);
  r = await http.post('/auth/login', { identifier: 'an.test@example.com', password: U.pass });
  check('  -> mật khẩu CŨ không còn dùng được', r.status === 401);
  r = await http.post('/auth/reset-password', { identifier: 'an.test@example.com', code: mailR.code, new_password: 'KhacNua@3' });
  check('  -> dùng lại mã đã dùng -> 400', r.status === 400, r.data.message);
  const mailChanged = await waitMail('an.test@example.com', mark);
  check('  -> có email BÁO "mật khẩu đã được thay đổi"', !!mailChanged && /vừa được thay đổi/.test(mailChanged.subject), mailChanged && mailChanged.subject);

  await q('UPDATE email_otps SET last_sent_at = last_sent_at - INTERVAL \'2 minutes\' WHERE consumed_at IS NULL');
  mark = inbox.length;
  r = await http.post('/auth/forgot-password', { identifier: '0912 345 678' });
  const mailByPhone = await waitMail('an.test@example.com', mark);
  check('quên mật khẩu bằng SỐ ĐIỆN THOẠI -> mã gửi tới email của tài khoản đó', r.status === 200 && !!mailByPhone);

  mark = inbox.length;
  r = await http.post('/auth/forgot-password', { identifier: '0912 345 678' });
  await sleep(500);
  check('bấm gửi lại quá nhanh -> không gửi thêm email (không lộ, không spam)', r.status === 200 && inbox.length === mark);

  // --------------------------------------------------------------- RATE LIMIT
  console.log('\n=== GIỚI HẠN TẦN SUẤT (RATE LIMIT) ===');
  const app = express();
  app.use(rateLimit({ windowMs: 1000, max: 3 }));
  app.get('/ping', (req, res) => res.json({ ok: true }));
  const srv = await new Promise((res) => { const s = app.listen(4555, () => res(s)); });
  const codes = [];
  for (let i = 0; i < 5; i += 1) codes.push((await axios.get('http://localhost:4555/ping', { validateStatus: () => true })).status);
  check('3 request đầu OK, các request sau bị chặn 429', codes.join() === '200,200,200,429,429', codes.join());
  await sleep(1100);
  check('sau khi hết khung thời gian thì dùng lại được', (await axios.get('http://localhost:4555/ping', { validateStatus: () => true })).status === 200);
  srv.close();

  // dọn dẹp dữ liệu test
  await q("DELETE FROM users WHERE email IN ('an.test@example.com','dung@example.com')");
  await q('DELETE FROM email_otps');
  await db.end();
  await new Promise((res) => smtp.close(res));

  console.log(failures === 0 ? '\n######## TẤT CẢ TEST EMAIL / ĐĂNG KÝ / QUÊN MẬT KHẨU PASSED ########' : `\n######## ${failures} TEST FAILED ########`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => { console.error('TEST ERROR:', err); process.exit(1); });
