const { fail } = require('../utils/apiResponse');

function notFoundHandler(req, res) {
  return fail(res, `Không tìm thấy đường dẫn: ${req.method} ${req.originalUrl}`, 404);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  // Postgres unique_violation
  if (err.code === '23505') {
    return fail(res, 'Dữ liệu đã tồn tại (trùng lặp).', 409, err.detail);
  }
  // Postgres foreign_key_violation
  if (err.code === '23503') {
    return fail(res, 'Dữ liệu liên quan không hợp lệ hoặc đã bị xoá.', 409, err.detail);
  }
  // Postgres check_violation
  if (err.code === '23514') {
    return fail(res, 'Dữ liệu không hợp lệ.', 400, err.detail);
  }

  return fail(res, err.message || 'Lỗi máy chủ nội bộ.', statusCode, err.details || null);
}

module.exports = { notFoundHandler, errorHandler };
