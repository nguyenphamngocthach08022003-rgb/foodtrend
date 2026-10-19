const { fail } = require('../utils/apiResponse');

// Giới hạn số request theo IP trong 1 khoảng thời gian (lưu trong RAM, đủ dùng cho 1 server).
function rateLimit({ windowMs, max, message }) {
  const hits = new Map(); // ip -> { count, resetAt }

  setInterval(() => {
    const now = Date.now();
    hits.forEach((v, k) => { if (v.resetAt <= now) hits.delete(k); });
  }, windowMs).unref();

  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return fail(res, message || 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.', 429, { retry_after: retryAfter });
    }
    return next();
  };
}

module.exports = rateLimit;
