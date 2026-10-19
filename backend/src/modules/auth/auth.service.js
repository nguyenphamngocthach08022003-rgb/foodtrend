const { query, withTransaction } = require('../../config/db');
const { hashPassword, comparePassword } = require('../../utils/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const AppError = require('../../utils/AppError');
const otp = require('./otp.service');
const mail = require('../mail/mail.service');

const PUBLIC_FIELDS = 'id, full_name, email, phone, role, is_active, created_at';
const WELCOME_COUPON_CODE = 'WELCOME20'; // tặng cho thành viên mới (nếu mã còn hiệu lực trong bảng coupons)

const PHONE_REGEX = /^0\d{9,10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---- Tiện ích --------------------------------------------------------------

function toAuthPayload(user) {
  return { id: user.id, role: user.role, phone: user.phone };
}

async function issueTokens(user) {
  const payload = toAuthPayload(user);
  return { accessToken: signAccessToken(payload), refreshToken: signRefreshToken(payload) };
}

// "+84 912 345 678", "0912.345.678", "84912345678" -> "0912345678"
function normalizePhone(raw) {
  if (raw === undefined || raw === null) return '';
  let p = String(raw).replace(/[\s.\-()]/g, '');
  if (p.startsWith('+84')) p = `0${p.slice(3)}`;
  else if (/^84\d{9,10}$/.test(p)) p = `0${p.slice(2)}`;
  return p;
}

const normalizeEmail = (raw) => String(raw || '').trim().toLowerCase();

// an***@gmail.com
function maskEmail(email) {
  const [local, domain] = email.split('@');
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}

// Khi CHƯA cấu hình Gmail (chỉ dev), trả mã trong response để vẫn thử được luồng. Không bao giờ ở production.
const devCodeAllowed = (sendResult) => sendResult.devMode && process.env.NODE_ENV !== 'production';

async function findUserByIdentifier(raw) {
  const id = String(raw || '').trim();
  if (!id) return null;
  const res = id.includes('@')
    ? await query('SELECT * FROM users WHERE lower(email) = lower($1)', [id])
    : await query('SELECT * FROM users WHERE phone = $1', [normalizePhone(id)]);
  return res.rows[0] || null;
}

// ---- Tạo khách hàng (dùng bởi bước xác nhận đăng ký) -----------------------

async function createCustomer(client, { full_name, email, phone, password_hash }) {
  const userRes = await client.query(
    `INSERT INTO users (full_name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, 'CUSTOMER') RETURNING ${PUBLIC_FIELDS}`,
    [full_name, email, phone, password_hash]
  );
  const created = userRes.rows[0];

  await client.query('INSERT INTO carts (user_id) VALUES ($1)', [created.id]); // mỗi khách có sẵn 1 giỏ hàng

  // Tặng mã chào mừng — làm "tốt nhất có thể": lỗi ở bước này KHÔNG được làm hỏng việc đăng ký
  let coupon = null;
  await client.query('SAVEPOINT welcome_coupon');
  try {
    const couponRes = await client.query(
      `SELECT id, code, description, discount_type, discount_value, min_order_amount, max_discount_amount, end_at
       FROM coupons
       WHERE code = $1 AND is_active = TRUE AND start_at <= CURRENT_TIMESTAMP AND end_at > CURRENT_TIMESTAMP
         AND (usage_limit IS NULL OR used_count < usage_limit)`,
      [WELCOME_COUPON_CODE]
    );
    if (couponRes.rows[0]) {
      await client.query('INSERT INTO user_coupons (user_id, coupon_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
        created.id,
        couponRes.rows[0].id,
      ]);
      coupon = couponRes.rows[0];
    }
  } catch (err) {
    await client.query('ROLLBACK TO SAVEPOINT welcome_coupon');
    coupon = null;
  }
  return { user: created, welcomeCoupon: coupon };
}

// ---- ĐĂNG KÝ: bước 1 — nhận thông tin, gửi mã về email ---------------------

async function requestRegisterCode({ full_name, email, phone, password }) {
  const name = String(full_name || '').trim();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  if (!name || !normalizedEmail || !normalizedPhone || !password) {
    throw new AppError('Vui lòng nhập đầy đủ họ tên, email, số điện thoại và mật khẩu.', 400);
  }
  if (name.length < 2) throw new AppError('Họ tên quá ngắn.', 400);
  if (!EMAIL_REGEX.test(normalizedEmail)) throw new AppError('Email không hợp lệ.', 400);
  if (!PHONE_REGEX.test(normalizedPhone)) {
    throw new AppError('Số điện thoại không hợp lệ (cần 10-11 chữ số, bắt đầu bằng 0).', 400);
  }
  if (String(password).length < 6) throw new AppError('Mật khẩu phải có ít nhất 6 ký tự.', 400);

  if ((await query('SELECT 1 FROM users WHERE phone = $1', [normalizedPhone])).rows.length) {
    throw new AppError('Số điện thoại này đã được đăng ký. Hãy đăng nhập hoặc dùng số khác.', 409);
  }
  if ((await query('SELECT 1 FROM users WHERE lower(email) = $1', [normalizedEmail])).rows.length) {
    throw new AppError('Email này đã được sử dụng cho tài khoản khác.', 409);
  }

  const password_hash = await hashPassword(password);
  const issued = await otp.issue({
    purpose: 'REGISTER',
    email: normalizedEmail,
    payload: { full_name: name, phone: normalizedPhone, password_hash },
  });

  let sent;
  try {
    sent = await mail.sendRegisterCode({ to: normalizedEmail, name, code: issued.code, ttlMinutes: otp.ttlMinutes });
  } catch (err) {
    await otp.discard('REGISTER', normalizedEmail);
    // eslint-disable-next-line no-console
    console.error(`[mail] Gửi mã đăng ký thất bại tới ${normalizedEmail}: ${mail.explainMailError(err)}`);
    throw new AppError('Không gửi được email xác nhận. Hãy kiểm tra địa chỉ email rồi thử lại sau ít phút.', 502);
  }

  return {
    email: normalizedEmail,
    masked_email: maskEmail(normalizedEmail),
    expires_in: issued.expiresInSeconds,
    resend_after: issued.resendAfterSeconds,
    ...(devCodeAllowed(sent) ? { dev_code: issued.code } : {}),
  };
}

// ---- ĐĂNG KÝ: gửi lại mã ----------------------------------------------------

async function resendRegisterCode({ email }) {
  const normalizedEmail = normalizeEmail(email);
  const pending = normalizedEmail ? await otp.getPending('REGISTER', normalizedEmail) : null;
  if (!pending) {
    throw new AppError('Phiên đăng ký đã hết hạn. Vui lòng điền lại thông tin để nhận mã mới.', 400);
  }
  const issued = await otp.issue({ purpose: 'REGISTER', email: normalizedEmail, payload: pending.payload });

  let sent;
  try {
    sent = await mail.sendRegisterCode({
      to: normalizedEmail, name: pending.payload.full_name, code: issued.code, ttlMinutes: otp.ttlMinutes,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[mail] Gửi lại mã thất bại tới ${normalizedEmail}: ${mail.explainMailError(err)}`);
    throw new AppError('Không gửi được email. Vui lòng thử lại sau ít phút.', 502);
  }
  return {
    email: normalizedEmail,
    masked_email: maskEmail(normalizedEmail),
    expires_in: issued.expiresInSeconds,
    resend_after: issued.resendAfterSeconds,
    ...(devCodeAllowed(sent) ? { dev_code: issued.code } : {}),
  };
}

// ---- ĐĂNG KÝ: bước 2 — nhập đúng mã mới tạo tài khoản ----------------------

async function verifyRegister({ email, code }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new AppError('Thiếu email.', 400);

  const rec = await otp.check({ purpose: 'REGISTER', email: normalizedEmail, code });
  const { full_name, phone, password_hash } = rec.payload || {};
  if (!full_name || !phone || !password_hash) {
    throw new AppError('Dữ liệu đăng ký không hợp lệ. Vui lòng đăng ký lại.', 400);
  }

  const { user, welcomeCoupon } = await withTransaction(async (client) => {
    // "Chiếm" mã trong cùng transaction: bấm xác nhận 2 lần cũng chỉ tạo 1 tài khoản
    const claim = await client.query(
      'UPDATE email_otps SET consumed_at = CURRENT_TIMESTAMP WHERE id = $1 AND consumed_at IS NULL RETURNING id',
      [rec.id]
    );
    if (!claim.rows[0]) throw new AppError('Mã này đã được sử dụng.', 400);

    // Kiểm tra lại (đề phòng trong lúc chờ mã có người khác đăng ký trùng)
    if ((await client.query('SELECT 1 FROM users WHERE phone = $1', [phone])).rows.length) {
      throw new AppError('Số điện thoại này vừa được đăng ký bởi tài khoản khác.', 409);
    }
    if ((await client.query('SELECT 1 FROM users WHERE lower(email) = $1', [normalizedEmail])).rows.length) {
      throw new AppError('Email này vừa được đăng ký bởi tài khoản khác.', 409);
    }
    return createCustomer(client, { full_name, email: normalizedEmail, phone, password_hash });
  });

  const tokens = await issueTokens(user);
  return { user, ...tokens, welcome_coupon: welcomeCoupon };
}

// ---- ĐĂNG NHẬP (bằng email HOẶC số điện thoại) -----------------------------

async function login({ identifier, phone, password }) {
  const raw = String(identifier ?? phone ?? '').trim();
  if (!raw || !password) {
    throw new AppError('Vui lòng nhập email / số điện thoại và mật khẩu.', 400);
  }
  const user = await findUserByIdentifier(raw);
  if (!user) throw new AppError('Tài khoản hoặc mật khẩu không đúng.', 401);
  if (!user.is_active) throw new AppError('Tài khoản đã bị khoá.', 403);

  const validPassword = await comparePassword(password, user.password_hash);
  if (!validPassword) throw new AppError('Tài khoản hoặc mật khẩu không đúng.', 401);

  const tokens = await issueTokens(user);
  delete user.password_hash;
  return { user, ...tokens };
}

async function refresh(refreshToken) {
  if (!refreshToken) throw new AppError('Thiếu refresh token.', 400);
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new AppError('Refresh token không hợp lệ hoặc đã hết hạn.', 401);
  }
  const res = await query(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = $1`, [payload.id]);
  const user = res.rows[0];
  if (!user || !user.is_active) throw new AppError('Tài khoản không hợp lệ.', 401);
  const tokens = await issueTokens(user);
  return { user, ...tokens };
}

async function getProfile(userId) {
  const res = await query(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = $1`, [userId]);
  if (!res.rows[0]) throw new AppError('Không tìm thấy người dùng.', 404);
  return res.rows[0];
}

async function updateProfile(userId, { full_name, email }) {
  const newEmail = email ? normalizeEmail(email) : null;
  if (newEmail) {
    if (!EMAIL_REGEX.test(newEmail)) throw new AppError('Email không hợp lệ.', 400);
    const dup = await query('SELECT 1 FROM users WHERE lower(email) = $1 AND id <> $2', [newEmail, userId]);
    if (dup.rows.length) throw new AppError('Email này đã được sử dụng cho tài khoản khác.', 409);
  }
  const res = await query(
    `UPDATE users SET full_name = COALESCE($1, full_name), email = COALESCE($2, email)
     WHERE id = $3 RETURNING ${PUBLIC_FIELDS}`,
    [full_name ? String(full_name).trim() : null, newEmail, userId]
  );
  if (!res.rows[0]) throw new AppError('Không tìm thấy người dùng.', 404);
  return res.rows[0];
}

async function changePassword(userId, { old_password, new_password }) {
  if (!old_password || !new_password) {
    throw new AppError('Vui lòng nhập mật khẩu cũ và mật khẩu mới.', 400);
  }
  if (new_password.length < 6) {
    throw new AppError('Mật khẩu mới phải có ít nhất 6 ký tự.', 400);
  }
  const res = await query('SELECT * FROM users WHERE id = $1', [userId]);
  const user = res.rows[0];
  if (!user) throw new AppError('Không tìm thấy người dùng.', 404);

  const valid = await comparePassword(old_password, user.password_hash);
  if (!valid) throw new AppError('Mật khẩu cũ không đúng.', 401);

  const newHash = await hashPassword(new_password);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);
  return true;
}

// ---- QUÊN MẬT KHẨU qua email -------------------------------------------------

const GENERIC_FORGOT_MESSAGE =
  'Nếu tài khoản tồn tại, mã xác nhận đã được gửi tới email đã đăng ký của tài khoản đó. Mã có hiệu lực trong ít phút.';

async function forgotPassword({ identifier, phone }) {
  const raw = String(identifier ?? phone ?? '').trim();
  if (!raw) throw new AppError('Vui lòng nhập email hoặc số điện thoại đã đăng ký.', 400);

  const base = { message: GENERIC_FORGOT_MESSAGE, expires_in: otp.ttlMinutes * 60, resend_after: otp.resendSeconds };
  const user = await findUserByIdentifier(raw);

  // Luôn trả lời GIỐNG NHAU dù tài khoản có tồn tại hay không (không để lộ ai đã đăng ký)
  if (!user || !user.email || !user.is_active) return base;
  const email = normalizeEmail(user.email);

  let issued;
  try {
    issued = await otp.issue({ purpose: 'RESET_PASSWORD', email, payload: { user_id: user.id } });
  } catch (err) {
    if (err.statusCode === 429) return base; // đang trong thời gian chờ -> không gửi thêm, không báo lỗi
    throw err;
  }

  try {
    const sent = await mail.sendResetCode({ to: email, name: user.full_name, code: issued.code, ttlMinutes: otp.ttlMinutes });
    return { ...base, ...(devCodeAllowed(sent) ? { dev_code: issued.code } : {}) };
  } catch (err) {
    await otp.discard('RESET_PASSWORD', email);
    // eslint-disable-next-line no-console
    console.error(`[mail] Gửi mã đặt lại mật khẩu thất bại tới ${email}: ${mail.explainMailError(err)}`);
    return base;
  }
}

async function resetPassword({ identifier, phone, code, new_password }) {
  if (!new_password || String(new_password).length < 6) {
    throw new AppError('Mật khẩu mới phải có ít nhất 6 ký tự.', 400);
  }
  const user = await findUserByIdentifier(identifier ?? phone);
  if (!user || !user.email) throw new AppError('Mã không đúng hoặc đã hết hạn. Hãy yêu cầu gửi mã mới.', 400);
  const email = normalizeEmail(user.email);

  const rec = await otp.check({ purpose: 'RESET_PASSWORD', email, code });
  const newHash = await hashPassword(new_password);

  await withTransaction(async (client) => {
    const claim = await client.query(
      'UPDATE email_otps SET consumed_at = CURRENT_TIMESTAMP WHERE id = $1 AND consumed_at IS NULL RETURNING id',
      [rec.id]
    );
    if (!claim.rows[0]) throw new AppError('Mã này đã được sử dụng.', 400);
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
  });

  // Email báo "mật khẩu vừa đổi" (lỗi gửi mail không làm hỏng việc đổi mật khẩu)
  mail.sendPasswordChanged({ to: email, name: user.full_name }).catch((err) => {
    // eslint-disable-next-line no-console
    console.error(`[mail] Không gửi được email báo đổi mật khẩu: ${mail.explainMailError(err)}`);
  });
  return true;
}

module.exports = {
  requestRegisterCode,
  resendRegisterCode,
  verifyRegister,
  login,
  refresh,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  normalizePhone,
};
