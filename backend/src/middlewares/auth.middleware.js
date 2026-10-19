const { verifyAccessToken } = require('../utils/jwt');
const { fail } = require('../utils/apiResponse');

// Requires a valid access token. Attaches { id, role, phone } to req.user
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return fail(res, 'Bạn cần đăng nhập để thực hiện thao tác này.', 401);
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (err) {
    return fail(res, 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.', 401);
  }
}

// Attaches req.user if a valid token is present, but does not block guests.
// Used for endpoints like product detail (favorited flag) or view tracking.
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return next();

  try {
    req.user = verifyAccessToken(token);
  } catch (err) {
    // ignore invalid token for optional auth
  }
  return next();
}

module.exports = { requireAuth, optionalAuth };
