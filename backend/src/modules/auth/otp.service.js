const crypto = require('crypto');
const { query } = require('../../config/db');
const AppError = require('../../utils/AppError');
const env = require('../../config/env');

const { ttlMinutes, resendSeconds, maxAttempts, maxSendsPerHour } = env.otp;

function generateCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

// Chỉ lưu bản BĂM của mã (kèm email + mục đích + secret của server) — lộ DB cũng không đọc được mã.
function hashCode(purpose, email, code) {
  return crypto.createHmac('sha256', env.jwt.accessSecret).update(`${purpose}|${email}|${code}`).digest('hex');
}

function safeEqual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

async function findActive(purpose, email) {
  const res = await query(
    `SELECT *, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_sent_at)) AS since_sent,
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)) AS since_created,
            (expires_at <= CURRENT_TIMESTAMP) AS is_expired
     FROM email_otps WHERE purpose = $1 AND email = $2 AND consumed_at IS NULL`,
    [purpose, email]
  );
  return res.rows[0] || null;
}

/**
 * Tạo (hoặc thay) mã mới cho (purpose, email).
 * Ném 429 nếu gửi quá nhanh (cooldown) hoặc quá nhiều lần trong 1 giờ.
 * Trả về mã THÔ để nơi gọi gửi email — mã thô không bao giờ được lưu.
 */
async function issue({ purpose, email, payload = null }) {
  await query(`DELETE FROM email_otps WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '1 day'`);

  const existing = await findActive(purpose, email);
  let sendCount = 1;

  if (existing) {
    const elapsed = Number(existing.since_sent);
    if (elapsed < resendSeconds) {
      const wait = Math.ceil(resendSeconds - elapsed);
      throw new AppError(`Vui lòng đợi ${wait} giây trước khi yêu cầu gửi lại mã.`, 429, { retry_after: wait });
    }
    const withinHour = Number(existing.since_created) < 3600;
    if (withinHour && existing.send_count >= maxSendsPerHour) {
      throw new AppError('Bạn đã yêu cầu gửi mã quá nhiều lần. Vui lòng thử lại sau khoảng 1 giờ.', 429, { retry_after: 3600 });
    }
    sendCount = withinHour ? existing.send_count + 1 : 1;
  }

  const code = generateCode();
  await query(
    `INSERT INTO email_otps (purpose, email, code_hash, payload, attempts, send_count, last_sent_at, expires_at)
     VALUES ($1, $2, $3, $4, 0, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + ($6 || ' minutes')::interval)
     ON CONFLICT (purpose, email) WHERE consumed_at IS NULL
     DO UPDATE SET code_hash = EXCLUDED.code_hash, payload = EXCLUDED.payload, attempts = 0,
                   send_count = $5, last_sent_at = CURRENT_TIMESTAMP, expires_at = EXCLUDED.expires_at`,
    [purpose, email, hashCode(purpose, email, code), payload ? JSON.stringify(payload) : null, sendCount, String(ttlMinutes)]
  );

  return { code, expiresInSeconds: ttlMinutes * 60, resendAfterSeconds: resendSeconds };
}

// Gửi email lỗi -> bỏ mã vừa tạo để người dùng không bị kẹt trong thời gian chờ "gửi lại"
async function discard(purpose, email) {
  await query(
    `UPDATE email_otps SET consumed_at = CURRENT_TIMESTAMP WHERE purpose = $1 AND email = $2 AND consumed_at IS NULL`,
    [purpose, email]
  );
}

/**
 * Kiểm tra mã người dùng nhập. Đúng -> trả về bản ghi (người gọi tự "claim" trong transaction).
 * Sai -> tăng số lần thử; quá giới hạn thì vô hiệu hoá mã.
 */
async function check({ purpose, email, code }) {
  const cleaned = String(code || '').replace(/\D/g, '');
  if (cleaned.length !== 6) throw new AppError('Mã xác nhận gồm 6 chữ số.', 400);

  const rec = await findActive(purpose, email);
  if (!rec) throw new AppError('Mã không đúng hoặc đã hết hạn. Hãy yêu cầu gửi mã mới.', 400);

  if (rec.is_expired) {
    await discard(purpose, email);
    throw new AppError('Mã đã hết hạn. Hãy yêu cầu gửi mã mới.', 400);
  }
  if (rec.attempts >= maxAttempts) {
    await discard(purpose, email);
    throw new AppError('Bạn đã nhập sai quá nhiều lần. Hãy yêu cầu gửi mã mới.', 429);
  }

  if (!safeEqual(hashCode(purpose, email, cleaned), rec.code_hash)) {
    const upd = await query('UPDATE email_otps SET attempts = attempts + 1 WHERE id = $1 RETURNING attempts', [rec.id]);
    const left = maxAttempts - upd.rows[0].attempts;
    if (left <= 0) {
      await discard(purpose, email);
      throw new AppError('Bạn đã nhập sai quá nhiều lần. Hãy yêu cầu gửi mã mới.', 429);
    }
    throw new AppError(`Mã không đúng. Bạn còn ${left} lần thử.`, 400, { attempts_left: left });
  }
  return rec;
}

// Bản ghi đang chờ còn hạn (dùng cho "gửi lại mã" của đăng ký, lấy lại payload)
async function getPending(purpose, email) {
  const rec = await findActive(purpose, email);
  return rec && !rec.is_expired ? rec : null;
}

module.exports = { issue, check, discard, getPending, ttlMinutes, resendSeconds, maxAttempts };
