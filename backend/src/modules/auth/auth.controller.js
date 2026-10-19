const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/apiResponse');
const authService = require('./auth.service');

// ---- Đăng ký có xác nhận email (3 bước: gửi mã -> [gửi lại] -> nhập mã) ----
exports.requestRegisterCode = asyncHandler(async (req, res) => {
  const result = await authService.requestRegisterCode(req.body);
  return ok(res, result, 'Đã gửi mã xác nhận tới email của bạn.');
});

exports.resendRegisterCode = asyncHandler(async (req, res) => {
  const result = await authService.resendRegisterCode(req.body);
  return ok(res, result, 'Đã gửi lại mã xác nhận.');
});

exports.verifyRegister = asyncHandler(async (req, res) => {
  const result = await authService.verifyRegister(req.body);
  return ok(res, result, 'Đăng ký thành công.', 201);
});

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return ok(res, result, 'Đăng nhập thành công.');
});

exports.refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.body.refreshToken);
  return ok(res, result, 'Làm mới token thành công.');
});

exports.me = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  return ok(res, user);
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  return ok(res, user, 'Cập nhật thông tin thành công.');
});

exports.changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  return ok(res, null, 'Đổi mật khẩu thành công.');
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body);
  return ok(res, result, result.message);
});

exports.resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  return ok(res, null, 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.');
});
