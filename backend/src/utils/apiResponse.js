function ok(res, data = null, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

function paginated(res, items, pagination, message = 'OK') {
  return res.status(200).json({ success: true, message, data: items, pagination });
}

function fail(res, message = 'Có lỗi xảy ra', statusCode = 400, details = null) {
  return res.status(statusCode).json({ success: false, message, details });
}

module.exports = { ok, paginated, fail };
