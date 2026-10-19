const { fail } = require('../utils/apiResponse');

// Must be used AFTER requireAuth
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return fail(res, 'Bạn không có quyền truy cập chức năng quản trị.', 403);
  }
  return next();
}

module.exports = { requireAdmin };
